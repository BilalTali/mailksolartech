<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\OfferRedemption;
use App\Services\OfferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperAgentOfferController extends Controller
{
    public function __construct(private OfferService $offerService) {}

    /**
     * View live offers with my own progress (if any)
     */
    public function index(Request $request): JsonResponse
    {
        $offers = $this->offerService->getOffersForUser($request->user());

        return response()->json(['success' => true, 'data' => $offers]);
    }

    /**
     * View team performance summary for all live individual offers
     */
    public function teamPerformance(Request $request): JsonResponse
    {
        $data = $this->offerService->getTeamOfferPerformance($request->user());

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Redeem an individual offer if Super Agent is eligible
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
     * My own redemption history
     */
    public function redemptions(Request $request): JsonResponse
    {
        $redemptions = OfferRedemption::query()->where(fn ($q) => $q->where('user_id', $request->user()->id))
            ->with('offer')
            ->orderByDesc('claimed_at')
            ->get();

        return response()->json(['success' => true, 'data' => $redemptions]);
    }

    public function absorbedPoints(Request $request): JsonResponse
    {
        $sa = $request->user();

        // Fetch ALL absorbed points for this SA — no visibility filter on the offer
        $absorbed = \App\Models\SuperAgentAbsorbedPoints::query()->where(fn ($q) => $q->where('super_agent_id', $sa->id))
            ->with([
                'sourceAgent:id,name,agent_id,district,state',
                'offer:id,title,offer_from,offer_to,target_points,prize_label,prize_image_path,visible_to',
            ])
            ->orderByRaw("FIELD(status, 'unclaimed', 'claimed', 'delivered')")
            ->orderBy('absorbed_at', 'DESC')
            ->get();

        $summary = [
            'unclaimed_count' => $absorbed->where('status', 'unclaimed')->count(),
            'unclaimed_points' => $absorbed->where('status', 'unclaimed')->sum('absorbed_points'),
            'claimed_count' => $absorbed->where('status', 'claimed')->count(),
            'delivered_count' => $absorbed->where('status', 'delivered')->count(),
            'total_absorbed_ever' => $absorbed->sum('absorbed_points'),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'absorbed' => $absorbed,
                'summary' => $summary,
            ],
        ]);
    }

    public function claimAbsorbed(Request $request, int $id): JsonResponse
    {
        $sa = $request->user();
        $ap = \App\Models\SuperAgentAbsorbedPoints::query()->findOrFail($id);

        // ONLY check: is this absorption record actually for this SA?
        if ((int) $ap->super_agent_id !== (int) $sa->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        // Check status
        if ($ap->status !== 'unclaimed') {
            return response()->json([
                'success' => false,
                'message' => match ($ap->status) {
                    'claimed' => 'You have already submitted this claim. Waiting for admin approval.',
                    'delivered' => 'This reward has already been delivered.',
                    default => 'Cannot claim at this time.',
                },
            ], 422);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($ap, $sa) {
            $ap->update([
                'status' => 'claimed',
                'claimed_by' => $sa->id,
                'claimed_at' => now(),
            ]);

            // Notify admin
            /** @var \App\Models\SuperAgentAbsorbedPoints $apLoaded */
            $apLoaded = $ap->load('offer', 'sourceAgent');
            app(\App\Services\NotificationService::class)->notifyAdminSAAbsorbedClaim($apLoaded, $sa);
        });

        return response()->json([
            'success' => true,
            'message' => 'Claim submitted successfully. Admin will review and process your reward.',
            'data' => $ap->fresh(['offer', 'sourceAgent']),
        ]);
    }
}
