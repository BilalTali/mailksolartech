<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\OfferRedemption;
use App\Services\OfferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminOfferController extends Controller
{
    public function __construct(private OfferService $offerService) {}

    public function index(): JsonResponse
    {
        $offers = Offer::query()->withCount('redemptions')
            ->orderByDesc('is_featured')
            ->orderBy('display_order')
            ->get();

        return response()->json(['success' => true, 'data' => $offers]);
    }

    public function store(Request $request): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Only Super Admin can create offers.'], 403);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'prize_label' => 'required|string|max:255',
            'prize_amount' => 'nullable|numeric|min:0',
            'prize_image' => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:10240',
            'offer_from' => 'required|date',
            'offer_to' => 'required|date|after_or_equal:offer_from',
            'target_points' => 'required|numeric|min:0.1',
            'offer_type' => 'required|in:individual,collective',
            'visible_to' => 'required|in:agents,super_agents,both',
            'status' => 'sometimes|in:active,paused,ended',
            'is_featured' => 'sometimes|boolean',
            'display_order' => 'sometimes|integer',
        ]);

        if ($request->hasFile('prize_image')) {
            $data['prize_image_path'] = $request->file('prize_image')->store('offer_images', 'public');
        }
        unset($data['prize_image']);

        $data['created_by'] = $request->user()->id;
        $offer = Offer::query()->create($data);

        /** @var Offer $offer */
        return response()->json(['success' => true, 'data' => $this->formatOffer($offer)], 201);
    }

    public function show(int $id): JsonResponse
    {
        $offer = Offer::query()->with(['redemptions.user'])->findOrFail($id);

        return response()->json(['success' => true, 'data' => $offer]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Only Super Admin can update offers.'], 403);
        }

        $offer = Offer::findOrFail($id);
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'prize_label' => 'sometimes|string|max:255',
            'prize_amount' => 'nullable|numeric|min:0',
            'prize_image' => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:5120',
            'offer_from' => 'sometimes|date',
            'offer_to' => 'sometimes|date',
            'target_points' => 'sometimes|numeric|min:0.1',
            'offer_type' => 'sometimes|in:individual,collective',
            'visible_to' => 'sometimes|in:agents,super_agents,both',
            'status' => 'sometimes|in:active,paused,ended',
            'is_featured' => 'sometimes|boolean',
            'display_order' => 'sometimes|integer',
        ]);

        if ($request->hasFile('prize_image')) {
            // Delete old image if it exists
            if ($offer->prize_image_path) {
                Storage::disk('public')->delete($offer->prize_image_path);
            }
            $data['prize_image_path'] = $request->file('prize_image')->store('offer_images', 'public');
        }
        unset($data['prize_image']);

        $offer->update($data);

        /** @var Offer $offerFresh */
        $offerFresh = $offer->fresh();
        return response()->json(['success' => true, 'data' => $this->formatOffer($offerFresh)]);
    }

    /** Format offer with computed prize_image_url */
    private function formatOffer(Offer $offer): array
    {
        $arr = $offer->toArray();
        $arr['prize_image_url'] = $offer->prize_image_path
            ? asset('storage/'.$offer->prize_image_path)
            : null;

        return $arr;
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Only Super Admin can delete offers.'], 403);
        }

        Offer::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Offer deleted.']);
    }

    /**
     * REDEMPTION MANAGEMENT
     */
    public function redemptions(Request $request): JsonResponse
    {
        $query = OfferRedemption::query()->with(['offer', 'user', 'approvedBy', 'adminApprovedBy'])
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 WHEN status = 'admin_approved' THEN 1 WHEN status = 'approved' THEN 2 ELSE 3 END")
            ->orderByDesc('claimed_at');

        if ($request->has('status')) {
            $query->where(fn ($q) => $q->where('status', (string) $request->status));
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function approveRedemption(Request $request, int $id): JsonResponse
    {
        $redemption = OfferRedemption::query()->findOrFail($id);

        if ($request->user()->isSuperAdmin()) {
            $this->offerService->approveRedemption($redemption, $request->user(), $request->notes);
        } else {
            $this->offerService->approveRedemptionByAdmin($redemption, $request->user(), $request->notes);
        }

        return response()->json(['success' => true, 'message' => 'Redemption approved.']);
    }

    public function deliveredRedemption(Request $request, int $id): JsonResponse
    {
        $redemption = OfferRedemption::query()->findOrFail($id);
        $this->offerService->markDelivered($redemption, $request->user(), $request->notes);

        return response()->json(['success' => true, 'message' => 'Redemption marked as delivered.']);
    }

    public function cancelRedemption(Request $request, int $id): JsonResponse
    {
        $redemption = OfferRedemption::query()->findOrFail($id);
        $this->offerService->cancelRedemption($redemption, $request->user(), $request->notes);

        return response()->json(['success' => true, 'message' => 'Redemption cancelled and points reverted.']);
    }

    /**
     * NEW v3 METHODS
     */
    public function myOffers(Request $request): JsonResponse
    {
        $offers = collect($this->offerService->getOffersForUser($request->user()))
            ->filter(fn($o) => in_array($o['visible_to'], ['both', 'super_agents']))
            ->values();

        return response()->json(['success' => true, 'data' => $offers]);
    }

    public function myRedemptions(Request $request): JsonResponse
    {
        $redemptions = OfferRedemption::query()->where('user_id', $request->user()->id)
            ->with('offer')
            ->orderByDesc('claimed_at')
            ->get();

        return response()->json(['success' => true, 'data' => $redemptions]);
    }

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

    public function leaderboard(): JsonResponse
    {
        $users = \App\Models\User::query()
            ->whereIn('role', ['agent', 'super_agent'])
            ->where('status', 'active')
            ->get();

        $leaderboard = $users->map(function ($u) {
            $total = \App\Models\OfferProgress::where('user_id', $u->id)->sum('total_points');
            $redeemed = \App\Models\OfferProgress::where('user_id', $u->id)->sum('redeemed_points');
            return [
                'user_id' => $u->id,
                'name' => $u->name,
                'role' => $u->role,
                'identifier' => $u->agent_id ?? $u->super_agent_code,
                'total_points' => (float)$total,
                'redeemed_points' => (float)$redeemed,
                'unredeemed_points' => (float)($total - $redeemed),
            ];
        })->filter(fn($u) => $u['total_points'] > 0)->sortByDesc('total_points')->values();

        return response()->json(['success' => true, 'data' => $leaderboard]);
    }

    public function masterOverview(Request $request): JsonResponse
    {
        $viewer = $request->user();
        
        $query = \App\Models\User::query()
            ->whereIn('role', ['admin', 'super_admin', 'super_agent', 'agent', 'enumerator']);

        // If not a Super Admin, restrict to own hierarchy
        if (!$viewer->isSuperAdmin()) {
            // Get all downlines (recursive)
            // For now, we can filter by parent_id or super_agent_id matching the viewer
            $query->where(function($q) use ($viewer) {
                $q->where('id', $viewer->id)
                  ->orWhere('parent_id', $viewer->id)
                  ->orWhere('super_agent_id', $viewer->id)
                  ->orWhere('created_by_super_agent_id', $viewer->id);
            });
            
            // Explicitly exclude other Super Admins from a regular Admin's view
            $query->where('role', '!=', 'super_admin');
        }

        $users = $query->get();

        $overview = $users->map(function ($u) {
            $total = \App\Models\OfferProgress::where('user_id', $u->id)->sum('total_points');
            $redeemed = \App\Models\OfferProgress::where('user_id', $u->id)->sum('redeemed_points');
            $absorbed = \App\Models\SuperAgentAbsorbedPoints::where('super_agent_id', $u->id)->sum('absorbed_points');
            
            return [
                'user_id' => $u->id,
                'name' => $u->name,
                'role' => $u->role,
                'identifier' => $u->agent_id ?? $u->super_agent_code ?? $u->enumerator_id ?? 'ADMIN',
                'points_earned' => max(0, (float)$total - (float)$absorbed),
                'absorbed_points' => (float)$absorbed,
                'total_available' => max(0, (float)$total - (float)$redeemed),
                'redeemed_points' => (float)$redeemed,
            ];
        })->filter(fn($u) => $u['points_earned'] > 0 || $u['absorbed_points'] > 0 || $u['user_id'] === $viewer->id)->values();

        return response()->json(['success' => true, 'data' => $overview]);
    }

    public function agentOffers(int $id): JsonResponse
    {
        $agent = \App\Models\User::findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => collect($this->offerService->getOffersForUser($agent))->filter(fn($o) => in_array($o['visible_to'], ['both', $agent->role.'s']))->values()
        ]);
    }

    public function participants(int $id): JsonResponse
    {
        $offer = Offer::findOrFail($id);

        $participants = \App\Models\OfferProgress::query()->where(fn($q) => $q->where('offer_id', $id))
            ->with(['user'])
            ->get()
            ->map(function ($p) {
                return [
                    'user_id' => $p->user_id,
                    'name' => $p->user->name,
                    'agent_id' => $p->user->agent_id ?? $p->user->super_agent_code,
                    'role' => $p->role_context,
                    'total_points' => $p->total_points,
                    'unredeemed' => $p->unredeemed_points,
                    'redemptions' => $p->redemption_count,
                    'last_activity' => $p->last_installation_at?->diffForHumans(),
                ];
            });

        return response()->json(['success' => true, 'data' => $participants]);
    }

    public function absorbedPoints(): JsonResponse
    {
        $points = \App\Models\SuperAgentAbsorbedPoints::query()->with(['superAgent', 'sourceAgent', 'offer', 'lead'])
            ->orderByDesc('absorbed_at')
            ->get();

        return response()->json(['success' => true, 'data' => $points]);
    }

    public function approveAbsorption(Request $request, int $id): JsonResponse
    {
        $ap = \App\Models\SuperAgentAbsorbedPoints::query()->findOrFail($id);

        $ap->update([
            'status' => 'delivered',
            'delivered_at' => now(),
            'approved_by' => $request->user()->id,
            'admin_notes' => $request->notes,
        ]);

        return response()->json(['success' => true, 'message' => 'Absorption approved and marked as delivered.']);
    }

    public function triggerExpiry(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Only Super Admin can trigger expiry.'], 403);
        }

        $offer = Offer::findOrFail($id);
        $stats = $this->offerService->processOfferExpiry($offer);

        return response()->json(['success' => true, 'data' => $stats]);
    }
}
