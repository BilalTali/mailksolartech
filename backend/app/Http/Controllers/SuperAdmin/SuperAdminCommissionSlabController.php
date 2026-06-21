<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\CommissionSlab;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperAdminCommissionSlabController extends Controller
{
    /**
     * List all system-default commission slabs (super_agent_id = null),
     * ordered by capacity tier.
     */
    public function index(): JsonResponse
    {
        $slabs = CommissionSlab::query()
            ->whereNull('super_agent_id')
            ->orderByRaw("FIELD(capacity,'1kw','2kw','3kw','4kw','5kw','6kw','7kw','8kw','9kw','10kw')")
            ->get();

        return response()->json([
            'success' => true,
            'data' => $slabs,
        ]);
    }

    /**
     * Update the super_admin_rate for a specific slab.
     * Only super_admin_rate is editable here — agent/super_agent rates are managed elsewhere.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'super_admin_rate' => 'required|numeric|min:0',
        ]);

        $slab = CommissionSlab::query()->whereNull('super_agent_id')->findOrFail($id);
        $slab->update(['super_admin_rate' => $request->super_admin_rate]);

        return response()->json([
            'success' => true,
            'message' => "Rate for {$slab->label} updated to ₹" . number_format($request->super_admin_rate, 0),
            'data' => $slab->fresh(),
        ]);
    }

    /**
     * Bulk update all slab rates in one request.
     * Payload: [ { id: 1, super_admin_rate: 10000 }, ... ]
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'slabs' => 'required|array|min:1',
            'slabs.*.id' => 'required|integer|exists:commission_slabs,id',
            'slabs.*.super_admin_rate' => 'required|numeric|min:0',
        ]);

        foreach ($request->slabs as $item) {
            CommissionSlab::query()
                ->whereNull('super_agent_id')
                ->where(['id' => $item['id']])
                ->update(['super_admin_rate' => $item['super_admin_rate']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Commission rates updated successfully.',
            'data' => CommissionSlab::query()
                ->whereNull('super_agent_id')
                ->orderByRaw("FIELD(capacity,'1kw','2kw','3kw','4kw','5kw','6kw','7kw','8kw','9kw','10kw')")
                ->get(),
        ]);
    }

    /**
     * Return the super_admin_rate for a given capacity string.
     * Used by the AdminAllocationModal to auto-suggest the commission amount.
     *
     * GET /super-admin/commission-slabs/rate/{capacity}
     *   e.g. /super-admin/commission-slabs/rate/3kw
     */
    public function getRateForCapacity(string $capacity): JsonResponse
    {
        $capacity = strtolower(trim($capacity));

        $slab = CommissionSlab::query()
            ->whereNull('super_agent_id')
            ->where(['capacity' => $capacity])
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'capacity'         => $capacity,
                'super_admin_rate' => $slab ? (float) $slab->super_admin_rate : 0.0,
                'label'            => $slab?->label,
                'found'            => (bool) $slab,
            ],
        ]);
    }
}
