<?php

namespace App\Services;

use App\Models\AdminInventory;
use App\Models\Lead;
use App\Models\LeadInventoryItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\StoreInstallationDocumentsRequest;

class InstallationService
{
    public function __construct(
        private LeadService $leadService,
        private PipelineService $pipelineService,
        private NotificationService $notificationService
    ) {}

    public function submitChecklist(Lead $lead, User $installer, StoreInstallationDocumentsRequest $request): void
    {
        Log::info('submitChecklist called', [
            'lead' => $lead->ulid,
            'installer' => $installer->id,
            'has_files' => count($request->allFiles()),
        ]);
        DB::transaction(function () use ($lead, $installer, $request) {
            $checklistOnly = $request->has('checklist_only') && $request->boolean('checklist_only');

            // 1. Create Installation Submission row
            $submissionId = DB::table('installation_submissions')->insertGetId([
                'lead_id' => $lead->id,
                'installer_id' => $installer->id,
                'latitude' => $request->input('latitude'),
                'longitude' => $request->input('longitude'),
                'status' => 'PENDING',
                'terms_agreed' => true,
                'terms_agreed_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // 2. Process all 8 documents
            if (!$checklistOnly) {
                $documents = [
                    ['key' => 'geo_material', 'file' => $request->file('image_geo_material'), 'make' => null, 'serial' => null],
                    ['key' => 'geo_panel_serial', 'file' => $request->file('image_geo_panel_serial'), 'make' => $request->input('make_panel'), 'serial' => $request->input('serial_number_panel')],
                    ['key' => 'geo_erected_la', 'file' => $request->file('image_geo_erected_la'), 'make' => null, 'serial' => $request->input('serial_number_la')],
                    ['key' => 'geo_earthing', 'file' => $request->file('image_geo_earthing'), 'make' => null, 'serial' => null],
                    ['key' => 'geo_inverter_serial', 'file' => $request->file('image_geo_inverter_serial'), 'make' => $request->input('make_inverter'), 'serial' => $request->input('serial_number_inverter')],
                    ['key' => 'agreement_consumer', 'file' => $request->file('image_agreement_consumer'), 'make' => null, 'serial' => null],
                    ['key' => 'loan_statement', 'file' => $request->file('image_loan_statement'), 'make' => null, 'serial' => null],
                    ['key' => 'geo_consumer_inverter', 'file' => $request->file('image_geo_consumer_inverter'), 'make' => null, 'serial' => null],
                ];

                $lat = $request->input('latitude');
                $lng = $request->input('longitude');

                foreach ($documents as $doc) {
                    if ($doc['file']) {
                        // Use same storage pattern as LeadService (local disk)
                        $path = $doc['file']->store("leads/{$lead->ulid}/installation", 'local');

                        DB::table('installation_documents')->insert([
                            'installation_submission_id' => $submissionId,
                            'lead_id' => $lead->id,
                            'document_key' => $doc['key'],
                            'model_make' => $doc['make'],
                            'serial_number' => $doc['serial'],
                            'file_path' => $path,
                            'original_filename' => $doc['file']->getClientOriginalName(),
                            'mime_type' => $doc['file']->getMimeType(),
                            'latitude' => $lat,
                            'longitude' => $lng,
                            'geo_tagged_at' => now(),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }
                }
            }

            // 3. Process Inventory Reconciliation + Restock Admin Inventory for returns
            $reconciliation = json_decode($request->input('inventory_reconciliation'), true);
            if ($reconciliation && is_array($reconciliation)) {
                foreach ($reconciliation as $leadItemId => $data) {
                    $revertedQty  = (int) ($data['reverted'] ?? 0);
                    $consumedQty  = (int) ($data['consumed'] ?? 0);

                    // Lock the lead item row to prevent concurrent double-credit
                    /** @var LeadInventoryItem|null $leadItem */
                    $leadItem = LeadInventoryItem::lockForUpdate()
                        ->where('id', $leadItemId)
                        ->where('lead_id', $lead->id)
                        ->first();

                    if (!$leadItem) {
                        Log::warning('InstallationService: LeadInventoryItem not found', ['id' => $leadItemId]);
                        continue;
                    }

                    // Persist consumed/reverted quantities on the lead item
                    $leadItem->update([
                        'consumed_quantity' => $consumedQty,
                        'reverted_quantity' => $revertedQty,
                    ]);

                    // ── Return reverted stock to admin's personal ledger ──────
                    // The admin who dispatched the item is stored in `dispatched_by`.
                    // We credit them back so they can reallocate the unused items.
                    if ($revertedQty > 0 && $leadItem->dispatched_by) {
                        AdminInventory::firstOrCreate(
                            [
                                'admin_id'          => $leadItem->dispatched_by,
                                'inventory_item_id' => $leadItem->inventory_item_id,
                            ],
                            [
                                'current_stock'  => 0,
                                'total_received' => 0,
                                'total_consumed' => 0,
                                'total_reverted' => 0,
                            ]
                        );

                        // Atomic increments — safe against concurrent checklist submissions
                        AdminInventory::where('admin_id', $leadItem->dispatched_by)
                            ->where('inventory_item_id', $leadItem->inventory_item_id)
                            ->increment('current_stock', $revertedQty);

                        AdminInventory::where('admin_id', $leadItem->dispatched_by)
                            ->where('inventory_item_id', $leadItem->inventory_item_id)
                            ->increment('total_reverted', $revertedQty);

                        Log::info('InstallationService: stock returned to admin', [
                            'admin_id'          => $leadItem->dispatched_by,
                            'inventory_item_id' => $leadItem->inventory_item_id,
                            'reverted_qty'      => $revertedQty,
                            'lead_ulid'         => $lead->ulid,
                        ]);
                    }
                }
            }

            // 4. Update Annexure B fields in LeadSurveyRequirement
            \App\Models\LeadSurveyRequirement::updateOrCreate(
                ['lead_id' => $lead->id],
                [
                    'inverter_rating' => $request->input('inverter_rating'),
                    'remote_monitoring_configured' => $request->boolean('remote_monitoring_configured'),
                    'dcdb_rating' => $request->input('dcdb_rating'),
                    'acdb_rating' => $request->input('acdb_rating'),
                    'dc_wire_type' => $request->input('dc_wire_type'),
                    'dc_wire_size' => $request->input('dc_wire_size'),
                    'ac_wire_type' => $request->input('ac_wire_type'),
                    'ac_wire_size' => $request->input('ac_wire_size'),
                    'earth_wire_type' => $request->input('earth_wire_type'),
                    'earth_wire_size' => $request->input('earth_wire_size'),
                ]
            );

            // 5. Advance Lead Status
            $targetStatus = $checklistOnly ? 'INSTALLATION_IN_PROGRESS' : 'SOLAR_INSTALLED';
            $this->pipelineService->advanceTo(
                newStatus: $targetStatus,
                lead: $lead,
                actor: $installer,
                notes: $checklistOnly ? 'Installer confirmed delivered material checklist & unused returns.' : 'Installer submitted 8-document checklist.'
            );

            // 4. Notify Admin/Operator
            // Admin notification logic here if needed (could be handled implicitly via LeadService status update)
        });
    }
}
