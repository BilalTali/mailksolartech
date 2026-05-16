<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignAgentToSuperAgentRequest;
use App\Http\Requests\StoreSuperAgentRequest;
use App\Http\Requests\UpdateSuperAgentRequest;
use App\Models\SuperAgentTeamLog;
use App\Models\User;
use App\Services\AgentService;
use App\Services\SuperAgentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSuperAgentController extends Controller
{
    public function __construct(
        private AgentService $agentService,
        private SuperAgentService $superAgentService
    ) {}

    /** List all super agents with team stats */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = User::query()->superAgents()->withCount('managedAgents as agent_count');

        if (!$user->isSuperAdmin()) {
            $managedIds = $user->getManagedUserIds();
            $query->whereIn('id', $managedIds);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->state) {
            $query->where('state', $request->state);
        }
        if ($request->search) {
            $search = str_replace(['%', '_'], ['\%', '\_'], $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('super_agent_code', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%");
            });
        }

        $superAgents = $query->latest()->paginate($request->per_page ?? 20);

        return response()->json(['success' => true, 'data' => $superAgents]);
    }

    /** Get a single super agent's full detail */
    public function show(int $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $query = User::query()->superAgents()
            ->with(['managedAgents'])
            ->withCount('managedAgents as agent_count');

        if (!$user->isSuperAdmin()) {
            $query->where('parent_id', $user->id);
        }

        $superAgent = $query->findOrFail($id);

        $stats = $this->superAgentService->getTeamStats($superAgent);

        return response()->json([
            'success' => true,
            'data' => array_merge($superAgent->toArray(), ['stats' => $stats]),
        ]);
    }

    /** Create a new super agent (admin only) */
    public function store(StoreSuperAgentRequest $request): JsonResponse
    {
        $superAgent = DB::transaction(function () use ($request) {
            $superAgent = User::forceCreate([
                'name' => $request->name,
                'mobile' => $request->mobile,
                'email' => $request->email,
                'password' => $request->password,
                'whatsapp_number' => $request->whatsapp_number,
                'district' => $request->district,
                'state' => $request->state,
                'area' => $request->area,
                'managed_states' => $request->managed_states,
                'role' => 'super_agent',
                'status' => 'active',
                'parent_id' => $request->user()->id,
                'super_agent_code' => $this->agentService->generateSuperAgentCode(),
                'qr_token' => hash('sha256', \Illuminate\Support\Str::random(40).uniqid().now()->timestamp),
                'qr_generated_at' => now(),
            ]);

            return $superAgent;
        });

        return response()->json([
            'success' => true,
            'data' => $superAgent,
            'message' => "Super Agent created. Code: {$superAgent->super_agent_code}",
        ], 201);
    }

    /** Update super agent info */
    public function update(UpdateSuperAgentRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $query = User::query()->superAgents();
        if (!$user->isSuperAdmin()) {
            $query->where('parent_id', $user->id);
        }
        $superAgent = $query->findOrFail($id);
        $superAgent->update($request->validated());

        return response()->json(['success' => true, 'data' => $superAgent->fresh(), 'message' => 'Updated.']);
    }

    /** Change super agent status */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate(['status' => ['required', 'in:active,inactive']]);
        $user = $request->user();
        $query = User::query()->superAgents();
        if (!$user->isSuperAdmin()) {
            $query->where('parent_id', $user->id);
        }
        $superAgent = $query->findOrFail($id);

        $updateData = ['status' => $request->status];

        // Generate QR if activating and missing
        if ($request->status === 'active' && ! $superAgent->qr_token) {
            $updateData['qr_token'] = hash('sha256', \Illuminate\Support\Str::random(40).$superAgent->id.now()->timestamp);
            $updateData['qr_generated_at'] = now();
        }

        $superAgent->forceFill($updateData)->save();

        return response()->json(['success' => true, 'data' => $superAgent->fresh(), 'message' => 'Status updated.']);
    }

    /** Soft delete super agent */
    public function destroy(int $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $query = User::query()->superAgents();
        if (!$user->isSuperAdmin()) {
            $query->where('parent_id', $user->id);
        }
        $superAgent = $query->findOrFail($id);
        if ($superAgent->managedAgents()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Unassign or reassign all agents before deleting this super agent.',
            ], 422);
        }
        $superAgent->delete();

        return response()->json(['success' => true, 'message' => 'Super agent deleted.']);
    }

    /** List agents assigned to this super agent */
    public function teamAgents(int $id): JsonResponse
    {
        $superAgent = User::query()->superAgents()->findOrFail($id);
        $agents = $superAgent->managedAgents()->withCount('assignedLeads as total_leads')->get();

        return response()->json(['success' => true, 'data' => $agents]);
    }

    /** Assign a single agent to super agent */
    public function assignAgent(AssignAgentToSuperAgentRequest $request, int $id): JsonResponse
    {
        $superAgent = User::query()->superAgents()->findOrFail($id);
        $agent = User::query()->agents()->findOrFail($request->agent_id);

        if ($agent->super_agent_id) {
            return response()->json([
                'success' => false,
                'message' => 'Agent is already assigned to another super agent. Unassign first.',
            ], 422);
        }

        $this->superAgentService->assignAgent($superAgent, $agent, $request->user());

        return response()->json(['success' => true, 'message' => 'Agent assigned successfully.']);
    }

    /** Bulk assign multiple agents */
    public function assignAgentsBulk(AssignAgentToSuperAgentRequest $request, int $id): JsonResponse
    {
        $superAgent = User::query()->superAgents()->findOrFail($id);
        $agentIds = $request->agent_ids ?? [$request->agent_id];

        $assigned = [];
        $skipped = [];

        foreach ($agentIds as $agentId) {
            $agent = User::query()->agents()->find($agentId);
            if (! $agent) {
                continue;
            }
            if ($agent->super_agent_id) {
                $skipped[] = $agentId;

                continue;
            }
            $this->superAgentService->assignAgent($superAgent, $agent, $request->user());
            $assigned[] = $agentId;
        }

        return response()->json([
            'success' => true,
            'message' => count($assigned).' agent(s) assigned.',
            'data' => ['assigned' => $assigned, 'skipped' => $skipped],
        ]);
    }

    /** Unassign a specific agent */
    public function unassignAgent(Request $request, int $id, int $agentId): JsonResponse
    {
        $superAgent = User::query()->superAgents()->findOrFail($id);
        $agent = User::query()->agents()->where(fn($q) => $q->where('super_agent_id', $superAgent->id))->findOrFail($agentId);

        $this->superAgentService->unassignAgent($superAgent, $agent, $request->user(), $request->notes);

        return response()->json(['success' => true, 'message' => 'Agent unassigned.']);
    }

    /** Full audit log of agent assignments */
    public function teamLog(int $id): JsonResponse
    {
        $superAgent = User::query()->superAgents()->findOrFail($id);
        $logs = SuperAgentTeamLog::query()->where(fn($q) => $q->where('super_agent_id', $superAgent->id))
            ->with(['agent', 'assignedBy'])->latest()->paginate(50);

        return response()->json(['success' => true, 'data' => $logs]);
    }

    /** List all unassigned active agents */
    public function unassignedAgents(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->isSuperAdmin()) {
            return response()->json(['success' => true, 'data' => ['data' => [], 'total' => 0]]);
        }

        $search = $request->search ? str_replace(['%', '_'], ['\%', '\_'], $request->search) : null;
        $agents = User::query()->agents()->active()->whereNull('super_agent_id')
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('agent_id', 'like', "%{$search}%"))
            ->paginate(50);

        return response()->json(['success' => true, 'data' => $agents]);
    }

    public function getQrScans($id)
    {
        $sa = User::query()->superAgents()->findOrFail($id);

        $scans = $sa->qrScanLogs()
            ->orderBy('scanned_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $scans,
        ]);
    }

    public function regenerateQr($id)
    {
        $sa = User::query()->superAgents()->findOrFail($id);

        $sa->update([
            'qr_token' => hash('sha256', \Illuminate\Support\Str::random(40).$sa->id.now()->timestamp),
            'qr_generated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'QR code regenerated successfully. Old cards are now invalid.',
            'data' => $sa->fresh(),
        ]);
    }

    public function togglePublicContact(Request $request, $id)
    {
        $sa = User::query()->superAgents()->findOrFail($id);
        
        $sa->update([
            'is_public_contact' => !$sa->is_public_contact
        ]);

        return response()->json([
            'success' => true,
            'message' => $sa->is_public_contact ? 'Marked as public contact' : 'Removed from public contacts',
            'data' => $sa->fresh()
        ]);
    }
}
