<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\InvalidLeadOperationException;
use App\Exceptions\LeadAccessDeniedException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSuperAgentLeadRequest;
use App\Http\Requests\UpdateSuperAgentLeadRequest;
use App\Models\Lead;
use App\Models\User;
use App\Services\LeadService;
use App\Services\SuperAgentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SuperAgentLeadController extends Controller
{
    public function __construct(
        private SuperAgentService $superAgentService,
        private LeadService $leadService
    ) {}

    /** List leads visible to this super agent */
    public function index(Request $request): JsonResponse
    {
        $superAgent = $request->user();

        $query = Lead::query()->visibleToSuperAgent($superAgent->id)
            ->with([
                'assignedAgent', 'submittedByAgent', 'assignedSuperAgent',
                'documents' => function ($q) use ($superAgent) {
                    $q->where('visible_to_downline', true)
                      ->orWhere('uploaded_by', $superAgent->id);
                },
                'commissions'
            ]);

        if ($request->status) {
            $query->where(fn ($q) => $q->where('status', $request->status));
        }

        if ($request->has('verification_status')) {
            $query->where(fn ($q) => $q->where('verification_status', $request->verification_status));
        }

        if ($request->agent_id) {
            $query->where(fn ($q) => $q->where('assigned_agent_id', $request->agent_id));
        }

        if ($request->has('scope')) {
            if ($request->scope === 'my_leads') {
                $query->where(function ($q) use ($superAgent) {
                    $q->where(fn ($q2) => $q2->where('assigned_super_agent_id', $superAgent->id))
                        ->orWhere(fn ($q2) => $q2->where('created_by_super_agent_id', $superAgent->id));
                });
            } elseif ($request->scope === 'team_leads') {
                $query->where(function ($q) use ($superAgent) {
                    $q->whereHas('assignedAgent', function ($q2) use ($superAgent) {
                        $q2->where(fn ($q3) => $q3->where('super_agent_id', $superAgent->id));
                    })
                        ->orWhereHas('submittedByAgent', function ($q2) use ($superAgent) {
                            $q2->where(fn ($q3) => $q3->where('super_agent_id', $superAgent->id));
                        });
                });
            }
        }

        if ($request->district) {
            $query->where(fn ($q) => $q->where('beneficiary_district', $request->district));
        }

        if ($request->search) {
            $search = str_replace(['%', '_'], ['\%', '\_'], $request->search);
            $query->where(function ($q) use ($search) {
                $q->where(fn ($q2) => $q2->where('beneficiary_name', 'like', "%{$search}%"))
                    ->orWhere(fn ($q2) => $q2->where('beneficiary_mobile', 'like', "%{$search}%"))
                    ->orWhere(fn ($q2) => $q2->where('ulid', 'like', "%{$search}%"));
            });
        }

        if ($request->from_date && $request->to_date) {
            $query->whereBetween('created_at', [$request->from_date, $request->to_date]);
        }

        $leads = $query->latest()->paginate($request->per_page ?? 20);

        // Transform collection to include commission prompts
        $leads->getCollection()->transform(function ($lead) {
            $lead->append('commission_status');

            return $lead;
        });

        // Also return pending verification count
        $pendingVerificationCount = Lead::query()->needsVerificationBySuperAgent($superAgent->id)->count();

        return response()->json([
            'success' => true,
            'data' => $leads,
            'meta' => ['pending_verification_count' => $pendingVerificationCount],
        ]);
    }

    /**
     * Unified commission prompt helper
     */
    private function getCommissionPrompts(Lead $lead): array
    {
        return app(\App\Services\CommissionService::class)->getCommissionStatus($lead);
    }

    /** Create a new lead as Super Agent */
    public function store(StoreSuperAgentLeadRequest $request): JsonResponse
    {
        $superAgent = $request->user();
        $data = $request->validated();
        $data['ulid'] = Str::ulid()->toBase32();

        // Handle optional agent assignment (assign to a team agent after creation)
        if (! empty($data['agent_id'])) {
            $agentIds = User::query()->agents()->where(fn ($q) => $q->where('super_agent_id', $superAgent->id))->pluck('id');
            if ($agentIds->contains($data['agent_id'])) {
                $data['assigned_agent_id'] = $data['agent_id'];
            }
        }
        unset($data['agent_id']);

        $lead = DB::transaction(function () use ($data, $superAgent, $request) {
            $lead = $this->leadService->createFromSuperAgent($data, $superAgent);

            // Upload documents
            foreach (['aadhaar_front', 'aadhaar_back', 'electricity_bill', 'photo', 'other', 'solar_roof_photo', 'bank_passbook'] as $docKey) {
                if ($request->hasFile($docKey)) {
                    $this->leadService->uploadDocument($lead, $request->file($docKey), $docKey, $superAgent->id);
                }
            }

            return $lead;
        });

        return response()->json([
            'success' => true,
            'message' => 'Lead submitted successfully!',
            'data' => $lead,
        ], 201);
    }

    /** Get a specific lead */
    public function show(Request $request, string $ulid): JsonResponse
    {
        $superAgent = $request->user();
        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->with([
            'assignedAgent', 'submittedByAgent', 'assignedSuperAgent',
            'documents' => function ($q) use ($superAgent) {
                $q->where('visible_to_downline', true)
                  ->orWhere('uploaded_by', $superAgent->id);
            },
            'statusLogs.changedBy', 'commissions',
            'verifications.performedBy',
        ])->firstOrFail();

        if (! $this->superAgentService->canAccessLead($superAgent, $lead)) {
            return response()->json(['success' => false, 'message' => 'You do not have access to this lead.'], 403);
        }

        return response()->json(['success' => true, 'data' => $lead]);
    }

    /** Verify a lead → sends to admin pool */
    public function verify(Request $request, string $ulid): JsonResponse
    {
        $request->validate(['notes' => 'nullable|string|max:500']);

        $superAgent = $request->user();
        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();

        try {
            $lead = $this->leadService->verifyLead($lead, $superAgent, $request->notes);
        } catch (LeadAccessDeniedException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 403);
        } catch (InvalidLeadOperationException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lead verified and sent to Admin for processing.',
            'data' => $lead,
        ]);
    }

    /** Revert a lead back to the agent */
    public function revert(Request $request, string $ulid): JsonResponse
    {
        $request->validate(['reason' => 'required|string|min:10|max:1000']);

        $superAgent = $request->user();
        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();

        try {
            $lead = $this->leadService->revertLead($lead, $superAgent, $request->reason);
        } catch (LeadAccessDeniedException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 403);
        } catch (InvalidLeadOperationException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        $isEscalated = $lead->verification_status === 'admin_override';

        return response()->json([
            'success' => true,
            'message' => $isEscalated
                ? 'Lead has been auto-escalated to Admin (max reverts reached).'
                : 'Lead returned to agent for correction.',
            'data' => $lead,
        ]);
    }

    /** Assign lead from SA pool to one of their team agents */
    public function assignToAgent(Request $request, string $ulid): JsonResponse
    {
        $request->validate(['agent_id' => 'required|exists:users,id']);

        $superAgent = $request->user();
        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();
        $agent = User::query()->where(fn ($q) => $q->where('role', 'agent'))->findOrFail($request->agent_id);

        try {
            $lead = $this->leadService->assignLeadToAgent($lead, $agent, $superAgent);
        } catch (LeadAccessDeniedException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lead assigned to agent successfully.',
            'data' => $lead->fresh(['assignedAgent']),
        ]);
    }



    /** Get verification history for a lead */
    public function verificationHistory(Request $request, string $ulid): JsonResponse
    {
        $superAgent = $request->user();
        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();

        if (! $this->superAgentService->canAccessLead($superAgent, $lead)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $history = $lead->verifications()->with('performedBy:id,name,role,agent_id,super_agent_code')->get();

        return response()->json(['success' => true, 'data' => $history]);
    }

    /** Update notes / follow-up date on a lead */
    public function updateNotes(UpdateSuperAgentLeadRequest $request, string $ulid): JsonResponse
    {
        $superAgent = $request->user();
        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();

        if (! $this->superAgentService->canAccessLead($superAgent, $lead)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $lead->update([
            'notes' => $request->notes ?? $lead->notes,
            'follow_up_date' => $request->follow_up_date ?? $lead->follow_up_date,
        ]);

        return response()->json(['success' => true, 'data' => $lead->fresh(), 'message' => 'Notes updated.']);
    }

    /** Upload a document to a lead */
    public function uploadDocument(Request $request, string $ulid): JsonResponse
    {
        $request->validate([
            'document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'type' => ['required', 'string'],
        ]);

        $superAgent = $request->user();
        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();

        if (! $this->superAgentService->canAccessLead($superAgent, $lead)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $doc = $this->leadService->uploadDocument($lead, $request->file('document'), $request->type, $superAgent->id);

        return response()->json(['success' => true, 'data' => $doc, 'message' => 'Document uploaded.'], 201);
    }

    /** Legacy assign endpoint → now delegates to assignToAgent */
    public function assign(Request $request, string $ulid): JsonResponse
    {
        return $this->assignToAgent($request, $ulid);
    }
}
