<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateLeadStatusRequest;
use App\Models\Lead;
use App\Models\LeadVerification;
use App\Models\User;
use App\Services\LeadService;
use App\Services\StatusTransitionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminLeadController extends Controller
{
    public function __construct(
        private LeadService $leadService,
        private StatusTransitionService $transitionService,
    ) {}

    public function index(Request $request)
    {
        $query = Lead::query()->with([
            'assignedSuperAgent:id,name,role', 
            'assignedAgent:id,name,role', 
            'submittedByAgent:id,name,role', 
            'createdBySuperAgent:id,name,role', 
            'assignedSurveyor:id,name,role', 
            'assignedInstaller:id,name,role',
            'documents', 'commissions', 'surveyRequirement'
        ]);

        $user = $request->user();

        // ── RECURSIVE TEAM ISOLATION & HIERARCHY APPROVAL GATE ──
        if (!$user->isSuperAdmin()) {
            $managedIds = $user->getManagedUserIds();
            $adminId = $user->isOperator() && $user->parent_id ? $user->parent_id : $user->id;
            $query->where(function ($q) use ($user, $managedIds, $adminId) {
                // The Admin should ONLY see leads from their hierarchy if the lead 
                // has been approved by the BDM/Super Agent and escalated to the admin_pool.
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
                // Allow direct assignments to this admin regardless of pool state
                ->orWhere('assigned_admin_id', $adminId)
                ->orWhere('wa_handler_admin_id', $adminId);
            });
        }

        // ── WA LEAD VISIBILITY GATE ──
        $checkUser = $user->isOperator() && $user->parent ? $user->parent : $user;
        if ($checkUser->is_wa_lead_handler) {
            $query->where(function ($q) use ($checkUser) {
                $q->where('source', '!=', 'whatsapp_chatbot')
                  ->orWhere('wa_handler_admin_id', $checkUser->id);
            });
        } else {
            $query->where('source', '!=', 'whatsapp_chatbot');
        }
        // ── END GATES ──

        if ($request->filled('status')) {
            $query->where(fn ($q) => $q->whereIn('status', explode(',', $request->status)));
        }

        if ($request->filled('verification_status')) {
            $query->where(fn ($q) => $q->where('verification_status', $request->verification_status));
        }

        if ($request->filled('owner_type')) {
            $query->where(fn ($q) => $q->where('owner_type', $request->owner_type));
        }

        if ($request->filled('source')) {
            if ($request->source === 'referral') {
                // Virtual source: public_form leads that came via a referral code
                $query->where(fn ($q) => $q->where('source', 'public_form')->whereNotNull('referral_agent_id'));
            } else {
                $query->where(fn ($q) => $q->where('source', $request->source));
            }
        }

        if ($request->filled('agent_id')) {
            $query->where(fn ($q) => $q->where('assigned_agent_id', $request->agent_id));
        }

        if ($request->filled('super_agent_id')) {
            $query->where(fn ($q) => $q->where('assigned_super_agent_id', $request->super_agent_id));
        }

        if ($request->filled('state')) {
            $query->where(fn ($q) => $q->where('beneficiary_state', $request->state));
        }

        if ($request->filled('search')) {
            $search = str_replace(['%', '_'], ['\%', '\_'], $request->search);
            $query->where(function ($q) use ($search) {
                $q->where(fn ($q2) => $q2->where('beneficiary_name', 'like', "%{$search}%"))
                    ->orWhere(fn ($q2) => $q2->where('beneficiary_mobile', 'like', "%{$search}%"))
                    ->orWhere(fn ($q2) => $q2->where('consumer_number', 'like', "%{$search}%"))
                    ->orWhere(fn ($q2) => $q2->where('ulid', 'like', "%{$search}%"));
            });
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $leads = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $leads,
        ]);
    }

    public function show($ulid)
    {
        $lead = Lead::query()->with([
            'assignedSuperAgent:id,name,role',
            'assignedAgent:id,name,role',
            'submittedByAgent:id,name,role',
            'submittedByEnumerator:id,name,role',
            'createdBySuperAgent:id,name,role',
            'verifiedBySuperAgent:id,name,role',
            'assignedSurveyor:id,name,role',
            'assignedInstaller:id,name,role',
            'statusLogs.changedBy:id,name,role',
            'verifications.performedBy:id,name,role',
            'documents', 'commissions', 'surveyRequirement',
            'installationSubmissions.installationDocuments',
        ])
            ->where(fn ($q) => $q->where('ulid', $ulid))
            ->firstOrFail();

        $this->authorize('view', $lead);

        return response()->json([
            'success' => true,
            'data'    => $lead,
        ]);
    }

    public function update(Request $request, $ulid)
    {
        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();

        $this->authorize('update', $lead);

        // Strict whitelist — prevents mass-assignment of pipeline-controlled fields
        // (status, verification_status, owner_type, ulid, etc.)
        $validated = $request->validate([
            'beneficiary_name'     => 'sometimes|string|max:255',
            'beneficiary_mobile'   => 'sometimes|string|max:15',
            'beneficiary_address'  => 'sometimes|string|max:1000',
            'beneficiary_state'    => 'sometimes|string|max:100',
            'beneficiary_district' => 'sometimes|string|max:100',
            'system_capacity'      => 'sometimes|string|max:50',
            'discom_name'          => 'sometimes|nullable|string|max:255',
            'admin_notes'          => 'sometimes|nullable|string|max:2000',
            
            // Billing fields
            'billing_items'          => 'sometimes|nullable|array',
            'billing_items.*.description' => 'required_with:billing_items|string|max:255',
            'billing_items.*.make'   => 'nullable|string|max:255',
            'billing_items.*.rate'   => 'required_with:billing_items|numeric|min:0',
            'quotation_serial'       => 'sometimes|nullable|string|max:100',
            'receipt_serial'         => 'sometimes|nullable|string|max:100',
            'billing_gst_percentage' => 'sometimes|numeric|min:0|max:100',
            'receipt_percentage'     => 'sometimes|numeric|min:0|max:100',
        ]);

        if ($request->has('billing_items')) {
            $items = $request->input('billing_items', []);
            $baseAmount = collect($items)->sum('rate');
            $gstPercentage = (float) $request->input('billing_gst_percentage', 5.0);
            $gstAmount = $baseAmount * ($gstPercentage / 100);
            $totalAmount = $baseAmount + $gstAmount;
            
            $receiptPercentage = (float) $request->input('receipt_percentage', 10.0);
            $receiptAmount = $totalAmount * ($receiptPercentage / 100);

            $validated['quotation_base_amount'] = $baseAmount;
            $validated['quotation_gst_amount'] = $gstAmount;
            $validated['quotation_total_amount'] = $totalAmount;
            $validated['receipt_amount'] = $receiptAmount;
            
            unset($validated['receipt_percentage']);
        }

        $lead->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Lead updated successfully',
            'data'    => $lead->fresh(),
        ]);
    }

    public function updateStatus(UpdateLeadStatusRequest $request, $ulid)
    {
        $lead = Lead::query()->with(['assignedAgent.superAgent', 'submittedByAgent.superAgent'])
            ->where(fn ($q) => $q->where('ulid', $ulid))
            ->firstOrFail();

        // B6/F6 — Role-level policy gate (admin always passes; operator passes; others 403)
        $this->authorize('updateStatus', $lead);

        $this->leadService->updateStatus(
            $lead,
            $request->status,
            $request->user()->id,
            $request->notes,
            $request->file('receipt'),
            $request->file('geotag')
        );

        if ($request->hasFile('feasibility_report')) {
            $this->leadService->uploadDocument($lead, $request->file('feasibility_report'), 'feasibility_report', $request->user()->id);
        }
        if ($request->hasFile('e_token')) {
            $this->leadService->uploadDocument($lead, $request->file('e_token'), 'e_token', $request->user()->id);
        }
        if ($request->hasFile('additional_document')) {
            $this->leadService->uploadDocument($lead, $request->file('additional_document'), 'additional_document', $request->user()->id);
        }

        if ($request->filled('registration_number')) {
            $lead->registration_number = $request->input('registration_number');
            $lead->save();
        }

        if ($request->status === 'INSTALLATION_SCHEDULED' && $request->filled('installation_scheduled_at')) {
            $lead->installation_scheduled_at = $request->input('installation_scheduled_at');
            $lead->save();
        }

        // If admin provided survey spec during REGISTERED transition, pre-fill the surveyor form
        if ($request->status === 'REGISTERED' && $request->filled('survey_system_capacity_kw')) {
            \App\Models\LeadSurveyRequirement::updateOrCreate(
                ['lead_id' => $lead->id],
                array_filter([
                    'technician_id'       => null,
                    'system_capacity_kw'  => $request->input('survey_system_capacity_kw'),
                    'panel_quantity'      => $request->input('survey_panel_quantity'),
                    'panel_model_make'    => $request->input('survey_panel_model_make'),
                    'inverter_model_make' => $request->input('survey_inverter_model_make'),
                    'wire_length_meters'  => $request->input('survey_wire_length_meters'),
                ], fn($v) => $v !== null && $v !== '')
            );
        }

        $commissionStatus = app(\App\Services\CommissionService::class)->getCommissionStatus($lead);

        return response()->json([
            'success' => true,
            'message' => 'Lead status updated successfully',
            'data'    => [
                'lead'              => clone $lead->fresh(['statusLogs']),
                'commission_prompts' => $commissionStatus,
                'commission_prompt' => $commissionStatus[0] ?? ['should_prompt' => false],
            ],
        ]);
    }

    /**
     * B6 — Return the list of statuses the calling user can set for this lead.
     * Frontend uses this to dynamically populate the status dropdown and
     * show/hide the geotag-required warning.
     */
    public function availableStatuses(Request $request, $ulid)
    {
        $lead = Lead::where('ulid', $ulid)->firstOrFail();

        return response()->json([
            'success'  => true,
            'data'     => [
                'statuses'        => $this->transitionService->getAllowedStatuses($request->user(), $lead),
                'requires_geotag' => StatusTransitionService::GEOTAG_REQUIRED_STATUSES,
            ],
        ]);
    }

    /** Assign lead to a Super Agent */
    /**
     * Assign Technical Team members to a lead.
     */
    public function assignTechnicians(Request $request, $ulid)
    {
        $request->validate([
            'surveyor_id' => 'nullable|exists:users,id',
            'installer_id' => 'nullable|exists:users,id',
        ]);

        $lead = Lead::where('ulid', $ulid)->firstOrFail();

        // Validations
        if ($request->has('surveyor_id') && $request->surveyor_id) {
            $surveyor = User::findOrFail($request->surveyor_id);
            if (!$surveyor->isFieldTechnician()) {
                return response()->json(['error' => 'Selected user is not a field technician'], 400);
            }
            $lead->assigned_surveyor_id = $request->surveyor_id;
        }

        if ($request->has('installer_id') && $request->installer_id) {
            $installer = User::findOrFail($request->installer_id);
            if (!$installer->isFieldTechnician()) {
                return response()->json(['error' => 'Selected user is not a field technician'], 400);
            }
            $lead->assigned_installer_id = $request->installer_id;
        }

        $lead->save();

        return response()->json([
            'success' => true,
            'message' => 'Technicians assigned successfully',
            'data' => $lead->load(['assignedSurveyor', 'assignedInstaller'])
        ]);
    }

    public function assignSuperAgent(Request $request, $ulid)
    {
        $request->validate(['super_agent_id' => 'required|exists:users,id']);

        /** @var \App\Models\Lead $lead */
        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();
        /** @var \App\Models\User $superAgent */
        $superAgent = User::query()->where(fn ($q) => $q->where('id', $request->super_agent_id))->where(fn ($q) => $q->where('role', 'super_agent'))->firstOrFail();

        $lead = $this->leadService->assignLeadToSuperAgent($lead, $superAgent, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Lead assigned to Super Agent successfully',
            'data' => $lead->fresh(['assignedSuperAgent']),
        ]);
    }

    /** Assign lead to a specific Agent (may skip SA) */
    public function assignAgent(Request $request, $ulid)
    {
        $request->validate(['agent_id' => 'required|exists:users,id']);

        /** @var \App\Models\Lead $lead */
        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();
        /** @var \App\Models\User $agent */
        $agent = User::query()->where(fn ($q) => $q->where('id', $request->agent_id))->where(fn ($q) => $q->where('role', 'agent'))->firstOrFail();

        $lead = $this->leadService->assignLeadToAgent($lead, $agent, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Lead assigned to Agent successfully',
            'data' => $lead->fresh(['assignedAgent', 'assignedSuperAgent']),
        ]);
    }

    /** Admin bypasses SA verification */
    public function overrideVerification(Request $request, $ulid)
    {
        $request->validate(['reason' => 'required|string|min:5']);

        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();

        $lead->update([
            'verification_status' => 'admin_override',
            'owner_type' => 'admin_pool',
            'revert_reason' => null,
        ]);

        // Audit log
        LeadVerification::create([
            'lead_id' => $lead->id,
            'action' => 'verified',
            'performed_by' => $request->user()->id,
            'performer_role' => 'admin',
            'reason' => $request->reason.' [ADMIN OVERRIDE]',
            'revert_count_at_time' => $lead->revert_count,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Verification overridden by Admin',
            'data' => $lead->fresh(),
        ]);
    }

    /** Legacy assign endpoint kept for backward compatibility — assigns to SA */
    public function assign(Request $request, $ulid)
    {
        return $this->assignSuperAgent($request, $ulid);
    }

    public function uploadDocument(Request $request, $ulid)
    {
        $request->validate([
            'document'            => 'required|file|max:5120|mimes:jpg,png,pdf',
            'type'                => 'required|in:aadhaar,aadhaar_front,aadhaar_back,electricity_bill,photo,solar_roof_photo,bank_passbook,receipt,feasibility_report,e_token,additional_document,other',
            // F5 — optional visibility flag; defaults to false (not shared with downlines)
            'visible_to_downline' => 'boolean',
        ]);

        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();

        $document = $this->leadService->uploadDocument(
            $lead,
            $request->file('document'),
            $request->type,
            $request->user()->id,
            (bool) $request->input('visible_to_downline', false),
            $request->user()->role,
        );

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded successfully',
            'data'    => $document,
        ], 201);
    }

    /** Delegate a support task to a technical team member */
    public function delegateTicket(Request $request, string $ulid): JsonResponse
    {
        $request->validate([
            'message' => 'required|string',
            'team_member_id' => 'required|exists:users,id'
        ]);

        $lead = Lead::where('ulid', $ulid)->firstOrFail();
        $teamMember = User::findOrFail($request->team_member_id);

        if (!$teamMember->isFieldTechnician()) {
            return response()->json(['success' => false, 'message' => 'Selected user is not a field technician.'], 400);
        }

        $log = $lead->statusLogs()->create([
            'from_status' => $lead->status,
            'to_status' => $lead->status,
            'notes' => "TEAM_ACTION_REQUIRED: [Technician: {$teamMember->name}] " . $request->message,
            'changed_by' => $request->user()->id,
        ]);

        // Notify the team member
        app(\App\Services\NotificationService::class)->notifyTeamDelegation($lead, $request->message, $teamMember);

        return response()->json([
            'success' => true,
            'message' => 'Support task delegated to team member successfully.',
            'data' => $log
        ]);
    }
}

