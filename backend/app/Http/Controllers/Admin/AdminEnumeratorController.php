<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Rules\GloballyUniqueMobile;
use App\Services\AgentService;
use Illuminate\Http\Request;

class AdminEnumeratorController extends Controller
{
    public function __construct(private AgentService $agentService) {}

    /**
     * List all enumerators with their creator context.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = \App\Models\User::query()->enumerators()
            ->with([
                'parentAgent:id,name,agent_id,super_agent_id',
                'createdBySuperAgent:id,name,super_agent_code',
            ])
            ->withCount('enumeratorLeads');

        if (!$user->isSuperAdmin()) {
            $managedIds = $user->getManagedUserIds();
            $query->where(function ($q) use ($user, $managedIds) {
                $q->whereIn('parent_id', $managedIds)
                  ->orWhereNull('parent_id') // Publicly registered enumerators
                  ->orWhereIn('created_by_agent_id', $managedIds)
                  ->orWhereIn('created_by_super_agent_id', $managedIds);
            });
        }

        $enumerators = $query->get()
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
                    'created_by'             => match ($e->enumerator_creator_role) {
                        'agent'       => $e->parentAgent ? ['name' => $e->parentAgent->name, 'code' => $e->parentAgent->agent_id] : null,
                        'super_agent' => $e->createdBySuperAgent ? ['name' => $e->createdBySuperAgent->name, 'code' => $e->createdBySuperAgent->super_agent_code] : null,
                        'admin'       => ['name' => 'Admin', 'code' => 'ADMIN'],
                        default       => null,
                    },
                    'created_at'             => $e->created_at,
                    // Additional fields for detail view
                    'father_name'            => $e->father_name,
                    'dob'                    => $e->dob,
                    'blood_group'            => $e->blood_group,
                    'gender'                 => $e->gender,
                    'marital_status'         => $e->marital_status,
                    'whatsapp_number'        => $e->whatsapp_number,
                    'state'                  => $e->state,
                    'district'               => $e->district,
                    'area'                   => $e->area,
                    'pincode'                => $e->pincode,
                    'landmark'               => $e->landmark,
                    'permanent_address'      => $e->permanent_address,
                    'current_address'        => $e->current_address,
                    'pan_number'             => $e->pan_number,
                    'voter_id'               => $e->voter_id,
                    'qualification'          => $e->qualification,
                    'occupation'             => $e->occupation,
                    'profile_photo_url'      => $e->profile_photo_url,
                ];
            });

        return response()->json(['success' => true, 'data' => $enumerators]);
    }

    /**
     * Admin creates an enumerator — leads route directly to Admin.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'                  => 'required|string|max:255',
            'mobile'                => ['required', 'string', 'size:10', 'regex:/^[6-9]\d{9}$/', new GloballyUniqueMobile],
            'email'                 => 'nullable|email|unique:users,email',
            'offer_point_threshold' => 'nullable|integer|min:0|max:200',
        ]);

        $enumerator = $this->agentService->createEnumerator(
            $request->only(['name', 'mobile', 'email', 'offer_point_threshold']),
            $request->user(),
            'admin'
        );

        return response()->json([
            'success' => true,
            'message' => 'Enumerator created successfully. Leads will route directly to Admin.',
            'data'    => $enumerator,
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:active,inactive,pending']);
        $user = $request->user();
        $enum = \App\Models\User::query()->enumerators()->findOrFail($id);
        
        $updateData = ['status' => $request->status];

        // If the approving user is an Admin (not Super Admin) and the enumerator is orphaned,
        // adopt them into this Admin's branch.
        if ($user->isAdmin() && !$user->isSuperAdmin() && !$enum->parent_id) {
            $updateData['parent_id'] = $user->id;
        }

        $enum->update($updateData);
        return response()->json(['success' => true]);
    }
}
