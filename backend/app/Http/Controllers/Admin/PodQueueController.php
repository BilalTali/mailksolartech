<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Services\LeadService;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class PodQueueController extends Controller
{
    public function __construct(
        private LeadService $leadService,
        private NotificationService $notificationService,
    ) {}

    public function index(Request $request)
    {
        $query = Lead::where('status', 'POD_INSPECTION_INITIATED')
            ->with(['assignedInstaller', 'assignedSurveyor', 'documents'])
            ->orderBy('updated_at', 'asc');

        return response()->json([
            'success' => true,
            'data' => $query->paginate($request->input('per_page', 20))
        ]);
    }

    public function successful(Request $request, string $ulid)
    {
        $lead = Lead::where('ulid', $ulid)->firstOrFail();

        // This will automatically trigger installer commission via Phase 3 triggers in LeadService
        $this->leadService->updateStatus(
            lead: $lead,
            newStatus: 'POD_SUCCESSFUL',
            changedById: $request->user()->id,
            notes: $request->input('notes')
        );

        $this->notificationService->notifyPodSuccessful($lead);

        return response()->json([
            'success' => true,
            'message' => 'POD verification successful.'
        ]);
    }

    public function reject(Request $request, string $ulid)
    {
        $request->validate([
            'reason' => 'required|string|max:500'
        ]);

        $lead = Lead::where('ulid', $ulid)->firstOrFail();

        $this->leadService->updateStatus(
            lead: $lead,
            newStatus: 'POD_REJECTED',
            changedById: $request->user()->id,
            notes: $request->input('reason')
        );

        return response()->json([
            'success' => true,
            'message' => 'POD verification rejected.'
        ]);
    }
}
