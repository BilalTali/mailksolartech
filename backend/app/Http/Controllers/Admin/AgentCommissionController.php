<?php

namespace App\Http\Controllers\Admin;
 
use App\Http\Controllers\Controller;
use App\Http\Requests\MarkCommissionPaidRequest;
use App\Models\Commission;
use App\Models\Lead;
use App\Services\CommissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
 
class AgentCommissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $agent = $request->user();

        if (in_array($request->filter, ['pending_to_pay', 'all_to_pay'])) {
            $query = Commission::query()->with(['lead', 'payee'])
                ->forPayer($agent->id)
                ->where(fn($q) => $q->where('payee_role', 'enumerator'))
                ->where('payee_role', '!=', 'field_technical_team');

            if ($request->filter === 'pending_to_pay') {
                $query->unpaid();
            }
        } else {
            $query = Commission::query()->with(['lead', 'enteredBy'])
                ->forPayee($agent->id)
                ->where(fn($q) => $q->where('payee_role', 'agent'));

            if ($request->filter === 'pending_my_payment') {
                $query->unpaid();
            } elseif ($request->filter === 'fully_paid') {
                $query->paid();
            }
        }

        $commissions = $query->latest()->paginate(20);

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
        $agent = $request->user();

        $myEarningsBase = Commission::forPayee($agent->id)->where(fn($q) => $q->where('payee_role', 'agent'));
        $payoutsBase = Commission::forPayer($agent->id)
            ->where(fn($q) => $q->where('payee_role', 'enumerator'))
            ->where('payee_role', '!=', 'field_technical_team');

        return response()->json([
            'success' => true,
            'data' => [
                'my_earnings_total' => (float) (clone $myEarningsBase)->sum('amount'),
                'my_earnings_unpaid' => (float) (clone $myEarningsBase)->unpaid()->sum('amount'),
                'my_earnings_paid' => (float) (clone $myEarningsBase)->paid()->sum('amount'),
                'my_earnings_this_month' => (float) (clone $myEarningsBase)->whereMonth('created_at', now()->month)->sum('amount'),

                'enumerator_payouts_total' => (float) (clone $payoutsBase)->sum('amount'),
                'enumerator_payouts_unpaid' => (float) (clone $payoutsBase)->unpaid()->sum('amount'),
                'enumerator_payouts_paid' => (float) (clone $payoutsBase)->paid()->sum('amount'),
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
        
        $commissionService = app(CommissionService::class);
        $commission = $commissionService->enterCommission($lead, $payee, (float)$request->amount, $request->user());
 
        return response()->json([
            'success' => true,
            'message' => 'Enumerator commission saved.',
            'data' => [
                'commission' => $commission,
            ],
        ]);
    }
 
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate(['amount' => 'required|numeric|min:0']);
        $commission = Commission::query()->findOrFail($id);
        $this->authorize('update', $commission);
        
        $commissionService = app(CommissionService::class);
        $commission = $commissionService->editCommission($commission, (float)$request->amount, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Commission updated.',
            'data' => $commission,
        ]);
    }

    public function markPaid(MarkCommissionPaidRequest $request, int $id): JsonResponse
    {
        $commission = Commission::query()->findOrFail($id);
        $this->authorize('update', $commission);
        $commissionService = app(CommissionService::class);
        $commission = $commissionService->markAsPaid($commission, $request->validated(), $request->user());
 
        return response()->json([
            'success' => true,
            'message' => 'Commission marked as paid.',
            'data' => $commission,
        ]);
    }

    public function profitLedger(Request $request): JsonResponse
    {
        $agent = $request->user();
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        // Fetch leads where agent received a commission or entered an enumerator payout
        $query = Lead::query()
            ->whereHas('commissions', function ($q) use ($agent) {
                $q->where('payee_id', $agent->id)
                  ->orWhere('entered_by', $agent->id);
            })
            ->with(['commissions.payee:id,name,role']);

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $leadRows = $query->get()->map(function (Lead $lead) use ($agent) {
            $inflowComm = $lead->commissions->where('payee_id', $agent->id)->first();
            $inflow = $inflowComm ? (float) $inflowComm->amount : 0;

            $outflowComms = $lead->commissions->filter(function($c) use ($agent) {
                return $c->payee_id !== $agent->id && $c->payee_role === 'enumerator' && $c->entered_by === $agent->id;
            });

            $outflow = (float) $outflowComms->sum('amount');
            
            return [
                'row_type'           => 'lead',
                'date'               => $lead->created_at->toDateString(),
                'lead_ulid'          => $lead->ulid,
                'consumer_name'      => $lead->beneficiary_name,
                'consumer_mobile'    => $lead->beneficiary_mobile,
                'system_capacity'    => $lead->system_capacity,
                'received_from_sa'   => $inflow, // Treated as received from Super Agent
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
        $agent = $request->user();
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        $query = Lead::query()
            ->whereHas('commissions', function ($q) use ($agent) {
                $q->where('payee_id', $agent->id)
                  ->orWhere('entered_by', $agent->id);
            })
            ->with(['commissions.payee:id,name,role']);

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $leadRows = $query->get()->map(function (Lead $lead) use ($agent) {
            $inflowComm = $lead->commissions->where('payee_id', $agent->id)->first();
            $inflow = $inflowComm ? (float) $inflowComm->amount : 0;

            $outflowComms = $lead->commissions->filter(function($c) use ($agent) {
                return $c->payee_id !== $agent->id && $c->payee_role === 'enumerator' && $c->entered_by === $agent->id;
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

        $filename = 'agent_profit_ledger_' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($sorted) {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Date',
                'Consumer Name',
                'Mobile',
                'System Capacity (kW)',
                'Received from Supervisor (₹)',
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
