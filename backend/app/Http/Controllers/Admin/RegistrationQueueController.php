<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Services\LeadService;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class RegistrationQueueController extends Controller
{
    public function __construct(
        private LeadService $leadService,
        private NotificationService $notificationService,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Lead::where('status', 'NEW')
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

        $query->orderBy('created_at', 'desc');

        return response()->json([
            'success' => true,
            'data' => $query->paginate($request->input('per_page', 20))
        ]);
    }

    public function register(Request $request, string $ulid)
    {
        $request->validate([
            'bill_serial' => 'required|string|max:100',
            'bill_date' => 'required|date',
            'system_item' => 'required|string|max:100',
            'system_make' => 'nullable|string|max:100',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string'
        ]);

        $lead = Lead::where('ulid', $ulid)->firstOrFail();

        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $lead) {
            $baseAmount = 0;
            $billingItems = [];

            foreach ($request->input('items') as $itemInput) {
                $invItem = \App\Models\InventoryItem::findOrFail($itemInput['id']);

                // ── Deduct from Admin's personal stock (not the global SA warehouse) ──
                // Admin stock is sourced exclusively from Super Admin dispatches.
                $adminStock = \App\Models\AdminInventory::lockForUpdate()
                    ->where('admin_id', $request->user()->id)
                    ->where('inventory_item_id', $invItem->id)
                    ->first();

                if (!$adminStock || $adminStock->current_stock < $itemInput['quantity']) {
                    $available = $adminStock?->current_stock ?? 0;
                    abort(422, "Insufficient admin stock for '{$invItem->name}'. Available: {$available}, Requested: {$itemInput['quantity']}");
                }

                // Atomic deduction from admin ledger
                $adminStock->decrement('current_stock', $itemInput['quantity']);
                $adminStock->increment('total_consumed', $itemInput['quantity']);

                // Record lead inventory item (reserved, not dispatched yet)
                \App\Models\LeadInventoryItem::create([
                    'lead_id'           => $lead->id,
                    'inventory_item_id' => $invItem->id,
                    'quantity'          => $itemInput['quantity'],
                    'consumed_quantity' => 0,
                    'reverted_quantity' => 0,
                ]);

                $lineTotal = $invItem->base_price * $itemInput['quantity'];
                $baseAmount += $lineTotal;

                $billingItems[] = [
                    'inventory_item_id' => $invItem->id,
                    'name' => $invItem->name,
                    'sku' => $invItem->sku,
                    'quantity' => $itemInput['quantity'],
                    'base_price' => $invItem->base_price,
                    'line_total' => $lineTotal,
                ];
            }

            $gstPercentage = 5.00; // Assuming 5% standard GST
            $gstAmount = $baseAmount * ($gstPercentage / 100);
            $totalAmount = $baseAmount + $gstAmount;

            $lead->update([
                'bill_serial' => $request->input('bill_serial'),
                'bill_date' => $request->input('bill_date'),
                'system_item' => $request->input('system_item'),
                'system_make' => $request->input('system_make'),
                'quotation_base_amount' => $baseAmount,
                'quotation_gst_amount' => $gstAmount,
                'quotation_total_amount' => $totalAmount,
                'billing_gst_percentage' => $gstPercentage,
                'billing_items' => $billingItems,
            ]);

            $this->leadService->updateStatus(
                lead: $lead,
                newStatus: 'DOCUMENTS_FOR_REGISTRATION_COMPLETED',
                changedById: $request->user()->id,
                notes: $request->input('notes')
            );

            $this->notificationService->notifyLeadRegistered($lead);
        });

        return response()->json([
            'success' => true,
            'message' => 'Bill generated. Lead is now pending MNRE registration number submission.'
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
            newStatus: 'INVALID',
            changedById: $request->user()->id,
            notes: $request->input('reason')
        );

        return response()->json([
            'success' => true,
            'message' => 'Lead marked as invalid.'
        ]);
    }
}
