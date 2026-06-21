<?php

namespace App\Http\Controllers\Technical;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadTechnicalVisit;
use App\Models\User;
use App\Services\LeadService;
use App\Services\StatusTransitionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TechnicalDashboardController extends Controller
{
    public function __construct(
        private readonly LeadService $leadService,
        private readonly StatusTransitionService $transitionService,
    ) {}

    /**
     * Get leads assigned to the authenticated field technician.
     */
    public function getAssignedLeads(Request $request)
    {
        $user = $request->user();

        if (! $user->isFieldTechnician()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        $leads = Lead::query()
            ->visibleToTechnician($user->id)
            ->with([
                'assignedSurveyor:id,name,mobile',
                'assignedInstaller:id,name,mobile',
                'submittedByAgent:id,name,mobile',
                'submittedByEnumerator:id,name,mobile',
                'technicalVisits',
                'surveyRequirement',          // Surveyor material spec list
                'inventoryItems.inventoryItem', // Dispatched materials from admin
                'statusLogs', // Support query history
            ])
            ->orderByRaw('updated_at desc')
            ->get()
            ->map(function (Lead $lead) {
                // Build safe response — exclude admin-only billing/quotation data
                $sr = $lead->surveyRequirement;
                return [
                    'id'                      => $lead->id,
                    'ulid'                    => $lead->ulid,
                    'beneficiary_name'        => $lead->beneficiary_name,
                    'beneficiary_mobile'      => $lead->beneficiary_mobile,
                    'beneficiary_address'     => $lead->beneficiary_address,
                    'beneficiary_district'    => $lead->beneficiary_district,
                    'beneficiary_state'       => $lead->beneficiary_state,
                    'system_capacity'         => $lead->system_capacity,
                    'system_item'             => $lead->system_item,
                    'system_make'             => $lead->system_make,
                    'status'                  => $lead->status,
                    // IDs needed by frontend for CTA visibility logic
                    'assigned_surveyor_id'    => $lead->assigned_surveyor_id,
                    'assigned_installer_id'   => $lead->assigned_installer_id,
                    'surveyor_form_submitted_at' => $lead->surveyor_form_submitted_at,
                    'assigned_surveyor'       => $lead->assignedSurveyor ? ['name' => $lead->assignedSurveyor->name, 'mobile' => $lead->assignedSurveyor->mobile] : null,
                    'assigned_installer'      => $lead->assignedInstaller ? ['name' => $lead->assignedInstaller->name, 'mobile' => $lead->assignedInstaller->mobile] : null,
                    'technical_visits'        => $lead->technicalVisits,
                    'updated_at'              => $lead->updated_at?->toDateString(),
                    // ── Surveyor-created material specification list ──────────
                    'survey_requirement' => $sr ? [
                        'system_capacity_kw'          => $sr->system_capacity_kw,
                        'panel_quantity'              => $sr->panel_quantity,
                        'panel_model_make'            => $sr->panel_model_make,
                        'inverter_model_make'         => $sr->inverter_model_make,
                        'wire_length_meters'          => $sr->wire_length_meters,
                        'earthing_kit_required'       => $sr->earthing_kit_required,
                        'lightning_arrester_required' => $sr->lightning_arrester_required,
                        'inverter_rating'             => $sr->inverter_rating,
                        'remote_monitoring_configured'=> $sr->remote_monitoring_configured,
                        'dcdb_rating'                 => $sr->dcdb_rating,
                        'acdb_rating'                 => $sr->acdb_rating,
                        'dc_wire_type'                => $sr->dc_wire_type,
                        'dc_wire_size'                => $sr->dc_wire_size,
                        'ac_wire_type'                => $sr->ac_wire_type,
                        'ac_wire_size'                => $sr->ac_wire_size,
                        'earth_wire_type'             => $sr->earth_wire_type,
                        'earth_wire_size'             => $sr->earth_wire_size,
                        'additional_accessories'      => $sr->additional_accessories ?? [],
                        'site_notes'                  => $sr->site_notes,
                        'submitted_at'                => $sr->created_at?->format('d M Y'),
                    ] : null,
                    // ── Admin-dispatched physical inventory items ────────────
                    'dispatched_items' => $lead->inventoryItems->map(fn($item) => [
                        'name'          => $item->inventoryItem->name ?? 'Unknown',
                        'quantity'      => $item->quantity,
                        'serial_number' => $item->serial_number,
                        'dispatched_at' => $item->dispatched_at?->toDateString(),
                    ]),
                    'status_logs' => $lead->statusLogs,
                    // ── Lead Creator (agent/enumerator who submitted) ───────
                    'lead_creator' => $lead->submittedByAgent
                        ? ['name' => $lead->submittedByAgent->name, 'mobile' => $lead->submittedByAgent->mobile, 'role' => 'agent']
                        : ($lead->submittedByEnumerator
                            ? ['name' => $lead->submittedByEnumerator->name, 'mobile' => $lead->submittedByEnumerator->mobile, 'role' => 'enumerator']
                            : null),
                ];
            });

        return response()->json(['leads' => $leads]);
    }

    /**
     * Handle Site Survey or Installation Completion submission.
     *
     * B4 — Fixes:
     *  1. $oldStatus is captured BEFORE $lead->status is mutated so
     *     the status log records the correct from_status.
     *  2. Geotag evidence (photo path + GPS) is written to lead_status_logs
     *     alongside the visit record so the admin timeline can display it.
     *  3. Admin is notified via LeadService after a successful commit.
     */
    public function submitVisit(Request $request, string $ulid)
    {
        $user = $request->user();

        if (! $user->isFieldTechnician()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        $request->validate([
            'visit_type'      => 'required|in:site_survey,installation_complete',
            'latitude'        => 'required|numeric',
            'longitude'       => 'required|numeric',
            'selfie_image'    => 'required|image|max:10240', // up to 10 MB
            'agreed_to_terms' => 'required|accepted',
        ]);

        $lead = Lead::query()->where(['ulid' => $ulid])->firstOrFail();

        // ── Assignment guard ───────────────────────────────────────────
        if ($request->visit_type === 'site_survey' && $lead->assigned_surveyor_id !== $user->id) {
            return response()->json(['error' => 'You are not assigned as the surveyor for this lead.'], 403);
        }

        if ($request->visit_type === 'installation_complete' && $lead->assigned_installer_id !== $user->id) {
            return response()->json(['error' => 'You are not assigned as the installer for this lead.'], 403);
        }

        // Pipeline state guard — parallel track support:
        // Survey can be submitted if lead is in pre-disbursement states (banking may be running in parallel)
        if ($request->visit_type === 'site_survey' && ! in_array($lead->status, [
            'NEW', 'REGISTERED',
            // Banking track statuses (survey runs in parallel)
            'LEAD_DOCUMENTS_PRINTED', 'SIGNATURE_PENDING', 'SIGNATURE_DONE',
        ], true)) {
            return response()->json(['error' => 'Lead must be in a pre-disbursement state to perform a site survey.'], 400);
        }

        if ($request->visit_type === 'installation_complete' && ! in_array($lead->status, ['INSTALLATION_SCHEDULED', 'INSTALLATION_IN_PROGRESS', 'SOLAR_INSTALLED'])) {
            return response()->json(['error' => 'Lead must be in Installation stage to perform installation completion.'], 400);
        }

        // ── FIX B4: Capture old status BEFORE any mutation ────────────
        $oldStatus = $lead->status;
        $newStatus = $request->visit_type === 'site_survey' ? 'SURVEY_DONE' : 'SOLAR_INSTALLED';
        $visitLabel = str_replace('_', ' ', $request->visit_type);

        $path = null;

        try {
            DB::beginTransaction();

            // Store geotag selfie on the PRIVATE disk (not publicly accessible)
            $path = $request->file('selfie_image')->store('technical_visits', 'local');

            // Record visit row
            LeadTechnicalVisit::create([
                'lead_id'        => $lead->id,
                'technician_id'  => $user->id,
                'visit_type'     => $request->visit_type,
                'selfie_url'     => $path,
                'latitude'       => $request->latitude,
                'longitude'      => $request->longitude,
                'terms_agreed_at' => now(),
            ]);

            DB::commit();

            // Route status change through LeadService — enforces pipeline order,
            // writes the status log with correct from/to/geotag metadata, and fires
            // all downstream events (commissions, notifications).
            $this->leadService->updateStatus(
                $lead,
                $newStatus,
                $user->id,
                "Status updated via Geo-tagged Field Visit ({$visitLabel})"
            );

            // Notify additional parties
            $this->leadService->notifyAdminTechnicalStatusChanged($lead, $user, $oldStatus, $newStatus);




            return response()->json([
                'message' => 'Visit recorded and status updated successfully.',
                'lead'    => $lead->fresh(['assignedSurveyor', 'assignedInstaller', 'technicalVisits']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            if ($path) {
            Storage::disk('local')->delete($path);
            }

            return response()->json(['error' => 'Failed to process visit: ' . $e->getMessage()], 500);
        }
    }

    public function submitSurveyForm(Request $request, string $ulid)
    {
        $user = $request->user();

        if (! $user->isFieldTechnician()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        $request->validate([
            'system_capacity_kw' => 'required|numeric',
            'panel_quantity' => 'required|integer',
            'panel_model_make' => 'required|string|max:200',
            'inverter_model_make' => 'required|string|max:200',
            'wire_length_meters' => 'required|numeric',
            'earthing_kit_required' => 'boolean',
            'lightning_arrester_required' => 'boolean',
            'additional_accessories' => 'nullable',
            'site_notes' => 'nullable|string',
            'geo_photo' => 'required|image|max:10240',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'agreed_to_terms' => 'required|accepted',
        ]);

        $lead = Lead::query()->where(['ulid' => $ulid])->firstOrFail();

        // Assignment guard
        if ($lead->assigned_surveyor_id !== $user->id) {
            return response()->json(['error' => 'You are not assigned as the surveyor for this lead.'], 403);
        }

        // Parallel track support: surveyor can submit survey form if lead is in pre-disbursement state
        // (banking track may be running in parallel after REGISTERED)
        $allowed = ['NEW', 'REGISTERED', 'SURVEY_DONE',
                    'LEAD_DOCUMENTS_PRINTED', 'SIGNATURE_PENDING', 'SIGNATURE_DONE'];
        if (! in_array($lead->status, $allowed, true)) {
            return response()->json(['error' => "Lead status ({$lead->status}) is not valid for site survey submission."], 400);
        }

        $path = null;
        try {
            DB::beginTransaction();

            $path = $request->file('geo_photo')->store('survey_photos', 'public');

            $accessories = $request->additional_accessories;
            if (is_string($accessories) && !empty($accessories)) {
                $accessories = json_decode($accessories, true);
            }

            \App\Models\LeadSurveyRequirement::updateOrCreate(
                ['lead_id' => $lead->id],
                [
                    'technician_id' => $user->id,
                    'system_capacity_kw' => $request->system_capacity_kw,
                    'panel_quantity' => $request->panel_quantity,
                    'panel_model_make' => $request->panel_model_make,
                    'inverter_model_make' => $request->inverter_model_make,
                    'wire_length_meters' => $request->wire_length_meters,
                    'earthing_kit_required' => $request->boolean('earthing_kit_required'),
                    'lightning_arrester_required' => $request->boolean('lightning_arrester_required'),
                    'additional_accessories' => is_array($accessories) ? $accessories : null,
                    'site_notes' => $request->site_notes,
                    'geo_photo_path' => $path,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'signed_off' => true,
                ]
            );

            $lead->surveyor_form_submitted_at = now();
            $lead->save();

            // Only transition IF it is a forward move to SURVEY_DONE
            $pipeline = app(\App\Services\PipelineService::class);
            $currentPos = $pipeline->positionOf($lead->status) ?? 0;
            $surveyDonePos = $pipeline->positionOf('SURVEY_DONE');

            if ($currentPos < $surveyDonePos) {
                // IMPORTANT: SURVEY_DONE requires a geotag artifact in LeadService
                $this->leadService->updateStatus(
                    $lead, 
                    'SURVEY_DONE', 
                    $user->id, 
                    'Pre-installation survey completed.', 
                    null, 
                    $request->file('geo_photo')
                );
            }

            DB::commit();

            return response()->json([
                'message' => 'Survey form submitted successfully.',
                'lead' => $lead->fresh(['assignedSurveyor', 'assignedInstaller']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Survey Submission Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'lead_ulid' => $ulid,
                'user_id' => $user->id
            ]);
            if ($path) Storage::disk('public')->delete($path);
            return response()->json(['error' => 'Failed to submit survey: ' . $e->getMessage()], 500);
        }
    }


    /**
     * Get dashboard statistics for the technician.
     */
    public function getStats(Request $request)
    {
        $user = $request->user();

        if (! $user->isFieldTechnician()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        $baseQuery = Lead::query()->visibleToTechnician($user->id);

        $stats = [
            'total_assigned'          => (clone $baseQuery)->count(),
            'pending_surveys'         => (clone $baseQuery)->whereIn('status', ['NEW', 'REGISTERED', 'ON_HOLD'])->count(),
            'completed_surveys'       => (clone $baseQuery)->whereIn('status', ['SURVEY_DONE', 'SOLAR_INSTALLED', 'LEAD_COMPLETED'])->count(),
            'pending_installations'   => (clone $baseQuery)->whereIn('status', ['MATERIAL_VERIFIED_BY_CONSUMER', 'INSTALLATION_SCHEDULED', 'INSTALLATION_IN_PROGRESS'])->count(),
            'completed_installations' => (clone $baseQuery)->whereIn('status', ['SOLAR_INSTALLED', 'LEAD_COMPLETED'])->count(),
            'unpaid_commission'       => (float) \App\Models\Commission::query()->where(['payee_id' => $user->id])->unpaid()->sum('amount'),
            'paid_commission'         => (float) \App\Models\Commission::query()->where(['payee_id' => $user->id])->paid()->sum('amount'),
        ];

        $recentActivity = LeadTechnicalVisit::query()->where(['technician_id' => $user->id])
            ->with([
                'lead:id,ulid,beneficiary_name,beneficiary_mobile,beneficiary_address,beneficiary_district,beneficiary_state,submitted_by_agent_id,submitted_by_enumerator_id',
                'lead.submittedByAgent:id,name,mobile',
                'lead.submittedByEnumerator:id,name,mobile'
            ])
            ->orderByRaw('created_at desc')
            ->limit(5)
            ->get()
            ->map(function ($visit) {
                $lead = $visit->lead;
                if ($lead) {
                    $creator = $lead->submittedByAgent
                        ? ['name' => $lead->submittedByAgent->name, 'mobile' => $lead->submittedByAgent->mobile, 'role' => 'agent']
                        : ($lead->submittedByEnumerator
                            ? ['name' => $lead->submittedByEnumerator->name, 'mobile' => $lead->submittedByEnumerator->mobile, 'role' => 'enumerator']
                            : null);
                    $lead->setAttribute('lead_creator', $creator);
                }
                return $visit;
            });

        return response()->json([
            'success' => true,
            'data'    => [
                'stats'           => $stats,
                'recent_activity' => $recentActivity,
            ],
        ]);
    }

    /**
     * Get commissions for the technician.
     */
    public function getCommissions(Request $request)
    {
        $user = $request->user();

        if (! $user->isFieldTechnician()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        $commissions = \App\Models\Commission::query()->where(['payee_id' => $user->id])
            ->with(['lead', 'enteredBy', 'paidBy'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $commissions->items(),
            'meta' => [
                'current_page' => $commissions->currentPage(),
                'last_page' => $commissions->lastPage(),
                'total' => $commissions->total(),
            ],
            'summary' => [
                'unpaid_total' => (float) \App\Models\Commission::query()->where(['payee_id' => $user->id])->unpaid()->sum('amount'),
                'paid_total'   => (float) \App\Models\Commission::query()->where(['payee_id' => $user->id])->paid()->sum('amount'),
            ]
        ]);
    }

    /** Complete a delegated support task (Technician action) */
    public function completeSupportTask(Request $request, string $ulid)
    {
        $user = $request->user();
        if (!$user->isFieldTechnician()) return response()->json(['error' => 'Unauthorized'], 403);

        $request->validate(['message' => 'required|string']);

        $lead = Lead::query()->where(['ulid' => $ulid])->firstOrFail();

        $log = $lead->statusLogs()->create([
            'from_status' => $lead->status,
            'to_status' => $lead->status,
            'notes' => "TEAM_TASK_COMPLETED: " . $request->message,
            'changed_by' => $user->id,
            'changed_by_role' => $user->role,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Support task marked as completed.',
            'data' => $log
        ]);
    }

    /** Confirm receipt of materials (Technician/Installer action) */
    public function confirmMaterialReceipt(Request $request, string $ulid)
    {
        $user = $request->user();
        if (! $user->isFieldTechnician()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        $request->validate([
            'condition'                 => 'required|string|in:good,damaged,missing_items',
            'missing_or_damaged_notes'  => 'nullable|string',
            'geo_photo_1'               => 'required|image|max:10240',
            'geo_photo_2'               => 'required|image|max:10240',
            'latitude'                  => 'required|numeric',
            'longitude'                 => 'required|numeric',
            'agreed_to_terms'           => 'required|accepted',
        ]);

        $lead = Lead::query()->where(['ulid' => $ulid])->firstOrFail();

        // Check if assigned
        if ($lead->assigned_installer_id !== $user->id && $lead->assigned_surveyor_id !== $user->id) {
            return response()->json(['error' => 'You are not assigned to this lead.'], 403);
        }

        $path1 = null;
        $path2 = null;

        try {
            DB::beginTransaction();

            $path1 = $request->file('geo_photo_1')->store('installer_receipts', 'public');
            $path2 = $request->file('geo_photo_2')->store('installer_receipts', 'public');

            \App\Models\InstallerMaterialReceipt::create([
                'lead_id'          => $lead->id,
                'installer_id'     => $user->id,
                'condition'        => $request->condition,
                'notes'            => $request->missing_or_damaged_notes,
                'geo_photo_1_path' => $path1,
                'geo_photo_2_path' => $path2,
                'latitude'         => $request->latitude,
                'longitude'        => $request->longitude,
                'items_received'   => null,
            ]);

            // Transition status to DELIVERED if it's currently pre-delivery
            $pipeline = app(\App\Services\PipelineService::class);
            $currentPos = $pipeline->positionOf($lead->status) ?? 0;
            $deliveredPos = $pipeline->positionOf('DELIVERED') ?? 0;

            if ($currentPos < $deliveredPos) {
                $this->leadService->updateStatus(
                    $lead,
                    'DELIVERED',
                    $user->id,
                    'Material delivery confirmed by installer at site.'
                );
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Material receipt confirmed successfully.',
                'lead'    => $lead->fresh(['assignedSurveyor', 'assignedInstaller']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            if ($path1) Storage::disk('public')->delete($path1);
            if ($path2) Storage::disk('public')->delete($path2);

            return response()->json(['error' => 'Failed to confirm receipt: ' . $e->getMessage()], 500);
        }
    }
}
