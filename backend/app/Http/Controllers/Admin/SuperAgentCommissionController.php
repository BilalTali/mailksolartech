<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EnterAgentCommissionRequest;
use App\Http\Requests\MarkCommissionPaidRequest;
use App\Http\Requests\UpdateCommissionRequest;
use App\Models\Commission;
use App\Models\Lead;
use App\Services\CommissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SuperAgentCommissionController extends Controller
{
    private CommissionService $commissionService;

    public function __construct(CommissionService $commissionService)
    {
        $this->commissionService = $commissionService;
    }

    public function index(Request $request): JsonResponse
    {
        $superAgent = $request->user();

        // Return commissions where super agent is:
        // 1. the payee (earnings)
        // 2. the enterer (payouts)
        // 3. the natural parent of the payee
        // 4. the assigned super agent for the lead (dynamic parent)
        $query = Commission::query()->with(['lead', 'payee', 'enteredBy', 'paidBy'])
            ->where(function ($q) use ($superAgent) {
                $q->where('payee_id', $superAgent->id)
                  ->orWhere(function ($subQ) use ($superAgent) {
                      $subQ->where('payee_id', '!=', $superAgent->id)
                           ->whereIn('payee_role', ['agent', 'enumerator'])
                           ->where(function ($q2) use ($superAgent) {
                               $q2->where('entered_by', $superAgent->id)
                                  ->orWhereHas('payee', fn ($pq) => $pq->where('parent_id', $superAgent->id))
                                  ->orWhereHas('lead', fn ($lq) => $lq->where('assigned_super_agent_id', $superAgent->id));
                           });
                  });
            });

        // Apply status/view filter
        if ($request->filled('filter')) {
            $f = $request->filter;
            if ($f === 'pending_my_payment') {
                $query->where('payee_id', $superAgent->id)->where('payment_status', 'unpaid');
            } elseif ($f === 'fully_paid') {
                $query->where('payee_id', $superAgent->id)->where('payment_status', 'paid');
            } elseif ($f === 'pending_to_pay') {
                $query->where('payee_id', '!=', $superAgent->id)->where('payment_status', 'unpaid');
            } elseif ($f === 'all_my_earnings') {
                $query->where('payee_id', $superAgent->id);
            } elseif ($f === 'all_to_pay') {
                $query->where('payee_id', '!=', $superAgent->id);
            } elseif ($f === 'payouts_paid') {
                $query->where('payee_id', '!=', $superAgent->id)->where('payment_status', 'paid');
            }
        } elseif ($request->filled('view')) {
            // Legacy/Fallback support for 'view'
            if ($request->view === 'my_earnings') {
                $query->where('payee_id', $superAgent->id);
            } elseif ($request->view === 'agent_payouts') {
                $query->where('payee_id', '!=', $superAgent->id);
            }
        }

        $commissions = $query->latest()->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $commissions->items(),
            'meta' => [
                'current_page' => $commissions->currentPage(),
                'last_page' => $commissions->lastPage(),
                'total' => $commissions->total(),
            ],
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $superAgent = $request->user();

        // Summary logic: payouts are anything where SA is natural/dynamic parent or enterer
        $agentPayoutsQuery = Commission::query()->where('payee_id', '!=', $superAgent->id)
            ->whereIn('payee_role', ['agent', 'enumerator'])
            ->where(function ($q) use ($superAgent) {
                $q->where('entered_by', $superAgent->id)
                    ->orWhereHas('payee', function ($pq) use ($superAgent) {
                        $pq->where('parent_id', $superAgent->id)
                           ->orWhereHas('parent', fn ($gp) => $gp->where('parent_id', $superAgent->id));
                    })
                    ->orWhereHas('lead', fn ($lq) => $lq->where('assigned_super_agent_id', $superAgent->id));
            });

        return response()->json([
            'success' => true,
            'data' => [
                'my_earnings_unpaid' => (float) Commission::forPayee($superAgent->id)->unpaid()->sum('amount'),
                'my_earnings_paid' => (float) Commission::forPayee($superAgent->id)->paid()->sum('amount'),
                'agent_payouts_unpaid_count' => (clone $agentPayoutsQuery)->unpaid()->count(),
                'agent_payouts_unpaid' => (float) (clone $agentPayoutsQuery)->unpaid()->sum('amount'),
                'agent_payouts_paid' => (float) (clone $agentPayoutsQuery)->paid()->sum('amount'),
            ],
        ]);
    }

    public function enterAgentCommission(EnterAgentCommissionRequest $request, string $ulid): JsonResponse
    {
        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();
        $payee = $lead->assignedAgent;

        if (!$payee) {
            return response()->json(['success' => false, 'message' => 'No agent assigned to this lead.'], 422);
        }

        $commission = $this->commissionService->enterCommission($lead, $payee, (float)$request->amount, $request->user());

        $lead->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Agent commission saved.',
            'data' => [
                'commission' => $commission,
                'lead_commission_status' => $lead->commission_entry_status,
            ],
        ]);
    }

    public function enterEnumeratorCommission(Request $request, string $ulid): JsonResponse
    {
        $request->validate(['amount' => 'required|numeric|min:0']);
        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();
        $payee = $lead->submittedByEnumerator;

        if (!$payee) {
            return response()->json(['success' => false, 'message' => 'No enumerator associated with this lead submission.'], 422);
        }
        
        $commission = $this->commissionService->enterCommission($lead, $payee, (float)$request->amount, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Enumerator commission saved.',
            'data' => [
                'commission' => $commission,
            ],
        ]);
    }

    public function update(UpdateCommissionRequest $request, int $id): JsonResponse
    {
        $commission = Commission::findOrFail($id);
        
        $this->authorize('update', $commission);

        $commission = $this->commissionService->editCommission($commission, (float) $request->amount, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Commission updated successfully.',
            'data' => $commission,
        ]);
    }

    public function markPaid(MarkCommissionPaidRequest $request, int $id): JsonResponse
    {
        $commission = Commission::findOrFail($id);
        $this->authorize('update', $commission);
        $commission = $this->commissionService->markAsPaid($commission, $request->validated(), $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Commission marked as paid.',
            'data' => $commission,
        ]);
    }

    public function getLeadCommissions(string $ulid): JsonResponse
    {
        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();
        $data = $this->commissionService->getLeadCommissions($lead);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function profitLedger(Request $request): JsonResponse
    {
        $superAgent = $request->user();
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        // Fetch leads where super agent received a commission or entered a payout
        $query = Lead::query()
            ->whereHas('commissions', function ($q) use ($superAgent) {
                $q->where('payee_id', $superAgent->id)
                  ->orWhere('entered_by', $superAgent->id);
            })
            ->with(['commissions.payee:id,name,role,parent_id']);

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $leadRows = $query->get()->map(function (Lead $lead) use ($superAgent) {
            $inflowComm = $lead->commissions->where('payee_id', $superAgent->id)->first();
            $inflow = $inflowComm ? (float) $inflowComm->amount : 0;

            $outflowComms = $lead->commissions->filter(function($c) use ($superAgent) {
                return $c->payee_id !== $superAgent->id && in_array($c->payee_role, ['agent', 'enumerator']) &&
                    ($c->entered_by === $superAgent->id || $c->payee?->parent_id === $superAgent->id);
            });

            $outflow = (float) $outflowComms->sum('amount');
            
            return [
                'row_type'           => 'lead',
                'date'               => $lead->created_at->toDateString(),
                'lead_ulid'          => $lead->ulid,
                'consumer_name'      => $lead->beneficiary_name,
                'consumer_mobile'    => $lead->beneficiary_mobile,
                'system_capacity'    => $lead->system_capacity,
                'received_from_sa'   => $inflow,
                'ledger_credit'      => 0,
                'downlines'          => $outflowComms->map(fn($c) => [
                    'name'   => $c->payee?->name ?? 'Unknown',
                    'role'   => $c->payee_role,
                    'amount' => (float) $c->amount,
                    'status' => $c->payment_status,
                ])->values()->toArray(),
                'tech_payouts'       => [],
                'enterprise_expense' => 0,
                'total_outflows'     => $outflow,
                'row_net'            => $inflow - $outflow,
                'payment_status'     => $inflowComm?->payment_status ?? 'unpaid',
            ];
        });

        $sorted = $leadRows->sortBy('date')->values();
        $runningBalance = 0;
        $sorted = $sorted->map(function($item) use (&$runningBalance) {
            $runningBalance += $item['row_net'];
            $item['running_balance'] = $runningBalance;
            return $item;
        });

        $sortedDesc = $sorted->sortByDesc('date')->values();

        $totalReceived = $sorted->sum('received_from_sa');
        $totalOutflow = $sorted->sum('total_outflows');
        $grandNetProfit = $totalReceived - $totalOutflow;

        $perPage = 20;
        $page    = max(1, (int) $request->input('page', 1));
        $total   = $sortedDesc->count();
        $items   = $sortedDesc->slice(($page - 1) * $perPage, $perPage)->values();

        return response()->json([
            'success' => true,
            'data'    => $items,
            'meta'    => [
                'current_page' => $page,
                'last_page'    => (int) ceil($total / $perPage),
                'total'        => $total,
            ],
            'totals'  => [
                'total_received_from_sa' => (float) $totalReceived,
                'total_ledger_credits'   => 0,
                'total_downlines'        => (float) $totalOutflow,
                'total_tech'             => 0,
                'total_enterprise_exp'   => 0,
                'grand_net_profit'       => (float) $grandNetProfit,
            ],
        ]);
    }

    public function exportProfitLedger(Request $request): StreamedResponse
    {
        $superAgent = $request->user();
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        $query = Lead::query()
            ->whereHas('commissions', function ($q) use ($superAgent) {
                $q->where('payee_id', $superAgent->id)
                  ->orWhere('entered_by', $superAgent->id);
            })
            ->with(['commissions.payee:id,name,role,parent_id']);

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $leadRows = $query->get()->map(function (Lead $lead) use ($superAgent) {
            $inflowComm = $lead->commissions->where('payee_id', $superAgent->id)->first();
            $inflow = $inflowComm ? (float) $inflowComm->amount : 0;

            $outflowComms = $lead->commissions->filter(function($c) use ($superAgent) {
                return $c->payee_id !== $superAgent->id && in_array($c->payee_role, ['agent', 'enumerator']) &&
                    ($c->entered_by === $superAgent->id || $c->payee?->parent_id === $superAgent->id);
            });

            $outflow = (float) $outflowComms->sum('amount');
            
            return [
                'row_type'           => 'lead',
                'date'               => $lead->created_at->toDateString(),
                'lead_ulid'          => $lead->ulid,
                'consumer_name'      => $lead->beneficiary_name,
                'consumer_mobile'    => $lead->beneficiary_mobile,
                'system_capacity'    => $lead->system_capacity,
                'received_from_sa'   => $inflow,
                'total_outflows'     => $outflow,
                'row_net'            => $inflow - $outflow,
                'payment_status'     => $inflowComm?->payment_status ?? 'unpaid',
            ];
        });

        $sorted = $leadRows->sortBy('date')->values();
        $runningBalance = 0;
        $sorted = $sorted->map(function($item) use (&$runningBalance) {
            $runningBalance += $item['row_net'];
            $item['running_balance'] = $runningBalance;
            return $item;
        });

        $filename = 'super_agent_profit_ledger_' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($sorted) {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Date',
                'Consumer Name',
                'Mobile',
                'System Capacity (kW)',
                'Received from Admin (₹)',
                'Paid to Team (₹)',
                'Row Net (₹)',
                'Balance (₹)',
                'Status'
            ]);

            foreach ($sorted as $row) {
                fputcsv($handle, [
                    $row['date'],
                    $row['consumer_name']  ?? '—',
                    $row['consumer_mobile'] ?? '—',
                    $row['system_capacity'] ?? '—',
                    number_format((float) $row['received_from_sa'], 2, '.', ''),
                    number_format((float) $row['total_outflows'], 2, '.', ''),
                    number_format((float) $row['row_net'], 2, '.', ''),
                    number_format((float) $row['running_balance'], 2, '.', ''),
                    $row['payment_status']
                ]);
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
