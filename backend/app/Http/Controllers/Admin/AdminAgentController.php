<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AgentRegistrationRequest;
use App\Models\User;
use App\Services\AgentService;
use Illuminate\Http\Request;

class AdminAgentController extends Controller
{
    public function __construct(private AgentService $agentService) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $query = User::query()->where(fn ($q) => $q->where('role', 'agent'))
            ->withCount(['submittedLeads as total_leads',
                'submittedLeads as installed_leads' => function ($q) {
                    $q->where(fn ($query) => $query->whereIn('status', ['REGISTERED', 'SITE_SURVEY', 'AT_BANK', 'COMPLETED', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_APPLIED', 'SUBSIDY_DISBURSED']));
                }]);

        if (!$user->isSuperAdmin()) {
            $managedIds = $user->getManagedUserIds();
            $query->whereIn('super_agent_id', $managedIds);
        }

        if ($request->has('status')) {
            $query->where(fn ($q) => $q->where('status', $request->status));
        }

        if ($request->has('search')) {
            $search = str_replace(['%', '_'], ['\%', '\_'], $request->search);
            $query->where(function ($q) use ($search) {
                $q->where(fn ($query) => $query->where('name', 'like', "%{$search}%"))
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('agent_id', 'like', "%{$search}%");
            });
        }

        $agents = $query
            ->with([
                'superAgent:id,name,super_agent_code,mobile,whatsapp_number',
                'createdBySuperAgent:id,name,super_agent_code',
            ])
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $agents,
        ]);
    }

    public function show($id, Request $request)
    {
        $user = $request->user();
        $query = User::query()->where(fn ($q) => $q->where('role', 'agent'))
            ->with([
                'commissions' => function ($q) {
                    $q->orderBy('created_at', 'desc');
                },
                'superAgent:id,name,super_agent_code',
                'createdBySuperAgent:id,name,super_agent_code',
            ])
            ->withCount('submittedLeads');

        if (!$user->isSuperAdmin()) {
            $managedIds = $user->getManagedUserIds();
            $query->whereIn('super_agent_id', $managedIds);
        }

        $agent = $query->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $agent,
        ]);
    }

    public function store(AgentRegistrationRequest $request)
    {
        $agent = $this->agentService->createAgent($request->validated(), null, 'active');

        return response()->json([
            'success' => true,
            'message' => 'Agent created and approved successfully',
            'data' => $agent->fresh(),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $agent = User::query()->where(fn ($q) => $q->where('role', 'agent'))->findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'district' => 'sometimes|string|max:255',
            'state' => 'sometimes|string|max:255',
            'whatsapp_number' => 'sometimes|string|size:10|regex:/^[6-9]\d{9}$/',
        ]);

        $agent->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Agent updated successfully',
            'data' => $agent,
        ]);
    }

    /**
     * Update agent status.
     * When approving (status=active), optionally accepts super_agent_id
     * to assign the agent to a Super Agent at the same time.
     */
    public function updateStatus(Request $request, $id)
    {
        $agent = User::query()->where(fn ($q) => $q->where('role', 'agent'))->findOrFail($id);

        $request->validate([
            'status' => 'required|in:active,inactive,pending',
            'super_agent_id' => 'nullable|exists:users,id',
        ]);

        if ($request->status === 'active' && $agent->status !== 'active') {
            $this->agentService->approveAgent(
                $agent,
                $request->user(),
                $request->super_agent_id ? (int) $request->super_agent_id : null
            );
        } else {
            $agent->forceFill(['status' => $request->status])->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Agent status updated successfully',
            'data' => clone $agent->fresh(['superAgent', 'createdBySuperAgent']),
        ]);
    }

    /**
     * Admin assigns or reassigns an existing agent to a Super Agent.
     * Accepts force=true to override origin SA restriction.
     */
    public function assignSuperAgent(Request $request, $id)
    {
        $request->validate([
            'super_agent_id' => 'required|exists:users,id',
            'force' => 'nullable|boolean',
        ]);

        $agent = User::query()->where(fn ($q) => $q->where('role', 'agent'))->findOrFail($id);
        $superAgent = User::query()->where(fn ($q) => $q->where('id', $request->super_agent_id))
            ->where(fn ($q) => $q->where('role', 'super_agent'))
            ->firstOrFail();

        $agent = $this->agentService->assignAgentToSuperAgent(
            $agent,
            $superAgent,
            $request->user(),
            (bool) $request->input('force', false)
        );

        return response()->json([
            'success' => true,
            'message' => 'Agent assigned to Super Agent successfully',
            'data' => $agent->fresh(['superAgent']),
        ]);
    }

    public function regenerateQr($id)
    {
        $agent = User::query()->where(fn ($q) => $q->where('role', 'agent'))->findOrFail($id);

        $agent->update([
            'qr_token' => hash('sha256', \Illuminate\Support\Str::random(40).$agent->id.now()->timestamp),
            'qr_generated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'QR code regenerated successfully. Old cards are now invalid.',
            'data' => $agent->fresh(),
        ]);
    }

    public function getQrScans($id)
    {
        $agent = User::query()->where(fn ($q) => $q->where('role', 'agent'))->findOrFail($id);

        $scans = $agent->qrScanLogs()
            ->orderBy('scanned_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $scans,
        ]);
    }

    public function destroy($id)
    {
        $agent = User::query()->where(fn ($q) => $q->where('role', 'agent'))->findOrFail($id);
        $agent->delete();

        return response()->json([
            'success' => true,
            'message' => 'Agent deleted successfully',
        ]);
    }
}
