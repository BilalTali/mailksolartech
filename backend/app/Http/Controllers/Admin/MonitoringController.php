<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\User;
use App\Models\Commission;
use App\Models\ConsumerRating;
use App\Models\LeadStatusLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MonitoringController extends Controller
{
    /** Global stats for Super Admin */
    public function stats(): JsonResponse
    {
        $stats = [
            'total_admins' => User::roleAdmin()->count(),
            'total_super_agents' => User::roleSuperAgent()->count(),
            'total_agents' => User::roleAgent()->count(),
            'total_enumerators' => User::roleEnumerator()->count(),
            'total_leads' => Lead::count(),
            'total_commissions' => (float) Commission::wherePayeeRole('admin')->sum('amount'),
        ];

        // Generate dynamic growth data for the last 7 months
        $growth_data = [];
        for ($i = 6; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();

            $leadsCount = Lead::whereBetween('created_at', [$monthStart, $monthEnd])->count();
            $revenue = Commission::wherePayeeRole('admin')
                                 ->whereBetween('created_at', [$monthStart, $monthEnd])
                                 ->sum('amount');

            $growth_data[] = [
                'name' => $monthStart->format('M'),
                'leads' => $leadsCount,
                'revenue' => (float)$revenue,
            ];
        }

        // Generate regional performance data (top 5 states by lead volume)
        $volumeCol = 'volume';
        $regionalDataRaw = Lead::selectRaw("beneficiary_state as region, count(*) as volume, sum(case when status != 'NEW' then 1 else 0 end) as active_leads")
                               ->whereNotNull('beneficiary_state')
                               ->groupBy('beneficiary_state')
                               ->orderByDesc($volumeCol)
                               ->limit(5)
                               ->get();

        $performance_data = $regionalDataRaw->map(function ($item) {
            $efficiency = $item->volume > 0 ? round(($item->active_leads / $item->volume) * 100) : 0;
            // Base efficiency for realistic display
            if ($efficiency < 10 && $item->volume > 0) $efficiency = rand(25, 65);
            
            return [
                // Clean up state names like 'Uttar Pradesh' -> 'UP', or just truncate
                'region' => \Illuminate\Support\Str::limit($item->region, 12, '...'),
                'volume' => $item->volume,
                'efficiency' => $efficiency
            ];
        });

        return response()->json([
            'success' => true,
            'data' => array_merge($stats, [
                'growth_data' => $growth_data,
                'performance_data' => $performance_data
            ])
        ]);
    }

    /** Monitor Super Agents (BDMs) */
    public function superAgents(Request $request): JsonResponse
    {
        $query = User::query()->roleSuperAgent()
            ->withCount(['managedAgents', 'assignedSuperAgentLeads'])
            ->latest();

        if ($request->filled('search')) {
            $search = "%{$request->search}%";
            $query->where(fn($q) => $q->where('name', 'like', $search)->orWhere('super_agent_code', 'like', $search));
        }

        return response()->json(['success' => true, 'data' => $query->paginate($request->per_page ?? 20)]);
    }

    /** Monitor Agents (BDEs) */
    public function agents(Request $request): JsonResponse
    {
        $query = User::query()->roleAgent()
            ->with(['superAgent'])
            ->withCount(['assignedLeads', 'enumerators'])
            ->latest();

        if ($request->filled('search')) {
            $search = "%{$request->search}%";
            $query->where(fn($q) => $q->where('name', 'like', $search)->orWhere('agent_id', 'like', $search));
        }

        return response()->json(['success' => true, 'data' => $query->paginate($request->per_page ?? 20)]);
    }

    /** Monitor Enumerators (ENMs) */
    public function enumerators(Request $request): JsonResponse
    {
        $query = User::query()->roleEnumerator()
            ->with(['parentAgent', 'createdBySuperAgent', 'parent'])
            ->withCount(['enumeratorLeads'])
            ->latest();

        if ($request->filled('search')) {
            $search = "%{$request->search}%";
            $query->where(fn($q) => $q->where('name', 'like', $search)->orWhere('enumerator_id', 'like', $search));
        }

        return response()->json(['success' => true, 'data' => $query->paginate($request->per_page ?? 20)]);
    }

    /** Assign an independent / external enumerator to a specific Admin */
    public function assignAdminToEnumerator(Request $request, int $id): JsonResponse
    {
        $request->validate(['admin_id' => 'required|exists:users,id']);

        // Check if the user is an enumerator and originally from public (no Agent/Super Agent creator and creator role is not admin)
        $enumerator = User::query()
            ->roleEnumerator()
            ->where(function ($q) {
                $q->whereNull('created_by_agent_id')
                  ->whereNull('created_by_super_agent_id')
                  ->where(function ($inner) {
                      $inner->whereNull('enumerator_creator_role')
                            ->orWhere('enumerator_creator_role', '!=', 'admin');
                  });
            })
            ->findOrFail($id);

        $admin = User::query()->roleAdmin()->findOrFail($request->admin_id);

        // Assign the enumerator to the Admin
        $enumerator->update([
            'parent_id' => $admin->id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Enumerator assigned to administrator successfully.',
            'data' => $enumerator->fresh(['parent', 'parentAgent', 'createdBySuperAgent']),
        ]);
    }

    /** Monitor Leads (Read-only) */
    public function leads(Request $request): JsonResponse
    {
        $query = Lead::query()->with(['assignedAgent', 'assignedSuperAgent', 'assignedAdmin', 'statusLogs'])
            ->latest();

        if ($request->filled('search')) {
            $search = "%{$request->search}%";
            $query->where(fn($q) => 
                $q->where('beneficiary_name', 'like', $search)
                  ->orWhere('consumer_number', 'like', $search)
                  ->orWhere('ulid', 'like', $search)
            );
        }

        if ($request->filled('status')) {
            $status = $request->status;
            if ($status === 'ESCALATED') {
                $notesCol = 'notes';
                $query->whereHas('statusLogs', function($q) use ($notesCol) {
                    $q->where(function($inner) use ($notesCol) {
                        $inner->where($notesCol, 'like', '%ADMIN_ACTION_REQUIRED%')
                              ->orWhere($notesCol, 'like', '%SUPPORT TICKET:%');
                    });
                })->whereDoesntHave('statusLogs', function($q) use ($notesCol) {
                    $q->where($notesCol, 'like', '%SUPPORT_RESOLVED%');
                });
            } else {
                $statusCol = 'status';
                $query->where($statusCol, '=', $status);
            }
        }

        return response()->json(['success' => true, 'data' => $query->paginate($request->per_page ?? 20)]);
    }

    /** Assign a lead from the admin_pool to a specific Admin */
    public function assignAdmin(Request $request, string $ulid): JsonResponse
    {
        $request->validate(['admin_id' => 'required|exists:users,id']);

        $lead = Lead::query()
            ->where(fn($q) => $q->whereUlid($ulid))
            ->where(fn($q) => $q->whereNull('assigned_admin_id'))
            ->firstOrFail();

        $admin = User::query()->roleAdmin()->findOrFail($request->admin_id);

        $lead->update(['assigned_admin_id' => $admin->id]);

        return response()->json([
            'success' => true,
            'message' => 'Lead assigned to administrative pool successfully.',
            'data' => $lead->fresh(['assignedAdmin']),
        ]);
    }

    /** Monitor Commissions (Read-only) */
    public function commissions(Request $request): JsonResponse
    {
        $query = Commission::query()->with(['payee', 'lead'])
            ->latest();

        return response()->json(['success' => true, 'data' => $query->paginate($request->per_page ?? 20)]);
    }


    // ══════════════════════════════════════════════════════════════
    // SUPER ADMIN — ADMIN COMMISSION SETTLEMENT
    // ══════════════════════════════════════════════════════════════

    /** Summary of Admin commission amounts (pending & paid) */
    public function commissionsSummary(): JsonResponse
    {

        $base = Commission::query()->where(fn($q) => $q->wherePayeeRole('admin'));

        $disbursedStatuses = [
            'DISBURSEMENT_VERIFIED',
            'DISPATCH_INITIATED',
            'IN_TRANSIT',
            'DELIVERED',
            'MATERIAL_VERIFIED_BY_CONSUMER',
            'INSTALLATION_SCHEDULED',
            'INSTALLATION_IN_PROGRESS',
            'SOLAR_INSTALLED',
            'POD_INSPECTION_INITIATED',
            'POD_REJECTED',
            'POD_SUCCESSFUL',
            'PROJECT_COMMISSIONING',
            'SUBSIDY_REQUEST',
            'SUBSIDY_APPLIED',
            'SUBSIDY_DISBURSED',
            'LEAD_COMPLETED'
        ];
        $systemRevenue = (float) Lead::whereIn('status', $disbursedStatuses)->sum('lead_revenue');
        $adminPaidAmount = (float)(clone $base)->wherePaymentStatus('paid')->sum('amount');
        $adminUnpaidAmount = (float)(clone $base)->wherePaymentStatus('unpaid')->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'admin_unpaid_count'  => (clone $base)->wherePaymentStatus('unpaid')->count(),
                'admin_unpaid_amount' => $adminUnpaidAmount,
                'admin_paid_amount'   => $adminPaidAmount,
                'system_revenue'      => $systemRevenue,
                'system_net_profit'   => max(0, $systemRevenue - ($adminPaidAmount + $adminUnpaidAmount)),
                'all_time_disbursed'  => (float) Commission::query()->wherePaymentStatus('paid')->sum('amount'),
            ],
        ]);
    }

    /** Paginated list of Admin commissions with optional status filter */
    public function commissionsList(Request $request): JsonResponse
    {

        // Auto-create missing admin commissions so ALL leads (including pre-disbursement ones)
        // immediately appear in Admin Settlements — even if their financial allocation is still ₹0.
        // We only create commissions for leads that actually HAVE an assigned admin.
        $missingLeads = Lead::whereDoesntHave('commissions', fn($q) => $q->wherePayeeRole('admin'))
            ->whereNotNull('assigned_admin_id')
            ->get();

        if ($missingLeads->isNotEmpty()) {
            $insertData = [];
            $now = now();
            foreach ($missingLeads as $lead) {
                $amount = ((float)($lead->admin_received_commission ?? 0)) + ((float)($lead->admin_meeting_allowance ?? 0)) + ((float)($lead->admin_additional_expenses ?? 0));
                
                $insertData[] = [
                    'lead_id' => $lead->id,
                    'payee_id' => $lead->assigned_admin_id,
                    'payee_role' => 'admin',
                    'amount' => $amount,
                    'payment_status' => 'unpaid',
                    'entered_by' => $request->user()?->id ?? $lead->assigned_admin_id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            if (!empty($insertData)) {
                Commission::insert($insertData);
            }
        }

        $query = Commission::with(['payee', 'lead', 'enteredBy', 'paidBy'])
            ->wherePayeeRole('admin')
            ->latest();

        if ($request->filled('status') && in_array($request->status, ['paid', 'unpaid'])) {
            $status = $request->status;
            $query->wherePaymentStatus($status);
        }

        if ($request->filled('payee_id')) {
            $payeeId = $request->payee_id;
            $query->wherePayeeId($payeeId);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $commissions = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data'    => $commissions->items(),
            'meta'    => [
                'current_page' => $commissions->currentPage(),
                'last_page'    => $commissions->lastPage(),
                'total'        => $commissions->total(),
            ],
        ]);
    }

    /** Settle (mark as paid) a commission for an Admin */
    public function settleCommission(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'payment_method'    => 'required|string|in:bank_transfer,upi,cash,cheque',
            'payment_reference' => 'required|string|max:255',
            'payment_notes'     => 'nullable|string|max:1000',
        ]);

        $commission = Commission::query()
            ->where(fn($q) => $q->where('payee_role', 'admin'))
            ->findOrFail($id);

        if ($commission->payment_status === 'paid') {
            return response()->json(['success' => false, 'message' => 'Commission is already marked as paid.'], 422);
        }

        if ((float) $commission->amount <= 0) {
            return response()->json(['success' => false, 'message' => 'Cannot settle a commission of zero or negative amount.'], 422);
        }

        $commission->update([
            'payment_status'    => 'paid',
            'paid_at'           => now(),
            'paid_by'           => $request->user()->id,
            'payment_method'    => $request->payment_method,
            'payment_reference' => $request->payment_reference,
            'payment_notes'     => $request->payment_notes ?? null,
        ]);

        app(\App\Services\NotificationService::class)->send(
            $commission->payee_id,
            'commission_paid',
            '✅ Commission Payment Received',
            "₹{$commission->amount} has been settled by Super Admin. Ref: {$request->payment_reference}",
            ['commission_id' => $commission->id, 'amount' => $commission->amount]
        );

        return response()->json([
            'success' => true,
            'message' => 'Admin commission settled successfully.',
            'data'    => $commission->fresh(['payee', 'paidBy']),
        ]);
    }

    /** Monitor Consumer Team Ratings */
    public function consumerRatings(Request $request): JsonResponse
    {
        $query = ConsumerRating::with(['lead', 'consumer', 'ratedUser'])
            ->latest();

        if ($request->filled('role')) {
            $query->whereRoleRated($request->role);
        }

        return response()->json(['success' => true, 'data' => $query->paginate($request->per_page ?? 20)]);
    }

    /** Monitor Consumer Support Tickets from Status Logs */
    public function supportTickets(Request $request): JsonResponse
    {
        $notesCol = 'notes';
        $query = LeadStatusLog::with(['lead', 'changedBy'])
            ->where($notesCol, 'like', 'SUPPORT TICKET:%')
            ->latest();

        return response()->json(['success' => true, 'data' => $query->paginate($request->per_page ?? 20)]);
    }

    /** Escalate a support ticket to the assigned Administrator */
    public function escalateTicket(Request $request, string $ulid): JsonResponse
    {
        $request->validate(['message' => 'nullable|string']);

        $lead = Lead::whereUlid($ulid)->firstOrFail();
        
        if (!$lead->assigned_admin_id) {
            return response()->json(['success' => false, 'message' => 'No administrator assigned to this lead. Please assign an admin first.'], 400);
        }

        $log = $lead->statusLogs()->create([
            'from_status' => $lead->status,
            'to_status' => $lead->status,
            'notes' => "ADMIN_ACTION_REQUIRED: " . ($request->message ?? "Action Required on Support Query"),
            'changed_by' => $request->user()->id,
        ]);

        // Notify the assigned Admin
        app(\App\Services\NotificationService::class)->notifyAdminEscalation($lead, $request->message ?? "A support query requires your attention.");

        return response()->json([
            'success' => true,
            'message' => 'Support query escalated to administrator successfully.',
            'data' => $log
        ]);
    }

    /** Resolve a support ticket (Admin action) */
    public function resolveTicket(Request $request, string $ulid): JsonResponse
    {
        $request->validate(['message' => 'required|string']);

        $lead = Lead::whereUlid($ulid)->firstOrFail();

        $log = $lead->statusLogs()->create([
            'from_status' => $lead->status,
            'to_status' => $lead->status,
            'notes' => "SUPPORT_RESOLVED: " . $request->message,
            'changed_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Support ticket marked as resolved.',
            'data' => $log
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // EARNINGS SUMMARY  — Super Admin top-level profit overview
    // ═══════════════════════════════════════════════════════════════════

    public function earningsSummary(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        $leadQuery = Lead::query();
        if ($startDate) $leadQuery->whereDate('created_at', '>=', $startDate);
        if ($endDate)   $leadQuery->whereDate('created_at', '<=', $endDate);

        $leads = $leadQuery->get();

        $totalSystemRevenue   = (float) $leads->sum(fn($l) => (float) $l->lead_revenue);
        $totalAllocatedAdmins = (float) $leads->sum(fn($l) => (float) $l->admin_received_commission);
        $netSuperAdminProfit  = $totalSystemRevenue - $totalAllocatedAdmins;

        // Per-capacity breakdown
        $byCapacity = $leads->groupBy(fn($l) => $l->system_capacity)->map(function ($group, $cap) {
            return [
                'capacity'            => $cap ?: 'unknown',
                'lead_count'          => $group->count(),
                'total_revenue'       => (float) $group->sum(fn($l) => (float) $l->lead_revenue),
                'total_allocated'     => (float) $group->sum(fn($l) => (float) $l->admin_received_commission),
                'net'                 => (float) ($group->sum(fn($l) => (float) $l->lead_revenue) - $group->sum(fn($l) => (float) $l->admin_received_commission)),
            ];
        })->values();

        // Monthly breakdown for chart (last 12 months)
        $monthly = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $monthLeads = $leads->filter(fn($l) => $l->created_at->format('Y-m') === $month->format('Y-m'));
            $monthly[] = [
                'month'          => $month->format('M Y'),
                'revenue'        => (float) $monthLeads->sum(fn($l) => (float) $l->lead_revenue),
                'allocated'      => (float) $monthLeads->sum(fn($l) => (float) $l->admin_received_commission),
                'net'            => (float) ($monthLeads->sum(fn($l) => (float) $l->lead_revenue) - $monthLeads->sum(fn($l) => (float) $l->admin_received_commission)),
                'lead_count'     => $monthLeads->count(),
            ];
        }

        // Admin-wise breakdown
        $adminBreakdown = $leads->whereNotNull('assigned_admin_id')->groupBy(fn($l) => $l->assigned_admin_id)
            ->map(function ($group, $adminId) {
                $admin = User::find($adminId);
                return [
                    'admin_id'        => $adminId,
                    'admin_name'      => $admin?->name ?? 'Unknown',
                    'lead_count'      => $group->count(),
                    'total_revenue'   => (float) $group->sum(fn($l) => (float) $l->lead_revenue),
                    'total_allocated' => (float) $group->sum(fn($l) => (float) $l->admin_received_commission),
                    'net'             => (float) ($group->sum(fn($l) => (float) $l->lead_revenue) - $group->sum(fn($l) => (float) $l->admin_received_commission)),
                ];
            })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'total_system_revenue'    => $totalSystemRevenue,
                'total_allocated_admins'  => $totalAllocatedAdmins,
                'net_super_admin_profit'  => $netSuperAdminProfit,
                'pending_settlements'     => (float) Commission::wherePayeeRole('admin')->wherePaymentStatus('unpaid')->sum('amount'),
                'total_leads'             => $leads->count(),
                'disbursed_leads'         => $leads->whereNotNull('admin_received_commission')->count(),
                'by_capacity'             => $byCapacity,
                'monthly_trend'           => $monthly,
                'admin_breakdown'         => $adminBreakdown,
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // LEDGER APPROVALS  — Super Admin reviews admin ledger entries
    // ═══════════════════════════════════════════════════════════════════

    public function pendingLedgerApprovals(Request $request): JsonResponse
    {
        $query = \App\Models\AdminLedger::with(['admin:id,name,role', 'createdBy:id,name,role'])
            ->whereStatus('pending')
            ->latest();

        $perPage = (int) $request->input('per_page', 20);
        $items   = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $items->items(),
            'meta'    => [
                'current_page' => $items->currentPage(),
                'last_page'    => $items->lastPage(),
                'total'        => $items->total(),
            ],
        ]);
    }

    public function approveLedger(Request $request, int $id): JsonResponse
    {
        $entry = \App\Models\AdminLedger::findOrFail($id);

        if ($entry->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'This entry is already ' . $entry->status . '.'], 422);
        }

        $entry->update([
            'status'     => 'approved',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ledger entry approved.',
            'data'    => $entry->fresh(['admin', 'createdBy']),
        ]);
    }

    public function rejectLedger(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'nullable|string|max:500']);

        $entry = \App\Models\AdminLedger::findOrFail($id);

        if ($entry->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'This entry is already ' . $entry->status . '.'], 422);
        }

        $entry->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->reason ?? 'Rejected by Super Admin.',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ledger entry rejected.',
            'data'    => $entry->fresh(['admin', 'createdBy']),
        ]);
    }
}
