<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Rules\GloballyUniqueMobile;
use Illuminate\Http\Request;

class AgentEnumeratorController extends Controller
{
    public function __construct(private \App\Services\AgentService $agentService) {}

    /**
     * List enumerators created by this Agent.
     */
    public function index(Request $request)
    {
        $enumerators = \App\Models\User::query()->enumerators()
            ->where(fn($q) => $q->where('created_by_agent_id', $request->user()->id))
            ->get();

        return response()->json(['success' => true, 'data' => $enumerators]);
    }

    /**
     * Agent creates an enumerator — leads route Agent → SA → Admin.
     * Commission: Admin → SA → Agent → Enumerator.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'                  => 'required|string|max:255',
            'mobile'                => ['required', 'string', 'size:10', 'regex:/^[6-9]\d{9}$/', new GloballyUniqueMobile],
            'email'                 => 'required|email|unique:users,email',
            'offer_point_threshold' => 'nullable|integer|min:0|max:200',
        ]);

        $agent = $request->user();

        $enumerator = $this->agentService->createEnumerator(
            $request->only(['name', 'mobile', 'email', 'offer_point_threshold']),
            $agent,
            'agent'
        );

        return response()->json([
            'success' => true,
            'message' => 'Enumerator created successfully.',
            'data'    => $enumerator,
        ], 201);
    }

    /**
     * Update the status of an enumerator belonging to this agent.
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:active,inactive,pending']);
        $agent = $request->user();
        $enum = \App\Models\User::query()->enumerators()
            ->where(fn($q) => $q->where('created_by_agent_id', $agent->id))
            ->findOrFail($id);
        $enum->update(['status' => $request->status]);
        return response()->json(['success' => true]);
    }
}
