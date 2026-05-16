<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IncentiveOffer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminIncentiveOfferController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = IncentiveOffer::query();

        if ($request->has('active')) {
            $query->where(fn ($q) => $q->where('is_active', (bool) filter_var($request->active, FILTER_VALIDATE_BOOLEAN)));
        }

        $offers = $query->orderBy('target_installs')->get();

        return response()->json(['success' => true, 'data' => $offers]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'offer_type' => 'required|in:physical,cash,trip',
            'target_installs' => 'required|integer|min:1',
            'reward_value' => 'nullable|numeric|min:0',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'sometimes|boolean',
            'image_url' => 'nullable|string|max:500',
        ]);

        $offer = IncentiveOffer::create($data);

        return response()->json(['success' => true, 'data' => $offer, 'message' => 'Incentive offer created.'], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $offer = IncentiveOffer::findOrFail($id);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'offer_type' => 'sometimes|in:physical,cash,trip',
            'target_installs' => 'sometimes|integer|min:1',
            'reward_value' => 'nullable|numeric|min:0',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date',
            'is_active' => 'sometimes|boolean',
            'image_url' => 'nullable|string|max:500',
        ]);

        $offer->update($data);

        return response()->json(['success' => true, 'data' => $offer->fresh(), 'message' => 'Incentive offer updated.']);
    }

    public function destroy(int $id): JsonResponse
    {
        IncentiveOffer::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Incentive offer deleted.']);
    }
}
