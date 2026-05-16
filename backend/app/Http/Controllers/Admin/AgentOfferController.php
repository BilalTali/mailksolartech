<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\OfferRedemption;
use App\Services\OfferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgentOfferController extends Controller
{
    public function __construct(private OfferService $offerService) {}

    /**
     * View all live offers with my progress
     */
    public function index(Request $request): JsonResponse
    {
        $offers = $this->offerService->getOffersForUser($request->user());

        return response()->json(['success' => true, 'data' => $offers]);
    }

    /**
     * Redeem an individual offer
     */
    public function redeem(Request $request, int $id): JsonResponse
    {
        try {
            $redemption = $this->offerService->redeemOffer($id, $request->user());

            return response()->json([
                'success' => true,
                'message' => 'Redemption claim submitted successfully!',
                'data' => $redemption,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * View my redemption history
     */
    public function redemptions(Request $request): JsonResponse
    {
        $redemptions = OfferRedemption::query()->where(fn($q) => $q->where('user_id', $request->user()->id))
            ->with('offer')
            ->orderByDesc('claimed_at')
            ->get();

        return response()->json(['success' => true, 'data' => $redemptions]);
    }

    /**
     * View absorbed points (from Enumerators)
     */
    public function absorbedPoints(Request $request): JsonResponse
    {
        $points = \App\Models\SuperAgentAbsorbedPoints::with(['sourceAgent', 'offer', 'lead', 'claimedBy', 'approvedBy'])
            ->where('super_agent_id', $request->user()->id)
            ->where('absorption_reason', 'enumerator_absorption')
            ->orderByDesc('absorbed_at')
            ->get();

        return response()->json(['success' => true, 'data' => $points]);
    }

    /**
     * Claim absorbed points
     */
    public function claimAbsorbedPoints(Request $request, int $id): JsonResponse
    {
        $record = \App\Models\SuperAgentAbsorbedPoints::where('super_agent_id', $request->user()->id)
            ->findOrFail($id);

        if ($record->status !== 'unclaimed') {
            return response()->json(['success' => false, 'message' => 'Status is not unclaimed.'], 400);
        }

        $record->update([
            'status' => 'claimed',
            'claimed_at' => now(),
            'claimed_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Claim submitted to Admin successfully!',
            'data' => $record
        ]);
    }
}
