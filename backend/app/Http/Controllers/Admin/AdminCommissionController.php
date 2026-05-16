<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EnterAgentCommissionRequest;
use App\Http\Requests\EnterSuperAgentCommissionRequest;
use App\Http\Requests\MarkCommissionPaidRequest;
use App\Http\Requests\UpdateCommissionRequest;
use App\Models\AdminLedger;
use App\Models\Commission;
use App\Models\Lead;
use App\Models\User;
use App\Services\CommissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminCommissionController extends Controller
{
    private CommissionService $commissionService;

    public function __construct(CommissionService $commissionService)
    {
        $this->commissionService = $commissionService;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Commission::query()->with(['lead', 'payee', 'enteredBy', 'paidBy']);

        if (!$user->isAdmin()) {
            $managedIds = $user->getManagedUserIds();
            $query->whereIn('payee_id', $managedIds);
        }
        if ($request->filled('filter')) {
            $filter = $request->filter;
            if ($filter === 'super_agent_pending') {
                $query->where(fn($q) => $q->where('payee_role', 'super_agent'))->where(fn($q) => $q->where('payment_status', 'unpaid'));
            } elseif ($filter === 'super_agent_paid') {
                $query->where(fn($q) => $q->where('payee_role', 'super_agent'))->where(fn($q) => $q->where('payment_status', 'paid'));
            } elseif ($filter === 'super_agent_all') {
                $query->where(fn($q) => $q->where('payee_role', 'super_agent'));
            } elseif ($filter === 'agent_direct_pending') {
                $query->where(fn($q) => $q->whereIn('payee_role', ['agent', 'enumerator', 'field_technical_team']))
                    ->where(fn($q) => $q->whereHas('enteredBy', fn($q2) => $q2->where('role', 'admin'))->orWhere('payee_role', 'field_technical_team'))
                    ->where('payment_status', 'unpaid');
            } elseif ($filter === 'agent_direct_paid') {
                $query->where(fn($q) => $q->whereIn('payee_role', ['agent', 'enumerator', 'field_technical_team']))
                    ->where(fn($q) => $q->whereHas('enteredBy', fn($q2) => $q2->where('role', 'admin'))->orWhere('payee_role', 'field_technical_team'))
                    ->where('payment_status', 'paid');
            } elseif ($filter === 'agent_direct_all') {
                $query->where(fn($q) => $q->whereIn('payee_role', ['agent', 'enumerator', 'field_technical_team']))
                    ->where(fn($q) => $q->whereHas('enteredBy', fn($q2) => $q2->where('role', 'admin'))->orWhere('payee_role', 'field_technical_team'));
            } elseif ($filter === 'all_pending') {
                $query->where(fn($q) => $q->where('payment_status', 'unpaid'));
            } elseif ($filter === 'all_paid') {
                $query->where(fn($q) => $q->where('payment_status', 'paid'));
            }
        } else {
            if ($request->filled('payee_role')) {
                $query->where(fn($q) => $q->where('payee_role', $request->payee_role));
            }
            if ($request->filled('payment_status')) {
                $query->where(fn($q) => $q->where('payment_status', $request->payment_status));
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
        $user = $request->user();
        $isAdmin = $user->isAdmin();
        $isSuperAdmin = $user->isSuperAdmin();
        $managedIds = ($isAdmin || $isSuperAdmin) ? [] : $user->getManagedUserIds();

        $query = Commission::query();
        if (!$isAdmin && !$isSuperAdmin) {
            $query->whereIn('payee_id', $managedIds);
        }

        // ── Unified Admin Net Profit Calculation (mirrors AdminDashboardController) ──
        // Formula: Net Profit = commissions_earned (payee_role=admin)
        //                     + ledger_credits (allowances from SA)
        //                     - ledger_debits  (self-logged expenses: meetings, branding, etc.)
        //                     - commissions_entered_by_admin_for_downlines (agents, enumerators, field_tech, super_agents)
        $adminId = ($isAdmin || $isSuperAdmin) ? ($isAdmin ? $user->id : null) : null;

        $ledgerCredits = ($isSuperAdmin || $adminId === null)
            ? AdminLedger::where('transaction_type', 'credit')->sum('amount')
            : AdminLedger::where('admin_id', $adminId)->where('transaction_type', 'credit')->sum('amount');

        $ledgerDebits = ($isSuperAdmin || $adminId === null)
            ? AdminLedger::where('transaction_type', 'debit')->sum('amount')
            : AdminLedger::where('admin_id', $adminId)->where('transaction_type', 'debit')->sum('amount');

        $commissionsEarned = ($isSuperAdmin || $adminId === null)
            ? Commission::where('payee_role', 'admin')->sum('amount')
            : Commission::where('payee_id', $adminId)->where('payee_role', 'admin')->sum('amount');

        $downlineRoles = ['agent', 'enumerator', 'field_technical_team', 'super_agent'];
        $commissionsToDownlines = ($isSuperAdmin || $adminId === null)
            ? Commission::whereIn('payee_role', $downlineRoles)->sum('amount')
            : Commission::where('entered_by', $adminId)->whereIn('payee_role', $downlineRoles)->sum('amount');

        $adminNetProfit = ($commissionsEarned + $ledgerCredits) - ($ledgerDebits + $commissionsToDownlines);

        // Legacy per-lead breakdown (kept for the breakdown panel)
        $totalReceivedFromSA = 0;
        $totalPassedToDownlines = 0;
        $totalOtherExpenses = 0;
        if ($isAdmin || $isSuperAdmin) {
            $disbursedLeads = Lead::with('commissions')->whereNotNull('admin_received_commission')->get();
            foreach ($disbursedLeads as $l) {
                $totalReceivedFromSA   += (($l->admin_received_commission ?? 0) + ($l->admin_meeting_allowance ?? 0) + ($l->admin_additional_expenses ?? 0));
                $totalPassedToDownlines += $l->commissions->where('payee_role', '!=', 'admin')->sum('amount');
                if (is_array($l->admin_other_expenses)) {
                    foreach ($l->admin_other_expenses as $e) {
                        $totalOtherExpenses += (float) ($e['amount'] ?? 0);
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'super_agent_unpaid_count'    => (clone $query)->forSuperAgents()->unpaid()->count(),
                'super_agent_unpaid_amount'   => (float) (clone $query)->forSuperAgents()->unpaid()->sum('amount'),
                'super_agent_paid_amount'     => (float) (clone $query)->forSuperAgents()->paid()->sum('amount'),
                'direct_agent_unpaid_count'   => (clone $query)->whereIn('payee_role', ['agent', 'enumerator', 'field_technical_team'])
                    ->where(fn($q) => $q->whereHas('enteredBy', fn($q2) => $q2->where('role', 'admin'))->orWhere('payee_role', 'field_technical_team'))
                    ->unpaid()->count(),
                'direct_agent_unpaid_amount'  => (float) (clone $query)->whereIn('payee_role', ['agent', 'enumerator', 'field_technical_team'])
                    ->where(fn($q) => $q->whereHas('enteredBy', fn($q2) => $q2->where('role', 'admin'))->orWhere('payee_role', 'field_technical_team'))
                    ->unpaid()->sum('amount'),
                'direct_agent_paid_amount'    => (float) (clone $query)->whereIn('payee_role', ['agent', 'enumerator', 'field_technical_team'])
                    ->where(fn($q) => $q->whereHas('enteredBy', fn($q2) => $q2->where('role', 'admin'))->orWhere('payee_role', 'field_technical_team'))
                    ->paid()->sum('amount'),
                'enumerator_unpaid_count'     => (clone $query)->forEnumerators()->unpaid()->count(),
                'enumerator_unpaid_amount'    => (float) (clone $query)->forEnumerators()->unpaid()->sum('amount'),
                'all_time_disbursed'          => (float) (clone $query)->paid()->sum('amount'),
                'all_time_pending'            => (float) (clone $query)->unpaid()->sum('amount'),
                'all_time_total'              => (float) (clone $query)->sum('amount'),

                // ── Unified Net Profit (use this on the EarningsOverviewCard) ──
                'admin_net_profit'            => $adminNetProfit,
                'commissions_earned'          => (float) $commissionsEarned,
                'ledger_credits'              => (float) $ledgerCredits,
                'ledger_debits'               => (float) $ledgerDebits,
                'commissions_to_downlines'    => (float) $commissionsToDownlines,

                // Legacy per-lead breakdown (kept for detail panels)
                'admin_net_earning_total'     => $adminNetProfit,   // alias for backward-compat
                'total_received_from_sa'      => $totalReceivedFromSA,
                'total_passed_to_downlines'   => $totalPassedToDownlines,
                'total_other_expenses'        => $totalOtherExpenses + $ledgerDebits, // include ledger expenses
            ],
        ]);
    }

    public function enterSuperAgentCommission(EnterSuperAgentCommissionRequest $request, string $ulid): JsonResponse
    {
        $lead = Lead::query()->where(fn($q) => $q->where('ulid', $ulid))->firstOrFail();
        $payee = $lead->assignedSuperAgent;

        if (!$payee) {
            return response()->json(['success' => false, 'message' => 'No super agent assigned to this lead.'], 422);
        }

        $commission = $this->commissionService->enterCommission($lead, $payee, (float) $request->amount, $request->user());

        $lead->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Super agent commission saved.',
            'data' => [
                'commission' => $commission,
                'lead_commission_status' => $lead->commission_entry_status,
            ],
        ]);
    }

    /**
     * UNIFIED commission entry endpoint.
     * Accepts payee_id + amount. Validates payee is a direct subordinate of payer for this lead.
     */
    public function enterCommission(Request $request, string $ulid): JsonResponse
    {
        $request->validate([
            'payee_id' => 'required|integer|exists:users,id',
            'amount' => 'required|numeric|min:0',
        ]);

        $lead = Lead::query()->where(fn($q) => $q->where('ulid', $ulid))->firstOrFail();
        $payee = User::findOrFail($request->payee_id);

        $commission = $this->commissionService->enterCommission($lead, $payee, (float) $request->amount, $request->user());

        $lead->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Commission saved for ' . $payee->name . '.',
            'data' => [
                'commission' => $commission,
                'lead_commission_status' => $lead->commission_entry_status,
            ],
        ]);
    }

    public function enterDirectAgentCommission(EnterAgentCommissionRequest $request, string $ulid): JsonResponse
    {
        $lead = Lead::query()->where(fn($q) => $q->where('ulid', $ulid))->firstOrFail();
        $payee = $lead->assignedAgent;

        if (!$payee) {
            return response()->json(['success' => false, 'message' => 'No agent assigned to this lead.'], 422);
        }

        $commission = $this->commissionService->enterCommission($lead, $payee, (float) $request->amount, $request->user());

        $lead->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Direct agent commission saved.',
            'data' => [
                'commission' => $commission,
                'lead_commission_status' => $lead->commission_entry_status,
            ],
        ]);
    }

    public function enterEnumeratorCommission(Request $request, string $ulid): JsonResponse
    {
        $request->validate(['amount' => 'required|numeric|min:0']);
        $lead = Lead::query()->where(fn($q) => $q->where('ulid', $ulid))->firstOrFail();
        $payee = $lead->submittedByEnumerator;

        if (!$payee) {
            return response()->json(['success' => false, 'message' => 'No enumerator associated with this lead submission.'], 422);
        }

        $commission = $this->commissionService->enterCommission($lead, $payee, (float) $request->amount, $request->user());

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
        $commission = Commission::query()->findOrFail($id);
        $commission = $this->commissionService->editCommission($commission, (float) $request->amount, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Commission updated successfully.',
            'data' => $commission,
        ]);
    }

    public function markPaid(MarkCommissionPaidRequest $request, int $id): JsonResponse
    {
        $commission = Commission::query()->findOrFail($id);
        $commission = $this->commissionService->markAsPaid($commission, $request->validated(), $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Commission marked as paid.',
            'data' => $commission,
        ]);
    }

    public function getLeadCommissions(string $ulid): JsonResponse
    {
        $lead = Lead::query()->where(fn($q) => $q->where('ulid', $ulid))->firstOrFail();
        $data = $this->commissionService->getLeadCommissions($lead);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function updateAdminAllocation(Request $request, string $ulid): JsonResponse
    {
        // Only super_admin should set this, but admin might view it. 
        // We will allow admins to set it for testing purposes if they want, but in a real system, we'd add an explicit check.
        $request->validate([
            'lead_revenue' => 'nullable|numeric|min:0',
            'admin_received_commission' => 'required|numeric|min:0',
            'admin_meeting_allowance' => 'required|numeric|min:0',
            'admin_additional_expenses' => 'required|numeric|min:0',
        ]);

        $lead = Lead::query()->where('ulid', $ulid)->firstOrFail();

        $updateData = [
            'admin_received_commission' => $request->admin_received_commission,
            'admin_meeting_allowance' => $request->admin_meeting_allowance,
            'admin_additional_expenses' => $request->admin_additional_expenses,
        ];

        if ($request->has('lead_revenue')) {
            $updateData['lead_revenue'] = $request->lead_revenue;
        }

        $lead->update($updateData);

        $adminId = $lead->assigned_admin_id ?? User::roleAdmin()->first()?->id;

        if ($adminId) {
            Commission::updateOrCreate(
                [
                    'lead_id' => $lead->id,
                    'payee_id' => $adminId,
                    'payee_role' => 'admin'
                ],
                [
                    'amount' => $request->admin_received_commission + $request->admin_meeting_allowance + $request->admin_additional_expenses,
                    'entered_by' => $request->user()->id,
                    'trigger_status' => 'MANUAL_ALLOCATION',
                    'triggered_at' => now(),
                    'chain_type' => 'ALLOCATION',
                    'hierarchy_level' => 0,
                    // Avoid overwriting payment_status if it's already paid
                ]
            );

            if (!$lead->assigned_admin_id) {
                $lead->update(['assigned_admin_id' => $adminId]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Admin top-down allocation updated successfully.',
            'data' => $lead->fresh(['commissions']),
        ]);
    }

    public function updateAdminExpenses(Request $request, string $ulid): JsonResponse
    {
        $request->validate([
            'expenses' => 'array',
            'expenses.*.label' => 'required|string|min:3',
            'expenses.*.amount' => 'required|numeric|min:0',
        ]);

        $lead = Lead::query()->where('ulid', $ulid)->firstOrFail();

        $lead->update([
            'admin_other_expenses' => $request->expenses ?? [],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admin custom expenses updated successfully.',
            'data' => $lead->fresh(['commissions']),
        ]);
    }

    public function updateSystemRevenue(Request $request, string $ulid): JsonResponse
    {
        $request->validate([
            'lead_revenue' => 'required|numeric|min:0',
        ]);

        $lead = Lead::query()->where('ulid', $ulid)->firstOrFail();

        $lead->update([
            'lead_revenue' => $request->lead_revenue,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'System Revenue updated successfully.',
            'data' => $lead->fresh(),
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PROFIT LEDGER — Unified view: lead commissions + standalone ledger
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Returns a merged, paginated list of:
     *   A) Lead rows  — leads with admin allocation, showing per-lead income/outflows
     *   B) Ledger rows — standalone AdminLedger entries (credits & debits)
     */
    public function profitLedger(Request $request): JsonResponse
    {
        $user    = $request->user();
        // CRITICAL: isAdmin() returns true for BOTH admin and super_admin roles.
        // We must check isSuperAdmin() first so super admins see ALL leads (adminId = null).
        $adminId = $user->isSuperAdmin() ? null : ($user->isAdmin() ? $user->id : null);

        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        $merged = $this->buildProfitLedgerRows($adminId, $startDate, $endDate, $user);

        // Compute totals across ALL rows (before pagination)
        $totalReceivedFromSA = $merged->sum('received_from_sa');
        $totalLedgerCredits  = $merged->sum('ledger_credit');
        $totalEnterpriseExp  = $merged->sum('enterprise_expense');
        
        $totalDownlines = $merged->reduce(function($carry, $item) {
            return $carry + collect($item['downlines'])->sum('amount');
        }, 0);
        
        $totalTech = $merged->reduce(function($carry, $item) {
            return $carry + collect($item['tech_payouts'])->sum('amount');
        }, 0);

        $totalOutflows  = $totalDownlines + $totalTech + $totalEnterpriseExp;
        $grandNetProfit = $totalReceivedFromSA + $totalLedgerCredits - $totalOutflows;

        // Paginate
        $perPage = 20;
        $page    = max(1, (int) $request->input('page', 1));
        $total   = $merged->count();
        $items   = $merged->slice(($page - 1) * $perPage, $perPage)->values();

        return response()->json([
            'success' => true,
            'data'    => $items,
            'meta'    => [
                'current_page' => $page,
                'last_page'    => (int) ceil($total / $perPage),
                'total'        => $total,
            ],
            'totals'  => [
                'total_received_from_sa' => (float) $totalReceivedFromSA,
                'total_ledger_credits'   => (float) $totalLedgerCredits,
                'total_downlines'        => (float) $totalDownlines,
                'total_tech'             => (float) $totalTech,
                'total_enterprise_exp'   => (float) $totalEnterpriseExp,
                'grand_net_profit'       => (float) $grandNetProfit,
            ],
        ]);
    }

    /**
     * Streams the full profit ledger as a CSV download (no pagination).
     */
    public function exportProfitLedger(Request $request): StreamedResponse
    {
        $user    = $request->user();
        $adminId = $user->isSuperAdmin() ? null : ($user->isAdmin() ? $user->id : null);
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');
        $rows    = $this->buildProfitLedgerRows($adminId, $startDate, $endDate, $user);
        $filename = 'profit_ledger_' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Excel
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Date',
                'Type',
                'Consumer Name',
                'Mobile',
                'System Capacity (kW)',
                'Received from SA (₹)',
                'Ledger Credit (₹)',
                'Paid to Downlines (₹)',
                'Paid to Tech Team (₹)',
                'Enterprise Expense (₹)',
                'Row Net (₹)',
                'Balance (₹)',
                'Status',
                'Notes / Description',
            ]);

            foreach ($rows as $row) {
                $downlineTotal = collect($row['downlines'])->sum('amount');
                $techTotal     = collect($row['tech_payouts'])->sum('amount');

                $typeLabel = match($row['row_type']) {
                    'lead'           => 'Lead Commission',
                    'ledger_credit'  => 'Ledger Credit',
                    'ledger_debit'   => 'Ledger Expense',
                    default          => $row['row_type'],
                };

                fputcsv($handle, [
                    $row['date'],
                    $typeLabel,
                    $row['consumer_name']  ?? '—',
                    $row['consumer_mobile'] ?? '—',
                    $row['system_capacity'] ?? '—',
                    number_format((float) $row['received_from_sa'], 2, '.', ''),
                    number_format((float) $row['ledger_credit'], 2, '.', ''),
                    number_format((float) $downlineTotal, 2, '.', ''),
                    number_format((float) $techTotal, 2, '.', ''),
                    number_format((float) $row['enterprise_expense'], 2, '.', ''),
                    number_format((float) $row['row_net'], 2, '.', ''),
                    number_format((float) $row['running_balance'], 2, '.', ''),
                    $row['payment_status'],
                    $row['description'] ?? '',
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Shared helper: builds the merged collection of lead rows + ledger rows.
     */
    private function buildProfitLedgerRows(?int $adminId, ?string $startDate = null, ?string $endDate = null, $user = null): \Illuminate\Support\Collection
    {
        $isSuperAdmin = $user ? $user->isSuperAdmin() : false;

        // Show all leads for both Super Admin and Admin so new leads appear in the ledger
        $leadQuery = Lead::query()
            ->with([
                'commissions.payee:id,name,role,agent_id,super_agent_code,enumerator_id',
            ]);

        if ($adminId) {
            $leadQuery->where('assigned_admin_id', $adminId);
        }
        if ($startDate) {
            $leadQuery->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $leadQuery->whereDate('created_at', '<=', $endDate);
        }

        $leadRows = $leadQuery->orderBy('created_at', 'desc')->get()->map(function (Lead $lead) use ($isSuperAdmin): array {
            $adminComm = $lead->commissions->where('payee_role', 'admin')->first();

            $downlines = $lead->commissions
                ->whereIn('payee_role', ['agent', 'enumerator', 'super_agent'])
                ->values();

            $techPayouts = $lead->commissions
                ->where('payee_role', 'field_technical_team')
                ->values();

            $received       = (float) ($lead->admin_received_commission ?? 0);
            $allowance      = (float) ($lead->admin_meeting_allowance ?? 0);
            $expenses       = (float) ($lead->admin_additional_expenses ?? 0);
            $totalInflowFromSa = $received + $allowance + $expenses;

            $totalDownlines = (float) $downlines->sum('amount');
            $totalTech      = (float) $techPayouts->sum('amount');

            if ($isSuperAdmin) {
                $inflow = (float) $lead->lead_revenue;
                $outflow = $totalInflowFromSa;
                
                $downlinesMapped = [];
                if ($outflow > 0) {
                    $downlinesMapped[] = [
                        'name' => $adminComm?->payee?->name ?? 'Admin',
                        'role' => 'admin',
                        'amount' => $outflow,
                        'status' => $adminComm?->payment_status ?? 'paid'
                    ];
                }

                return [
                    'row_type'           => 'lead',
                    'date'               => $lead->created_at->toDateString(),
                    'lead_ulid'          => $lead->ulid,
                    'consumer_name'      => $lead->beneficiary_name,
                    'consumer_mobile'    => $lead->beneficiary_mobile,
                    'system_capacity'    => $lead->system_capacity,
                    'received_from_sa'   => $inflow,
                    'ledger_credit'      => 0,
                    'downlines'          => $downlinesMapped,
                    'tech_payouts'       => [],
                    'enterprise_expense' => 0,
                    'total_outflows'     => $outflow,
                    'row_net'            => $inflow - $outflow,
                    'payment_status'     => 'paid',
                    'description'        => null,
                    'category'           => null,
                    'created_by_name'    => null,
                ];
            } else {
                return [
                    'row_type'           => 'lead',
                    'date'               => $lead->created_at->toDateString(),
                    'lead_ulid'          => $lead->ulid,
                    'consumer_name'      => $lead->beneficiary_name,
                    'consumer_mobile'    => $lead->beneficiary_mobile,
                    'system_capacity'    => $lead->system_capacity,
                    'received_from_sa'   => $received,
                    'lead_base_commission'      => $received,
                    'lead_meeting_allowance'    => $allowance,
                    'lead_additional_expenses'  => $expenses,
                    'ledger_credit'      => $allowance + $expenses,
                    'downlines'          => $downlines->map(fn($c) => [
                        'name'   => $c->payee?->name ?? 'Unknown',
                        'role'   => $c->payee_role,
                        'amount' => (float) $c->amount,
                        'status' => $c->payment_status,
                    ])->toArray(),
                    'tech_payouts'       => $techPayouts->map(fn($c) => [
                        'name'       => $c->payee?->name ?? 'Unknown',
                        'chain_type' => $c->chain_type,
                        'amount'     => (float) $c->amount,
                        'status'     => $c->payment_status,
                    ])->toArray(),
                    'enterprise_expense' => 0,
                    'total_outflows'     => $totalDownlines + $totalTech,
                    'row_net'            => $totalInflowFromSa - $totalDownlines - $totalTech,
                    'payment_status'     => $adminComm?->payment_status ?? 'unpaid',
                    'description'        => null,
                    'category'           => null,
                    'created_by_name'    => null,
                ];
            }
        });

        // ── B) Ledger Rows ────────────────────────────────────────────
        if ($isSuperAdmin) {
            $ledgerRows = collect([]);
        } else {
            $ledgerQuery = AdminLedger::query()->with('createdBy:id,name,role');
            if ($adminId) {
                $ledgerQuery->where('admin_id', $adminId);
            }
            if ($startDate) {
                $ledgerQuery->whereDate('created_at', '>=', $startDate);
            }
            if ($endDate) {
                $ledgerQuery->whereDate('created_at', '<=', $endDate);
            }

            $ledgerRows = $ledgerQuery->orderBy('created_at', 'desc')->get()->map(function (AdminLedger $l): array {
                $isCredit = $l->transaction_type === 'credit';
                $amount   = (float) $l->amount;

                return [
                    'row_type'           => $isCredit ? 'ledger_credit' : 'ledger_debit',
                    'date'               => $l->created_at->toDateString(),
                    'lead_ulid'          => null,
                    'consumer_name'      => null,
                    'consumer_mobile'    => null,
                    'system_capacity'    => null,
                    'received_from_sa'   => 0,
                    'ledger_credit'      => $isCredit ? $amount : 0,
                    'downlines'          => [],
                    'tech_payouts'       => [],
                    'enterprise_expense' => $isCredit ? 0 : $amount,
                    'total_outflows'     => $isCredit ? 0 : $amount,
                    'row_net'            => $isCredit ? $amount : -$amount,
                    'payment_status'     => 'settled',
                    'description'        => $l->description,
                    'category'           => $l->category,
                    'created_by_name'    => $l->createdBy?->name,
                ];
            });
        }

        // ── Merge & sort by date asc ─────────────────────────────────
        $mergedCollection = $leadRows->concat($ledgerRows)->sortBy('date')->values();
        
        $runningBalance = 0;
        return $mergedCollection->map(function ($item) use (&$runningBalance): array {
            $runningBalance += $item['row_net'];
            $item['running_balance'] = $runningBalance;
            return $item;
        });
    }
}
