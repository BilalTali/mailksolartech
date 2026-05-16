<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OfferRedemption;
use App\Services\OfferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnumeratorOfferController extends Controller
{
    public function __construct(private OfferService $offerService) {}

    /**
     * Return all active offers with this enumerator's personal progress.
     */
    public function index(Request $request): JsonResponse
    {
        $offers = $this->offerService->getOffersForUser($request->user());

        return response()->json([
            'success' => true,
            'data'    => $offers,
        ]);
    }

    /**
     * Submit a redemption claim for an offer.
     */
    public function redeem(Request $request, int $id): JsonResponse
    {
        try {
            $redemption = $this->offerService->redeemOffer($id, $request->user());
            return response()->json(['success' => true, 'data' => $redemption]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * List this enumerator's redemption history.
     */
    public function redemptions(Request $request): JsonResponse
    {
        $redemptions = OfferRedemption::where('user_id', $request->user()->id)
            ->with('offer:id,title,description,target_points')
            ->orderByDesc('claimed_at')
            ->get();

        return response()->json(['success' => true, 'data' => $redemptions]);
    }
}
