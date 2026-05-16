<?php

namespace App\Http\Controllers\Consumer;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Enums\LeadStatus;

class ConsumerController extends Controller
{
    /**
     * Authenticate a consumer by mobile number + password.
     * Returns a Sanctum token valid for the consumer portal.
     */
    public function login(Request $request)
    {
        $request->validate([
            'mobile'   => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('mobile', $request->mobile)
            ->where('role', 'consumer')
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid mobile number or password. Please contact your project team.',
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your account is not active. Please contact support.',
            ], 403);
        }

        // Revoke old tokens and issue a fresh one
        $user->tokens()->where('name', 'consumer-portal')->delete();
        $token = $user->createToken('consumer-portal')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'user'  => [
                    'id'     => $user->id,
                    'name'   => $user->name,
                    'mobile' => $user->mobile,
                    'email'  => $user->email,
                    'role'   => $user->role,
                ],
            ],
        ]);
    }

    /**
     * Return the consumer's lead detail with full pipeline status and documents.
     */
    public function dashboard(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->lead_id) {
            return response()->json(['success' => false, 'message' => 'No lead linked to this account.'], 404);
        }

        $lead = Lead::where('id', $user->lead_id)
            ->with([
                'statusLogs:id,lead_id,from_status,to_status,notes,created_at',
                'assignedAgent:id,name,mobile',
                'assignedInstaller:id,name,mobile',
                'assignedSurveyor:id,name,mobile',
                'inventoryItems.inventoryItem',
                'surveyRequirement',
            ])
            ->first();

        if (! $lead) {
            return response()->json(['success' => false, 'message' => 'Lead not found.'], 404);
        }

        // Build a structured pipeline progress array
        $pipeline = $this->buildPipeline($lead->status);

        // Load dispatch details if dispatch_id is set
        $dispatch = null;
        if ($lead->dispatch_id) {
            $dispatch = \Illuminate\Support\Facades\DB::table('dispatches')
                ->where('id', $lead->dispatch_id)
                ->first();
        }

        // Build survey requirement shape for frontend
        $survey = null;
        if ($lead->surveyRequirement) {
            $sr = $lead->surveyRequirement;
            $survey = [
                'system_capacity_kw'          => $sr->system_capacity_kw,
                'panel_quantity'              => $sr->panel_quantity,
                'panel_model_make'            => $sr->panel_model_make,
                'inverter_model_make'         => $sr->inverter_model_make,
                'wire_length_meters'          => $sr->wire_length_meters,
                'earthing_kit_required'       => $sr->earthing_kit_required,
                'lightning_arrester_required' => $sr->lightning_arrester_required,
                'additional_accessories'      => $sr->additional_accessories ?? [],
                'site_notes'                  => $sr->site_notes,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'lead' => [
                    'ulid'                    => $lead->ulid,
                    'beneficiary_name'        => $lead->beneficiary_name,
                    'beneficiary_mobile'      => $lead->beneficiary_mobile,
                    'beneficiary_address'     => $lead->beneficiary_address,
                    'beneficiary_district'    => $lead->beneficiary_district,
                    'beneficiary_state'       => $lead->beneficiary_state,
                    'system_capacity'         => $lead->system_capacity,
                    'status'                  => $lead->status,
                    'govt_application_number' => $lead->govt_application_number,
                    'disbursement_reference'  => $lead->disbursement_reference ?? null,
                    'assigned_agent'          => $lead->assignedAgent ? ['name' => $lead->assignedAgent->name, 'mobile' => $lead->assignedAgent->mobile] : null,
                    'assigned_installer'      => $lead->assignedInstaller ? ['name' => $lead->assignedInstaller->name, 'mobile' => $lead->assignedInstaller->mobile] : null,
                    'assigned_surveyor'       => $lead->assignedSurveyor ? ['name' => $lead->assignedSurveyor->name, 'mobile' => $lead->assignedSurveyor->mobile] : null,
                    'created_at'              => $lead->created_at?->toDateString(),
                    'updated_at'              => $lead->updated_at?->toDateString(),
                    'installation_scheduled_at' => $lead->installation_scheduled_at?->toIso8601String(),
                    // Note: receipt_serial, receipt_amount, billing_items are admin-internal only
                    'survey_requirement'      => $survey,
                ],
                'dispatch' => $dispatch ? [
                    'vehicle_number' => $dispatch->vehicle_number,
                    'driver_name'    => $dispatch->driver_name,
                    'driver_mobile'  => $dispatch->driver_mobile,
                    'receipt_number' => $dispatch->receipt_number,
                    'dispatched_at'  => \Carbon\Carbon::parse($dispatch->dispatched_at)->format('d M Y'),
                ] : null,
                'inventory' => $lead->inventoryItems->map(fn($item) => [
                    'id'            => $item->id,
                    'name'          => $item->inventoryItem->name ?? 'Unknown Item',
                    'quantity'      => $item->quantity,
                    'serial_number' => $item->serial_number,
                    'dispatched_at' => $item->dispatched_at?->toDateString(),
                ]),
                'pipeline'    => $pipeline,
                'status_logs' => $lead->statusLogs->sortByDesc('created_at')->take(8)->map(function($l) {
                    $fromEnum = LeadStatus::tryFrom($l->from_status);
                    $toEnum   = LeadStatus::tryFrom($l->to_status);

                    return [
                        'from'  => $fromEnum ? $fromEnum->label() : $l->from_status,
                        'to'    => $toEnum ? $toEnum->label() : $l->to_status,
                        'notes' => $l->notes,
                        'date'  => $l->created_at?->format('d M Y'),
                        'time'  => $l->created_at?->format('h:i A'),
                    ];
                })->values(),
            ],
        ]);
    }

    /**
     * Build a linear pipeline array with completed/current/pending state for each milestone.
     */
    private function buildPipeline(?string $currentStatus): array
    {
        // 1. Establish the sequential integer order of all valid pipeline statuses.
        // Terminal/Failure statuses map back to their last valid stage.
        $statusOrder = [
            'NEW'                          => 1,
            'ON_HOLD'                      => 1,
            'INVALID'                      => 1,
            'DUPLICATE'                    => 1,
            'REJECTED'                     => 1,
            'REGISTERED'                   => 2,
            'SURVEY_ASSIGNED'              => 3,
            'SURVEY_DONE'                  => 4,
            'LEAD_DOCUMENTS_PRINTED'       => 5,
            'FILE_SUBMITTED_TO_BANK'       => 6,
            'SIGNATURE_PENDING'            => 7,
            'SIGNATURE_DONE'               => 8,
            'FILE_PENDING_DISBURSAL'       => 9,
            'FILE_REJECTED'                => 9,
            'FILE_DISBURSED'               => 10,
            'DISBURSEMENT_VERIFIED'        => 11,
            'DISPATCH_INITIATED'           => 12,
            'IN_TRANSIT'                   => 13,
            'DELIVERED'                    => 14,
            'MATERIAL_VERIFIED_BY_CONSUMER'    => 15,
            'INSTALLATION_SCHEDULED'       => 16,
            'INSTALLATION_IN_PROGRESS'     => 17,
            'SOLAR_INSTALLED'              => 18,
            'POD_INSPECTION_INITIATED'     => 19,
            'POD_REJECTED'                 => 19,
            'POD_SUCCESSFUL'               => 20,
            'PROJECT_COMMISSIONING'        => 21,
            'SUBSIDY_REQUEST'              => 22,
            'SUBSIDY_APPLIED'              => 23,
            'SUBSIDY_DISBURSED'            => 24,
            'LEAD_COMPLETED'               => 25,
        ];

        // 2. Get the current lead's numeric status position. Default to 1 if unknown.
        $currentIndex = $statusOrder[$currentStatus] ?? 1;

        // 3. Define the consumer-facing milestones.
        // Labels EXACTLY match the admin's LEAD_STATUS_CONFIG labels for consistency.
        // 'active_at' = status index when milestone becomes IN PROGRESS.
        // 'completed_at' = status index when milestone is considered DONE.
        $milestones = [
            ['key' => 'APPLICATION',       'label' => LeadStatus::NEW->label(),                    'icon' => 'file',          'desc' => 'Application received — our team will contact you.', 'active_at' => 1,  'completed_at' => 2],
            ['key' => 'REGISTRATION',      'label' => LeadStatus::REGISTERED->label(),             'icon' => 'clipboard-check','desc' => 'Registered on the MNRE PM-Surya Ghar portal.',      'active_at' => 2,  'completed_at' => 3],
            ['key' => 'SURVEY',            'label' => LeadStatus::SURVEY_DONE->label(),            'icon' => 'map-pin',       'desc' => 'Site survey completed by our technical team.',        'active_at' => 3,  'completed_at' => 5],
            ['key' => 'BANKING',           'label' => LeadStatus::FILE_SUBMITTED_TO_BANK->label(), 'icon' => 'landmark',      'desc' => 'File submitted to bank for loan/financing approval.', 'active_at' => 5,  'completed_at' => 11],
            ['key' => 'DISBURSEMENT',      'label' => LeadStatus::DISBURSEMENT_VERIFIED->label(),  'icon' => 'banknote',      'desc' => 'Loan disbursed and verified by our admin team.',       'active_at' => 11, 'completed_at' => 12],
            ['key' => 'DISPATCH',          'label' => LeadStatus::DISPATCH_INITIATED->label(),     'icon' => 'truck',         'desc' => 'Solar system components dispatched from warehouse.',  'active_at' => 12, 'completed_at' => 14],
            ['key' => 'DELIVERED',         'label' => LeadStatus::DELIVERED->label(),              'icon' => 'package',       'desc' => 'Materials delivered to your address.',                'active_at' => 14, 'completed_at' => 15],
            ['key' => 'MATERIAL_VERIFIED', 'label' => 'Material Verified at Site',                'icon' => 'shield-check',  'desc' => 'Consumer verified all materials at the installation site.','active_at' => 15, 'completed_at' => 16],
            ['key' => 'INSTALLATION_SCHED', 'label' => 'Installation Scheduled',                  'icon' => 'calendar',      'desc' => 'Installation date has been confirmed and scheduled.',  'active_at' => 16, 'completed_at' => 17],
            ['key' => 'INSTALLATION',      'label' => LeadStatus::SOLAR_INSTALLED->label(),        'icon' => 'wrench',        'desc' => 'Solar panels, inverter and wiring fully installed.',   'active_at' => 17, 'completed_at' => 20],
            ['key' => 'POD',               'label' => LeadStatus::POD_SUCCESSFUL->label(),         'icon' => 'scan-line',     'desc' => 'Proof of Delivery inspection passed successfully.',    'active_at' => 20, 'completed_at' => 21],
            ['key' => 'SUBSIDY',           'label' => LeadStatus::SUBSIDY_APPLIED->label(),        'icon' => 'star',          'desc' => 'MNRE subsidy applied and awaiting disbursement.',      'active_at' => 21, 'completed_at' => 25],
            ['key' => 'COMPLETED',         'label' => LeadStatus::LEAD_COMPLETED->label(),         'icon' => 'check-circle',  'desc' => 'Project fully completed. Enjoy free solar energy!',   'active_at' => 25, 'completed_at' => 26],
        ];

        // 4. Map the state dynamically based on the current index
        return array_map(function ($m) use ($currentIndex) {
            $state = 'pending';
            if ($currentIndex >= $m['completed_at']) {
                $state = 'done';
            } elseif ($currentIndex >= $m['active_at']) {
                $state = 'current';
            }
            return [
                'key'   => $m['key'],
                'label' => $m['label'],
                'icon'  => $m['icon'],
                'desc'  => $m['desc'],
                'state' => $state,
            ];
        }, $milestones);
    }

    /**
     * Change the consumer's password on first login.
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Current password is incorrect.'], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Clear the one-time password from the lead
        if ($user->lead_id) {
            Lead::where('id', $user->lead_id)->update(['consumer_portal_password' => null]);
        }

        return response()->json(['success' => true, 'message' => 'Password changed successfully.']);
    }

    /**
     * Update the consumer's profile information.
     */
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'mobile' => 'required|string|max:15',
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();
        
        $user->name = $request->name;
        $user->email = $request->email;
        $user->mobile = $request->mobile;
        $user->save();

        if ($user->lead_id) {
            Lead::where('id', $user->lead_id)->update([
                'beneficiary_name' => $request->name,
                'beneficiary_mobile' => $request->mobile,
                'beneficiary_email' => $request->email,
            ]);
        }

        return response()->json([
            'success' => true, 
            'message' => 'Profile updated successfully.',
            'user' => $user
        ]);
    }

    /**
     * Acknowledge receipt of material (Transitions status to POD_SUCCESSFUL).
     */
    public function acknowledgeMaterial(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->lead_id) {
            return response()->json(['success' => false, 'message' => 'No lead linked to this account.'], 404);
        }

        $lead = Lead::findOrFail($user->lead_id);
        
        if (! in_array($lead->status, ['DISPATCH_INITIATED', 'IN_TRANSIT', 'DELIVERED'])) {
            return response()->json(['success' => false, 'message' => 'Material is not currently dispatched or in transit.'], 422);
        }

        $oldStatus = $lead->status;
        
        // Use LeadService to ensure all side effects (logs, notifications) are handled
        app(\App\Services\LeadService::class)->updateStatus(
            $lead, 
            'DELIVERED', 
            $user->id, 
            'Material delivery acknowledged by consumer via Portal.'
        );

        return response()->json([
            'success' => true,
            'message' => 'Material receipt acknowledged successfully.',
            'new_status' => 'DELIVERED'
        ]);
    }

    /**
     * Verify materials brought by the installer at the site (Step 17d).
     * Transitions status to MATERIAL_VERIFIED_BY_CONSUMER.
     */
    public function verifyInstallerMaterialAtSite(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->lead_id) {
            return response()->json(['success' => false, 'message' => 'No lead linked to this account.'], 404);
        }

        $request->validate([
            'items_verified' => 'required|json',
            'geo_photo'      => 'required|image|max:10240',
            'latitude'       => 'required|numeric',
            'longitude'      => 'required|numeric',
        ]);

        $lead = Lead::findOrFail($user->lead_id);
        
        if ($lead->status !== 'DELIVERED') {
            return response()->json(['success' => false, 'message' => 'Lead is not waiting for site material verification.'], 422);
        }

        $path = null;
        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            $path = $request->file('geo_photo')->store('consumer_verifications', 'public');

            \App\Models\ConsumerMaterialVerification::create([
                'lead_id'        => $lead->id,
                'consumer_id'    => $user->id,
                'items_verified' => json_decode($request->items_verified, true),
                'geo_photo_path' => $path,
                'latitude'       => $request->latitude,
                'longitude'      => $request->longitude,
            ]);

            app(\App\Services\LeadService::class)->updateStatus(
                $lead, 
                'MATERIAL_VERIFIED_BY_CONSUMER', 
                $user->id, 
                'Consumer verified installer materials at the site.'
            );

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Materials verified at site successfully.',
                'new_status' => 'MATERIAL_VERIFIED_BY_CONSUMER'
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            if ($path) \Illuminate\Support\Facades\Storage::disk('public')->delete($path);
            return response()->json(['success' => false, 'message' => 'Failed to verify materials: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Submit a support ticket/query.
     */
    public function supportTicket(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->lead_id) {
            return response()->json(['success' => false, 'message' => 'No lead linked to this account.'], 404);
        }

        $lead = Lead::findOrFail($user->lead_id);
        
        // Log as a note on the lead for admin/operator to see
        $lead->statusLogs()->create([
            'from_status' => $lead->status,
            'to_status' => $lead->status,
            'notes' => "SUPPORT TICKET: [{$request->subject}] {$request->message}",
            'changed_by' => $user->id,
        ]);

        // Notify Admins & Super Admins
        app(\App\Services\NotificationService::class)->notifyAdminSupportTicket(
            $lead, 
            $request->subject, 
            $request->message
        );

        return response()->json(['success' => true, 'message' => 'Support ticket submitted successfully. Our team will contact you soon.']);
    }

    /**
     * Get the team assigned to this lead.
     */
    public function getTeam(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->lead_id) {
            return response()->json(['success' => false, 'message' => 'No lead linked to this account.'], 404);
        }

        $lead = Lead::with([
            'assignedAgent:id,name,role',
            'submittedByEnumerator:id,name,role',
            'assignedInstaller:id,name,role',
            'assignedSurveyor:id,name,role',
        ])->findOrFail($user->lead_id);

        $team = [];

        if ($lead->assignedAgent) {
            $team[] = ['id' => $lead->assignedAgent->id, 'role' => 'agent', 'name' => $lead->assignedAgent->name, 'title' => 'Sales Executive'];
        } elseif ($lead->submittedByEnumerator) {
            $team[] = ['id' => $lead->submittedByEnumerator->id, 'role' => 'enumerator', 'name' => $lead->submittedByEnumerator->name, 'title' => 'Field Executive'];
        }

        if ($lead->assignedSurveyor) {
            $team[] = ['id' => $lead->assignedSurveyor->id, 'role' => 'surveyor', 'name' => $lead->assignedSurveyor->name, 'title' => 'Site Engineer'];
        }

        if ($lead->assignedInstaller) {
            $team[] = ['id' => $lead->assignedInstaller->id, 'role' => 'installer', 'name' => $lead->assignedInstaller->name, 'title' => 'Installation Technician'];
        }

        // We can add a generic driver role if needed
        $team[] = ['id' => 'driver_generic', 'role' => 'driver', 'name' => 'Delivery Partner', 'title' => 'Material Delivery'];

        // Fetch existing ratings
        $ratings = \App\Models\ConsumerRating::where('lead_id', $lead->id)
            ->where('consumer_id', $user->id)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'team' => $team,
                'ratings' => $ratings
            ]
        ]);
    }

    /**
     * Submit team ratings.
     */
    public function rateTeam(Request $request)
    {
        $request->validate([
            'ratings' => 'required|array',
            'ratings.*.role' => 'required|string',
            'ratings.*.user_id' => 'required',
            'ratings.*.rating' => 'required|integer|min:1|max:5',
            'ratings.*.comments' => 'nullable|string',
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->lead_id) {
            return response()->json(['success' => false, 'message' => 'No lead linked to this account.'], 404);
        }

        foreach ($request->ratings as $r) {
            \App\Models\ConsumerRating::updateOrCreate(
                [
                    'lead_id' => $user->lead_id,
                    'consumer_id' => $user->id,
                    'role_rated' => $r['role']
                ],
                [
                    'rated_user_id' => $r['user_id'] === 'driver_generic' ? null : $r['user_id'],
                    'rating' => $r['rating'],
                    'comments' => $r['comments'] ?? null,
                ]
            );
        }

        return response()->json(['success' => true, 'message' => 'Thank you for your feedback!']);
    }

    /**
     * Get the consumer's support ticket history with detailed event timeline.
     */
    public function myTickets(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->lead_id) {
            return response()->json(['success' => false, 'message' => 'No lead linked to this account.'], 404);
        }

        $lead = Lead::findOrFail($user->lead_id);

        // Fetch all relevant support logs ordered chronologically
        $allLogs = $lead->statusLogs()
            ->where(function ($q) {
                $q->where('notes', 'like', 'SUPPORT TICKET:%')
                  ->orWhere('notes', 'like', '%ADMIN_ACTION_REQUIRED%')
                  ->orWhere('notes', 'like', '%SUPPORT_RESOLVED%')
                  ->orWhere('notes', 'like', '%TEAM_ACTION_REQUIRED%')
                  ->orWhere('notes', 'like', '%TEAM_TASK_COMPLETED%');
            })
            ->orderBy('created_at', 'asc')
            ->get();

        // Only the consumer-submitted ticket logs
        $ticketLogs = $allLogs->filter(fn($l) => str_starts_with($l->notes ?? '', 'SUPPORT TICKET:'));

        $tickets = $ticketLogs->map(function ($log) use ($allLogs) {
            // All logs after this ticket submission
            $after = $allLogs->filter(fn($l) => $l->created_at > $log->created_at);

            $isResolved  = $after->contains(fn($l) => str_contains($l->notes ?? '', 'SUPPORT_RESOLVED'));
            $isEscalated = $after->contains(fn($l) => str_contains($l->notes ?? '', 'ADMIN_ACTION_REQUIRED'));

            preg_match('/^SUPPORT TICKET: \[([^\]]+)\]\s*(.*)$/s', $log->notes ?? '', $match);

            // ── Step 1: Submission ──
            $timeline = [[
                'event'       => 'submitted',
                'label'       => 'Request Submitted',
                'description' => 'You submitted this support request.',
                'date'        => $log->created_at?->format('d M Y, h:i A'),
                'done'        => true,
            ]];

            // ── Step 2: Super Admin escalates to Admin ──
            $escalationLog  = $after->first(fn($l) => str_contains($l->notes ?? '', 'ADMIN_ACTION_REQUIRED'));
            $escalationDone = (bool) $escalationLog;
            $escalationNote = '';
            if ($escalationLog) {
                $escalationNote = trim(preg_replace('/^ADMIN_ACTION_REQUIRED:\s*/i', '', $escalationLog->notes ?? ''));
            }
            $timeline[] = [
                'event'       => 'escalated',
                'label'       => 'Escalated to Admin Team',
                'description' => $escalationDone
                    ? ($escalationNote ?: 'Our operations team reviewed and escalated your complaint to the Admin for action.')
                    : 'Awaiting review by our operations team.',
                'date'        => $escalationLog?->created_at?->format('d M Y, h:i A'),
                'done'        => $escalationDone,
            ];

            // ── Step 3: Admin delegates to Field Technician ──
            $delegationLog  = $after->first(fn($l) => str_contains($l->notes ?? '', 'TEAM_ACTION_REQUIRED'));
            $delegationDone = (bool) $delegationLog;
            $techName       = null;
            if ($delegationLog) {
                preg_match('/\[Technician:\s*([^\]]+)\]/', $delegationLog->notes ?? '', $techMatch);
                $techName = $techMatch[1] ?? 'a field technician';
            }
            $timeline[] = [
                'event'       => 'delegated',
                'label'       => 'Technician Assigned',
                'description' => $delegationDone
                    ? "Admin assigned your issue to {$techName} for on-site support."
                    : 'Admin will assign a field technician to handle this.',
                'date'        => $delegationLog?->created_at?->format('d M Y, h:i A'),
                'done'        => $delegationDone,
                'technician'  => $techName,
            ];

            // ── Step 4: Technician completes work ──
            $reportLog  = $after->first(fn($l) => str_contains($l->notes ?? '', 'TEAM_TASK_COMPLETED'));
            $reportDone = (bool) $reportLog;
            $reportNote = '';
            if ($reportLog) {
                $reportNote = trim(preg_replace('/^TEAM_TASK_COMPLETED:\s*/i', '', $reportLog->notes ?? ''));
            }
            $timeline[] = [
                'event'       => 'work_report',
                'label'       => 'Technician Work Done',
                'description' => $reportDone
                    ? ($reportNote ?: 'The technician has completed the on-site work and submitted their report.')
                    : 'Awaiting technician to complete the work and file a report.',
                'date'        => $reportLog?->created_at?->format('d M Y, h:i A'),
                'done'        => $reportDone,
            ];

            // ── Step 5: Resolution ──
            $resolutionLog  = $after->first(fn($l) => str_contains($l->notes ?? '', 'SUPPORT_RESOLVED'));
            $resolutionDone = (bool) $resolutionLog;
            $resolutionNote = '';
            if ($resolutionLog) {
                $resolutionNote = trim(preg_replace('/^SUPPORT_RESOLVED:\s*/i', '', $resolutionLog->notes ?? ''));
            }
            $timeline[] = [
                'event'       => 'resolved',
                'label'       => 'Issue Resolved',
                'description' => $resolutionDone
                    ? ($resolutionNote ?: 'Your issue has been fully resolved by the team.')
                    : 'Awaiting final resolution by the Admin.',
                'date'        => $resolutionLog?->created_at?->format('d M Y, h:i A'),
                'done'        => $resolutionDone,
            ];

            return [
                'id'             => $log->id,
                'subject'        => $match[1] ?? 'Support Query',
                'message'        => $match[2] ?? ($log->notes ?? ''),
                'status'         => $isResolved ? 'resolved' : ($isEscalated ? 'in_progress' : 'pending'),
                'submitted_at'   => $log->created_at?->toISOString(),
                'submitted_date' => $log->created_at?->format('d M Y, h:i A'),
                'timeline'       => $timeline,
            ];
        })->sortByDesc('submitted_at')->values();

        return response()->json(['success' => true, 'data' => $tickets]);
    }
}


