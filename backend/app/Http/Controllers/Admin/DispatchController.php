<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Services\LeadService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DispatchController extends Controller
{
    public function __construct(
        private LeadService $leadService,
        private NotificationService $notificationService
    ) {}

    public function dispatchMaterial(Request $request, string $ulid)
    {
        $request->validate([
            'vehicle_number' => 'required|string|max:30',
            'driver_name' => 'required|string|max:100',
            'driver_mobile' => 'required|string|max:15',
            'receipt_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'items' => 'nullable|array',
            'items.*.id' => 'required_with:items|exists:lead_inventory_items,id',
            'items.*.serial_number' => 'nullable|string|max:200',
        ]);

        $lead = Lead::where('ulid', $ulid)->firstOrFail();

        DB::transaction(function () use ($request, $lead) {
            $dispatchId = DB::table('dispatches')->insertGetId([
                'lead_id' => $lead->id,
                'vehicle_number' => $request->input('vehicle_number'),
                'driver_name' => $request->input('driver_name'),
                'driver_mobile' => $request->input('driver_mobile'),
                'receipt_number' => $request->input('receipt_number'),
                'notes' => $request->input('notes'),
                'dispatched_at' => now(),
                'dispatched_by' => $request->user()->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $lead->update(['dispatch_id' => $dispatchId]);

            // Update pre-allocated lead inventory items
            DB::table('lead_inventory_items')
                ->where('lead_id', $lead->id)
                ->whereNull('dispatched_at')
                ->update([
                    'dispatched_by' => $request->user()->id,
                    'dispatched_at' => now(),
                    'updated_at' => now(),
                ]);

            if ($request->has('items') && is_array($request->input('items'))) {
                foreach ($request->input('items') as $item) {
                    if (isset($item['serial_number'])) {
                        DB::table('lead_inventory_items')
                            ->where('id', $item['id'])
                            ->where('lead_id', $lead->id)
                            ->update(['serial_number' => $item['serial_number']]);
                    }
                }
            }

            $this->leadService->updateStatus(
                lead: $lead,
                newStatus: 'DISPATCH_INITIATED',
                changedById: $request->user()->id,
                notes: $request->input('notes')
            );
        });

        $this->notificationService->notifyMaterialDispatched($lead->fresh());

        return response()->json([
            'success' => true,
            'message' => 'Dispatch initiated successfully.'
        ]);
    }

    public function markInTransit(Request $request, string $ulid)
    {
        $lead = Lead::where('ulid', $ulid)->firstOrFail();

        $this->leadService->updateStatus(
            lead: $lead,
            newStatus: 'IN_TRANSIT',
            changedById: $request->user()->id,
            notes: $request->input('notes')
        );

        // Notify consumer if they have an account
        if ($lead->consumer) {
            $this->notificationService->send(
                $lead->consumer->id,
                'dispatch_in_transit',
                'Material In Transit',
                "Your solar installation material is now in transit for lead {$lead->ulid}.",
                ['lead_ulid' => $lead->ulid]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Lead marked as in transit.'
        ]);
    }
}
