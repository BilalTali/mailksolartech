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
        $query = Lead::where('status', 'SOLAR_INSTALLED')
            ->with(['assignedInstaller', 'assignedSurveyor', 'installationSubmissions'])
            ->orderBy('updated_at', 'asc');

        return response()->json([
            'success' => true,
            'data' => $query->paginate($request->input('per_page', 20))
        ]);
    }

    public function verify(Request $request, string $ulid)
    {
        $lead = Lead::where('ulid', $ulid)->firstOrFail();

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

        $lead = Lead::where('ulid', $ulid)->firstOrFail();

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
}
