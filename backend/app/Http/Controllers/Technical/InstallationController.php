<?php

namespace App\Http\Controllers\Technical;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Services\InstallationService;
use App\Http\Requests\StoreInstallationDocumentsRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InstallationController extends Controller
{
    public function __construct(private InstallationService $installationService) {}

    public function getChecklist(Request $request, string $ulid)
    {
        $lead = Lead::where('ulid', $ulid)
            ->with(['surveyRequirement', 'inventoryItems.inventoryItem'])
            ->firstOrFail();

        // Check if assigned installer or surveyor
        $user = $request->user();
        if ($lead->assigned_installer_id !== $user->id && $lead->assigned_surveyor_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $submission = DB::table('installation_submissions')
            ->where('lead_id', $lead->id)
            ->latest('id')
            ->first();

        $documents = [];
        if ($submission) {
            $documents = DB::table('installation_documents')
                ->where('installation_submission_id', $submission->id)
                ->get();
        }

        $sr = $lead->surveyRequirement;

        return response()->json([
            'success' => true,
            'data' => [
                'lead' => [
                    'id'                   => $lead->id,
                    'ulid'                 => $lead->ulid,
                    'beneficiary_name'     => $lead->beneficiary_name,
                    'beneficiary_district' => $lead->beneficiary_district,
                    'beneficiary_state'    => $lead->beneficiary_state,
                    'status'               => $lead->status,
                    // Surveyor's ordered material spec
                    'survey_requirement' => $sr ? [
                        'system_capacity_kw'          => $sr->system_capacity_kw,
                        'panel_quantity'              => $sr->panel_quantity,
                        'panel_model_make'            => $sr->panel_model_make,
                        'inverter_model_make'         => $sr->inverter_model_make,
                        'wire_length_meters'          => $sr->wire_length_meters,
                        'earthing_kit_required'       => $sr->earthing_kit_required,
                        'lightning_arrester_required' => $sr->lightning_arrester_required,
                        'additional_accessories'      => $sr->additional_accessories ?? [],
                        'site_notes'                  => $sr->site_notes,
                    ] : null,
                    // Admin-dispatched physical inventory — the actual delivery checklist
                    'dispatched_items' => $lead->inventoryItems->map(fn($item) => [
                        'id'            => $item->id,
                        'name'          => $item->inventoryItem->name ?? 'Unknown',
                        'quantity'      => $item->quantity,
                        'serial_number' => $item->serial_number,
                        'dispatched_at' => $item->dispatched_at?->toDateString(),
                    ]),
                ],
                'submission' => $submission,
                'documents'  => $documents,
            ]
        ]);
    }

    public function submitChecklist(StoreInstallationDocumentsRequest $request, string $ulid)
    {
        try {
            $lead = Lead::where('ulid', $ulid)->firstOrFail();
            $user = $request->user();

            if ($lead->assigned_installer_id !== $user->id && $lead->assigned_surveyor_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $this->installationService->submitChecklist($lead, $user, $request);

            return response()->json([
                'success' => true,
                'message' => 'Installation checklist submitted successfully.'
            ]);
        } catch (\Exception $e) {
            \Log::error('Installation submission failed: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Internal Server Error: ' . $e->getMessage()
            ], 500);
        }
    }
}
