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
        $user = $request->user();
        $query = Lead::where('status', 'POD_INSPECTION_INITIATED')
            ->with([
                'assignedInstaller', 
                'assignedSurveyor', 
                'documents', 
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
