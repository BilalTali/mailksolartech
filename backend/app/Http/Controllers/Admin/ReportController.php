<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function pipelineSummary(Request $request)
    {
        try {
            $user = $request->user();
            $query = Lead::select('status', DB::raw('count(*) as total'));

            if (!$user->isSuperAdmin()) {
                $managedIds = $user->getManagedUserIds();
                $query->where(function ($q) use ($managedIds) {
                    $q->whereIn('created_by_super_agent_id', $managedIds)
                      ->orWhereIn('submitted_by_agent_id', $managedIds)
                      ->orWhereIn('assigned_super_agent_id', $managedIds)
                      ->orWhereIn('assigned_agent_id', $managedIds);
                });
            }

            if ($request->has('status')) {
                $query->where(fn ($q) => $q->where('status', (string) $request->status));
            }
            $statusCounts = $query->groupBy('status')
                ->pluck('total', 'status');

            $total = Lead::query();
            if (!$user->isSuperAdmin()) {
                $managedIds = $user->getManagedUserIds();
                $total->where(function ($q) use ($managedIds) {
                    $q->whereIn('created_by_super_agent_id', $managedIds)
                      ->orWhereIn('submitted_by_agent_id', $managedIds)
                      ->orWhereIn('assigned_super_agent_id', $managedIds)
                      ->orWhereIn('assigned_agent_id', $managedIds);
                });
            }
            $totalCount = $total->count();

            // Broad definition of "Installed" for the dashboard cards
            $installedCount = (clone $total)->whereIn('status', ['REGISTERED', 'SURVEY_DONE', 'AT_BANK', 'LEAD_COMPLETED', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_APPLIED', 'SUBSIDY_DISBURSED'])->count();

            // Define funnel steps to calculate drop-offs
            $funnel = [
                'new' => $statusCounts['NEW'] ?? $statusCounts['new'] ?? 0,
                'registered' => $statusCounts['REGISTERED'] ?? $statusCounts['registered'] ?? 0,
                'site_survey' => $statusCounts['SURVEY_DONE'] ?? $statusCounts['survey_done'] ?? 0,
                'completed' => $statusCounts['LEAD_COMPLETED'] ?? $statusCounts['lead_completed'] ?? 0,
                'installed' => $installedCount,
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $totalCount,
                    'funnel' => $funnel,
                    'status_distribution' => $statusCounts,
                ],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Pipeline Summary Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load pipeline data: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function agentPerformance(Request $request)
    {
        try {
            $user = $request->user();
            $agentsQuery = User::query()->where('role', 'agent');
            if (!$user->isSuperAdmin()) {
                $managedIds = $user->getManagedUserIds();
                $agentsQuery->whereIn('id', $managedIds);
            }

            $agents = $agentsQuery
                ->select('id', 'name', 'agent_id')
                ->withCount('submittedLeads as total_source_leads')
                ->withCount('assignedLeads as total_assigned_leads')
                ->withCount(['assignedLeads as installed_leads' => function ($q) use ($request) {
                    $q->where(fn($q2) => $q2->whereIn('status', ['REGISTERED', 'SURVEY_DONE', 'AT_BANK', 'LEAD_COMPLETED', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_APPLIED', 'SUBSIDY_DISBURSED']));
                    // Note: 'is_active' is typically a user property, not a lead property.
                }])
                ->withSum(['commissions as total_earned' => function ($q) {
                    $q->where(fn($q2) => $q2->where('payment_status', 'paid'));
                }], 'amount')
                ->get();

            foreach ($agents as $agent) {
                $agent->total_leads = $agent->total_source_leads + $agent->total_assigned_leads;
                $agent->conversion_rate = $agent->total_leads > 0
                    ? round(($agent->installed_leads / $agent->total_leads) * 100, 2)
                    : 0;
            }

            // Sort by total_leads and paginate
            $sortedAgents = $agents->sortByDesc('total_leads')->values();


            $perPage = $request->input('per_page', 20);
            $page = $request->input('page', 1);
            $paginated = new \Illuminate\Pagination\LengthAwarePaginator(
                $sortedAgents->forPage($page, $perPage),
                $sortedAgents->count(),
                $perPage,
                $page,
                ['path' => $request->url(), 'query' => $request->query()]
            );

            return response()->json([
                'success' => true,
                'data' => $paginated,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Agent Performance Report Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to load agent performance: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function geographicDistribution(Request $request)
    {
        try {
            $user = $request->user();
            $leadQuery = Lead::query();
            if (!$user->isSuperAdmin()) {
                $managedIds = $user->getManagedUserIds();
                $leadQuery->where(function ($q) use ($managedIds) {
                    $q->whereIn('created_by_super_agent_id', $managedIds)
                      ->orWhereIn('submitted_by_agent_id', $managedIds)
                      ->orWhereIn('assigned_super_agent_id', $managedIds)
                      ->orWhereIn('assigned_agent_id', $managedIds);
                });
            }

            $byState = (clone $leadQuery)->select('beneficiary_state as state', DB::raw('count(*) as count'))
                ->groupBy('beneficiary_state')
                ->orderByRaw('count(*) DESC')
                ->get();

            $topDistricts = (clone $leadQuery)->select('beneficiary_district as district', 'beneficiary_state as state', DB::raw('count(*) as count'))
                ->groupBy('beneficiary_state', 'beneficiary_district')
                ->orderByRaw('count(*) DESC')
                ->take(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'by_state' => $byState,
                    'top_districts' => $topDistricts,
                ],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Geographic Report Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to load geographic data: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function monthlyTrend(Request $request)
    {
        try {
            $user = $request->user();
            $leadQuery = Lead::query();
            if (!$user->isSuperAdmin()) {
                $managedIds = $user->getManagedUserIds();
                $leadQuery->where(function ($q) use ($managedIds) {
                    $q->whereIn('created_by_super_agent_id', $managedIds)
                      ->orWhereIn('submitted_by_agent_id', $managedIds)
                      ->orWhereIn('assigned_super_agent_id', $managedIds)
                      ->orWhereIn('assigned_agent_id', $managedIds);
                });
            }

            $months = 12;
            $trend = collect();

            for ($i = $months - 1; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);

                $newLeads = (clone $leadQuery)->whereMonth('created_at', $date->month)
                    ->whereYear('created_at', $date->year)
                    ->count();

                $installations = (clone $leadQuery)->where(fn($q) => $q->whereIn('status', ['REGISTERED', 'SURVEY_DONE', 'AT_BANK', 'LEAD_COMPLETED', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_APPLIED', 'SUBSIDY_DISBURSED']))
                    ->whereMonth('updated_at', $date->month)
                    ->whereYear('updated_at', $date->year)
                    ->count();

                $trend->push((object) [
                    'month' => $date->format('M Y'),
                    'new_leads' => $newLeads,
                    'installations' => $installations,
                ]);
            }


            return response()->json([
                'success' => true,
                'data' => $trend,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Monthly Trend Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load trend data: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function superAgentPerformance(Request $request)
    {
        try {
            $user = $request->user();
            $saQuery = User::query()->where('role', 'super_agent');
            if (!$user->isSuperAdmin()) {
                $managedIds = $user->getManagedUserIds();
                $saQuery->whereIn('id', $managedIds);
            }

            $superAgents = $saQuery
                ->select('id', 'name', 'agent_id', 'super_agent_code')
                ->withCount('managedAgents as team_size')
                ->get();

            foreach ($superAgents as $sa) {
                $agentIds = $sa->managedAgents()->pluck('id');

                if ($agentIds->isEmpty()) {
                    $sa->total_leads = 0;
                    $sa->total_installed = 0;
                    $sa->conversion_rate = 0;
                    $sa->top_agents = collect();
                    continue;
                }

                // Aggregated Team Metrics (Count leads where team is submitter OR assignee)
                $teamLeadsQuery = Lead::where(function ($q) use ($agentIds) {
                    $q->whereIn('submitted_by_agent_id', $agentIds)
                        ->orWhereIn('assigned_agent_id', $agentIds);
                });

                $sa->total_leads = (clone $teamLeadsQuery)->count();
                $sa->total_installed = (clone $teamLeadsQuery)->where(fn($q) => $q->whereIn('status', ['REGISTERED', 'SURVEY_DONE', 'AT_BANK', 'LEAD_COMPLETED', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_APPLIED', 'SUBSIDY_DISBURSED']))->count();

                $sa->conversion_rate = $sa->total_leads > 0
                    ? round(($sa->total_installed / $sa->total_leads) * 100, 2)
                    : 0;

                // Top Performing Agents in this SA's team
                $sa->top_agents = User::whereIn('id', $agentIds)
                    ->select('id', 'name', 'agent_id')
                    ->withCount(['submittedLeads as total_source_leads'])
                    ->withCount(['assignedLeads as total_assigned_leads'])
                    ->withCount(['assignedLeads as installed_leads' => function ($q) {
                        $q->whereIn('status', ['REGISTERED', 'SURVEY_DONE', 'AT_BANK', 'LEAD_COMPLETED', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_APPLIED', 'SUBSIDY_DISBURSED']);
                    }])
                    ->get();

                foreach ($sa->top_agents as $agent) {
                    $agent->total_leads = $agent->total_source_leads + $agent->total_assigned_leads;
                    $agent->conversion_rate = $agent->total_leads > 0
                        ? round(($agent->installed_leads / $agent->total_leads) * 100, 2)
                        : 0;
                }

                // Sort top agents by total leads and take top 5
                $sa->top_agents = $sa->top_agents->sortByDesc('total_leads')->take(5)->values();
            }

            // Sort Super Agents by their team's total leads
            $sortedSAs = $superAgents->sortByDesc('total_leads')->values();

            return response()->json([
                'success' => true,
                'data' => $sortedSAs,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Super Agent Report Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to load performance data: ' . $e->getMessage(),
            ], 500);
        }
    }
}
