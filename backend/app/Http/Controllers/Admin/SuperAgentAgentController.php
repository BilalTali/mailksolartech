<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AgentRegistrationRequest;
use App\Models\User;
use App\Services\AgentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperAgentAgentController extends Controller
{
    public function __construct(private AgentService $agentService) {}

    /** List all agents in this super agent's team */
    public function index(Request $request): JsonResponse
    {
        $superAgent = $request->user();

        $query = User::query()->agents()
            ->where(fn ($q) => $q->where('super_agent_id', $superAgent->id))
            ->with(['commissions', 'assignedLeads']);

        if ($request->search) {
            $search = str_replace(['%', '_'], ['\%', '\_'], $request->search);
            $query->where(function ($q) use ($search) {
                $q->where(fn ($q2) => $q2->where('name', 'like', "%{$search}%"))
                    ->orWhere(fn ($q2) => $q2->where('mobile', 'like', "%{$search}%"))
                    ->orWhere(fn ($q2) => $q2->where('agent_id', 'like', "%{$search}%"));
            });
        }

        if ($request->status) {
            $query->where(fn ($q) => $q->where('status', $request->status));
        }

        if ($request->district) {
            $query->where(fn ($q) => $q->where('district', $request->district));
        }

        $agents = $query->withCount(['assignedLeads as total_leads'])
            ->paginate($request->per_page ?? 20);

        return response()->json(['success' => true, 'data' => $agents]);
    }

    /**
     * Super Agent creates a new agent for their team.
     * Agent is set to 'pending' — Admin must approve before they can log in.
     */
    public function store(AgentRegistrationRequest $request): JsonResponse
    {
        $superAgent = $request->user();

        $agent = $this->agentService->createAgentBySuperAgent(
            $request->validated(),
            $superAgent
        );

        return response()->json([
            'success' => true,
            'message' => 'Agent added to your team. Awaiting Admin approval before they can log in.',
            'data' => $agent->fresh(),
        ], 201);
    }

    /** Get a specific agent's detail (only if in super agent's team) */
    public function show(Request $request, int $agentId): JsonResponse
    {
        $superAgent = $request->user();

        $agent = User::query()->agents()
            ->where(fn ($q) => $q->where('id', $agentId))
            ->where(fn ($q) => $q->where('super_agent_id', $superAgent->id))
            ->with(['commissions.lead', 'assignedLeads'])
            ->withCount(['assignedLeads as total_leads'])
            ->firstOrFail();

        $stats = [
            'total_leads' => $agent->assignedLeads()->count(),
            'installed' => $agent->assignedLeads()->where(fn ($q) => $q->whereIn('status', ['REGISTERED', 'SITE_SURVEY', 'AT_BANK', 'COMPLETED', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_APPLIED', 'SUBSIDY_DISBURSED']))->count(),
            'completed' => $agent->assignedLeads()->where(fn ($q) => $q->where('status', 'COMPLETED'))->count(),
            'commission_earned' => $agent->commissions()->where(fn ($q) => $q->where('payment_status', 'paid'))->sum('amount'),
            'commission_pending' => $agent->commissions()->where(fn ($q) => $q->where('payment_status', 'unpaid'))->sum('amount'),
        ];

        return response()->json([
            'success' => true,
            'data' => array_merge($agent->toArray(), ['stats' => $stats]),
        ]);
    }
}
