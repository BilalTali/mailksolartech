<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Services\LeadService;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class DisbursementQueueController extends Controller
{
    public function __construct(
        private LeadService $leadService,
        private NotificationService $notificationService,
    ) {}

    public function index(Request $request)
    {
        $query = Lead::where('status', 'FILE_SUBMITTED_TO_BANK')
            ->with(['beneficiary', 'assignedAgent', 'createdBySuperAgent'])
            ->orderBy('updated_at', 'asc');

        return response()->json([
            'success' => true,
            'data' => $query->paginate($request->input('per_page', 20))
        ]);
    }

    public function verify(Request $request, string $ulid)
    {
        $request->validate([
            'disbursement_reference' => 'required|string|max:255',
            'notes' => 'nullable|string|max:500'
        ]);

        $lead = Lead::where('ulid', $ulid)->firstOrFail();

        // Update the reference first
        $lead->update([
            'disbursement_reference' => $request->input('disbursement_reference'),
            'disbursement_verified_at' => now(),
            'disbursement_verified_by' => $request->user()->id
        ]);

        // Then update status, which will trigger auto-commission
        $this->leadService->updateStatus(
            lead: $lead,
            newStatus: 'DISBURSEMENT_VERIFIED',
            changedById: $request->user()->id,
            notes: $request->input('notes')
        );

        $this->notificationService->notifyDisbursementVerified($lead);

        return response()->json([
            'success' => true,
            'message' => 'Disbursement verified and commissions triggered.'
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
            newStatus: 'FILE_REJECTED',
            changedById: $request->user()->id,
            notes: $request->input('reason')
        );

        return response()->json([
            'success' => true,
            'message' => 'Disbursement rejected.'
        ]);
    }
}
