<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Rules\GloballyUniqueMobile;
use App\Services\AgentService;
use Illuminate\Http\Request;

class SuperAgentEnumeratorController extends Controller
{
    public function __construct(private AgentService $agentService) {}

    /**
     * List all enumerators created by this Super Agent directly.
     */
    public function index(Request $request)
    {
        $saId = $request->user()->id;

        $enumerators = \App\Models\User::query()->enumerators()
            ->where(function ($q) use ($saId) {
                // Enumerators created directly by this SA
                $q->where('created_by_super_agent_id', $saId)
                  ->where('enumerator_creator_role', 'super_agent');
            })
            ->orWhere(function ($q) use ($saId) {
                // Enumerators created by agents under this SA
                $q->whereHas('parentAgent', fn ($a) => $a->where('super_agent_id', $saId))
                  ->where('enumerator_creator_role', 'agent');
            })
            ->with([
                'parentAgent:id,name,agent_id', 
                'createdBySuperAgent:id,name,super_agent_code'
            ])
            ->withCount('enumeratorLeads')
            ->get()
            ->map(function ($e) {
                return [
                    'id'                     => $e->id,
                    'name'                   => $e->name,
                    'mobile'                 => $e->mobile,
                    'email'                  => $e->email,
                    'enumerator_id'          => $e->enumerator_id,
                    'status'                 => $e->status,
                    'total_leads'            => $e->enumerator_leads_count,
                    'enumerator_creator_role'=> $e->enumerator_creator_role,
                    'created_by'             => $e->enumerator_creator_role === 'agent' 
                                                ? ['name' => $e->parentAgent?->name, 'code' => $e->parentAgent?->agent_id]
                                                : ['name' => $e->createdBySuperAgent?->name, 'code' => $e->createdBySuperAgent?->super_agent_code],
                    'created_at'             => $e->created_at,
                    // Additional fields for side panel
                    'father_name'            => $e->father_name,
                    'dob'                    => $e->dob,
                    'gender'                 => $e->gender,
                    'blood_group'            => $e->blood_group,
                    'state'                  => $e->state,
                    'district'               => $e->district,
                    'area'                   => $e->area,
                    'whatsapp_number'        => $e->whatsapp_number,
                    'marital_status'         => $e->marital_status,
                ];
            });

        return response()->json(['success' => true, 'data' => $enumerators]);
    }

    /**
     * Super Agent creates an enumerator — leads route SA → Admin.
     * Commission: Admin → SA → Enumerator.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'                  => 'required|string|max:255',
            'mobile'                => ['required', 'string', 'size:10', 'regex:/^[6-9]\d{9}$/', new GloballyUniqueMobile],
            'email'                 => 'required|email|unique:users,email',
            'offer_point_threshold' => 'nullable|integer|min:0|max:200',
        ]);

        $sa = $request->user();

        $enumerator = $this->agentService->createEnumerator(
            $request->only(['name', 'mobile', 'email', 'offer_point_threshold']),
            $sa,
            'super_agent'
        );

        return response()->json([
            'success' => true,
            'message' => 'Enumerator created. Leads will go to you for approval before Admin.',
            'data'    => $enumerator,
        ], 201);
    }

    public function show($id)
    {
        $user = \App\Models\User::query()->enumerators()->findOrFail($id);
        return response()->json(['success' => true, 'data' => $user]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:active,inactive,pending']);
        $user = \App\Models\User::query()->enumerators()->findOrFail($id);
        
        $user->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Enumerator status updated to ' . $request->status,
            'data'    => $user
        ]);
    }
}
