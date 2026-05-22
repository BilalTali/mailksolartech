<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Commission;
use App\Models\Lead;
use App\Models\User;
use App\Models\AdminInventory;
use App\Models\AdminStockDispatch;
use App\Models\InventoryItem;

class AdminDashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        return $this->adminStats($request->user());
    }

    /**
     * One-time repair for orphaned users to restore hierarchy branding.
     */
    public function fixHierarchy(Request $request): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            abort(403);
        }

        $fixed = 0;
        $orphans = User::query()
            ->whereNull('parent_id')
            ->whereNotIn('role', ['super_admin', 'admin'])
            ->get();

        /** @var User $user */
        foreach ($orphans as $user) {
            // Attempt rescue from super_agent_id
            if ($user->super_agent_id) {
                $user->parent_id = $user->super_agent_id;
                $user->save();
                $fixed++;
                continue;
            }

            // Attempt rescue from created_by_super_agent_id
            if ($user->created_by_super_agent_id) {
                $user->parent_id = $user->created_by_super_agent_id;
                $user->save();
                $fixed++;
                continue;
            }

            // Attempt rescue from created_by_agent_id (for Enumerators)
            if ($user->created_by_agent_id) {
                $user->parent_id = $user->created_by_agent_id;
                $user->save();
                $fixed++;
                continue;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Fixed {$fixed} orphaned users.",
        ]);
    }

    public function adminStats($user)
    {
        $isSuperAdmin = $user->isSuperAdmin();
        $adminId = $isSuperAdmin ? null : ($user->isOperator() && $user->parent_id ? $user->parent_id : $user->id);
        $today = now()->startOfDay();
        $thisMonth = now()->startOfMonth();

        // Multi-tenant Isolation: Get all managed IDs for recursive team visibility
        $managedIds = $isSuperAdmin ? [] : $user->getManagedUserIds();

        $leadQuery = Lead::query();
        if (!$isSuperAdmin) {
            $leadQuery->where(function ($q) use ($user, $managedIds, $adminId) {
                $q->where(function ($q2) use ($managedIds) {
                    $q2->where('owner_type', 'admin_pool')
                       ->where(function ($q3) use ($managedIds) {
                           $q3->whereIn('created_by_super_agent_id', $managedIds)
                              ->orWhereIn('submitted_by_agent_id', $managedIds)
                              ->orWhereIn('submitted_by_enumerator_id', $managedIds)
                              ->orWhereIn('assigned_agent_id', $managedIds)
                              ->orWhereIn('assigned_super_agent_id', $managedIds)
                              ->orWhereIn('assigned_admin_id', $managedIds);
                       });
                })
                ->orWhere('assigned_admin_id', $adminId)
                ->orWhere('wa_handler_admin_id', $adminId);
            });
        }

        $totalLeads = (clone $leadQuery)->count();
        $newLeadsToday = (clone $leadQuery)->where('created_at', '>=', $today)->count();
        $leadsThisMonth = (clone $leadQuery)->where('created_at', '>=', $thisMonth)->count();

        $installedStatuses = ['REGISTERED', 'SITE_SURVEY', 'AT_BANK', 'COMPLETED', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_APPLIED', 'SUBSIDY_DISBURSED'];
        $totalInstallations = (clone $leadQuery)->whereIn('status', $installedStatuses)->count();
        $installationsThisMonth = (clone $leadQuery)->whereIn('status', $installedStatuses)
            ->where('updated_at', '>=', $thisMonth)->count();

        // 2. Agents
        $agentQuery = User::query()->where('role', 'agent');
        if (!$isSuperAdmin) {
            $agentQuery->whereIn('id', $managedIds);
        }

        $activeAgents = (clone $agentQuery)->where('status', 'active')->count();
        $pendingAgents = (clone $agentQuery)->where('status', 'pending')->count();

        // 3. Commissions
        $commQuery = Commission::query();
        if (!$isSuperAdmin) {
            $commQuery->whereIn('payee_id', $managedIds);
        }

        $totalAgentPaid = (clone $commQuery)->where('payee_role', 'agent')->where('payment_status', 'paid')->sum('amount');
        $totalSuperAgentPaid = (clone $commQuery)->where('payee_role', 'super_agent')->where('payment_status', 'paid')->sum('amount');
        $totalEnumeratorPaid = (clone $commQuery)->where('payee_role', 'enumerator')->where('payment_status', 'paid')->sum('amount');
        $totalCommissionPaid = $totalAgentPaid + $totalSuperAgentPaid + $totalEnumeratorPaid;

        $pendingAgent = (clone $commQuery)->where('payee_role', 'agent')->where('payment_status', 'unpaid')->sum('amount');
        $pendingSuperAgent = (clone $commQuery)->where('payee_role', 'super_agent')->where('payment_status', 'unpaid')->sum('amount');
        $pendingEnumerator = (clone $commQuery)->where('payee_role', 'enumerator')->where('payment_status', 'unpaid')->sum('amount');
        $pendingCommission = $pendingAgent + $pendingSuperAgent + $pendingEnumerator;

        // 3.5 Admin Profit Calculation
        // Formula: Net Profit = Commissions Received (payee_role=admin) + Ledger Credits
        //                     - Ledger Debits (expenses) - Commissions passed to downlines (entered_by admin)
        // Note: $adminId is already resolved at the top of the function.

        $adminLedgerCredits = $isSuperAdmin
            ? \App\Models\AdminLedger::where('transaction_type', 'credit')->sum('amount')
            : \App\Models\AdminLedger::where('admin_id', $adminId)->where('transaction_type', 'credit')->sum('amount');

        $adminLedgerDebits = $isSuperAdmin
            ? \App\Models\AdminLedger::where('transaction_type', 'debit')->sum('amount')
            : \App\Models\AdminLedger::where('admin_id', $adminId)->where('transaction_type', 'debit')->sum('amount');

        // What the admin received from Super Admin
        $adminCommissionsEarned = $isSuperAdmin
            ? Commission::where('payee_role', 'admin')->sum('amount')
            : Commission::where('payee_id', $adminId)->where('payee_role', 'admin')->sum('amount');

        // What the admin passed down to agents / enumerators / field tech / super_agents
        // Use entered_by = admin, because the admin is the one who allocated these commissions
        $downlineRoles = ['agent', 'enumerator', 'field_technical_team', 'super_agent'];
        $commissionsPaidToSublines = $isSuperAdmin
            ? Commission::whereIn('payee_role', $downlineRoles)->sum('amount')
            : Commission::where('entered_by', $adminId)->whereIn('payee_role', $downlineRoles)->sum('amount');

        $adminNetProfit = ($adminCommissionsEarned + $adminLedgerCredits) - ($adminLedgerDebits + $commissionsPaidToSublines);

        // 4. Super Agents & Unassigned
        $saQuery = User::query()->where('role', 'super_agent');
        if (!$isSuperAdmin) {
            $saQuery->whereIn('id', $managedIds);
        }
        $activeSuperAgents = $saQuery->where('status', 'active')->count();

        // Unassigned count (only show public pool to Super Admin, or team-pool?)
        // User stated public enumerators report to admin. Unassigned agents usually for Super Admin.
        $unassignedAgentsCount = User::query()->where('role', 'agent')
            ->where('status', 'active')
            ->whereNull('super_agent_id')
            ->when(!$isSuperAdmin, fn($q) => $q->where('parent_id', $adminId)) // Only show their direct unassigned
            ->count();

        // 5. Pipeline Funnel Counts
        $statusCounts = (clone $leadQuery)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        // 6. District Distribution
        $districtDistribution = (clone $leadQuery)
            ->select('beneficiary_district', DB::raw('count(*) as total'))
            ->whereNotNull('beneficiary_district')
            ->groupBy('beneficiary_district')
            ->orderBy('total', 'desc')
            ->take(8)
            ->get();

        // 8. Inventory Stats
        $stockItemsCount = $isSuperAdmin
            ? InventoryItem::count()
            : AdminInventory::where('admin_id', $adminId)->where('current_stock', '>', 0)->count();

        $pendingReceiptsCount = $isSuperAdmin ? 0 : AdminStockDispatch::where('admin_id', $adminId)
            ->where('status', 'DISPATCHED_TO_ADMIN')->count();

        // 7. Daily Lead Trends (Last 14 Days)
        $trends = (clone $leadQuery)
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', now()->subDays(14))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'kpis' => [
                    'total_leads' => $totalLeads,
                    'new_leads_today' => $newLeadsToday,
                    'leads_this_month' => $leadsThisMonth,
                    'total_installations' => $totalInstallations,
                    'installations_this_month' => $installationsThisMonth,
                    'active_agents' => $activeAgents,
                    'pending_agents' => $pendingAgents,
                    'total_commission_paid' => $totalCommissionPaid,
                    'pending_commission' => $pendingCommission,
                    'active_super_agents' => $activeSuperAgents,
                    'unassigned_agents_count' => $unassignedAgentsCount,
                    'admin_net_profit' => $adminNetProfit,
                    'admin_profit_breakdown' => [
                        'commissions_earned'   => $adminCommissionsEarned,
                        'allowances_received'  => $adminLedgerCredits,
                        'expenses_logged'      => $adminLedgerDebits,
                        'payouts_to_sublines'  => $commissionsPaidToSublines,
                    ],
                    'stock_items_count' => $stockItemsCount,
                    'pending_receipts_count' => $pendingReceiptsCount,
                ],
                'pipeline' => $statusCounts,
                'trends' => $trends,
                'district_distribution' => $districtDistribution,
                'recent_leads' => (clone $leadQuery)->with(['assignedAgent'])
                    ->orderBy('created_at', 'desc')
                    ->take(10)
                    ->get()
                    ->makeHidden(['commission_status']), // Skip expensive accessor on list views
                'pending_approvals' => (clone $agentQuery)
                    ->where('status', 'pending')
                    ->orderBy('created_at', 'desc')
                    ->take(5)
                    ->get(),
            ],
        ]);
    }
}
