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
        $user = $request->user();
        $query = Lead::where('status', 'FILE_SUBMITTED_TO_BANK')
            ->with([
                'beneficiary', 
                'assignedAgent', 
                'createdBySuperAgent', 
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

        $query->orderBy('updated_at', 'asc');

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
