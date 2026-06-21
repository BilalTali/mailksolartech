<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Services\LeadService;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class InstallationQueueController extends Controller
{
    public function __construct(
        private LeadService $leadService,
        private NotificationService $notificationService
    ) {}


    public function index(Request $request)
    {
        $user = $request->user();
        $query = Lead::query()->where('status', 'SOLAR_INSTALLED')
            ->with([
                'assignedInstaller', 
                'assignedSurveyor', 
                'installationSubmissions', 
                'submittedByEnumerator:id,name,role,enumerator_id'
            ]);

        // ── RECURSIVE TEAM ISOLATION & HIERARCHY APPROVAL GATE ──
        if (!$user->isSuperAdmin()) {
            $managedIds = $user->getManagedUserIds();
            $adminId = $user->isOperator() && $user->parent_id ? $user->parent_id : $user->id;
            $query->where(function ($q) use ($user, $managedIds, $adminId) {
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
                ->orWhere('assigned_admin_id', $adminId)
                ->orWhere('wa_handler_admin_id', $adminId);
            });
        }

        $query->orderBy('updated_at', 'desc');

        return response()->json([
            'success' => true,
            'data' => $query->paginate($request->input('per_page', 20))
        ]);
    }

    public function verify(Request $request, string $ulid)
    {
        $lead = Lead::query()->where('ulid', $ulid)->firstOrFail();

        $this->leadService->updateStatus(
            lead: $lead,
            newStatus: 'POD_INSPECTION_INITIATED',
            changedById: $request->user()->id,
            notes: $request->input('notes')
        );

        $this->notificationService->notifyInstallationVerified($lead);

        return response()->json([
            'success' => true,
            'message' => 'Installation verified successfully.'
        ]);
    }

    public function reject(Request $request, string $ulid)
    {
        $request->validate([
            'reason' => 'required|string|max:500'
        ]);

        $lead = Lead::query()->where('ulid', $ulid)->firstOrFail();

        // Move status back to INSTALLATION_IN_PROGRESS so the installer can see and resubmit
        $reason = $request->input('reason');
        $installer = $lead->assignedInstaller ?? $lead->assignedSurveyor;

        $this->leadService->updateStatus(
            lead: $lead,
            newStatus: 'INSTALLATION_IN_PROGRESS',
            changedById: $request->user()->id,
            notes: 'Installation Rejected: ' . $reason
        );

        \App\Models\LeadStatusLog::create([
            'lead_id' => $lead->id,
            'from_status' => 'SOLAR_INSTALLED',
            'to_status' => 'INSTALLATION_IN_PROGRESS',
            'changed_by' => $request->user()->id,
            'notes' => 'Installation Rejected: ' . $reason,
            'metadata' => ['action' => 'installation_rejected', 'reason' => $reason]
        ]);

        $this->notificationService->notifyInstallationRejected($lead, $reason);

        return response()->json([
            'success' => true,
            'message' => 'Installation rejected and installer notified.'
        ]);
    }

    public function dispatchToInstaller(Request $request, string $ulid)
    {
        $lead = Lead::query()->where('ulid', $ulid)->firstOrFail();

        $this->leadService->updateStatus(
            lead: $lead,
            newStatus: 'INSTALLATION_IN_PROGRESS',
            changedById: $request->user()->id,
            notes: 'Dispatched to installer.'
        );

        return response()->json([
            'success' => true,
            'message' => 'Dispatched to installer successfully.'
        ]);
    }
}
