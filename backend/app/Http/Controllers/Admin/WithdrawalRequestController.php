<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OfferProgress;
use App\Models\WithdrawalRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WithdrawalRequestController extends Controller
{
    // List for the authenticated user (Agent/Enumerator)
    public function index(Request $request)
    {
        $requests = WithdrawalRequest::with('offer')
            ->where(fn($q) => $q->where('user_id', $request->user()->id))
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $requests
        ]);
    }

    // Submit a new withdrawal request (deducting points)
    public function store(Request $request)
    {
        $data = $request->validate([
            'offer_id'         => 'required|exists:offers,id',
            'points_withdrawn' => 'required|integer|min:1',
            'payment_method'   => 'required|string',
            'payment_details'  => 'required|string',
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($data, $user) {
            $progress = OfferProgress::where('user_id', $user->id)
                ->where('offer_id', $data['offer_id'])
                ->lockForUpdate()
                ->first();

            if (!$progress) {
                return response()->json(['success' => false, 'message' => 'No progress found for this offer.'], 404);
            }

            if ($progress->unredeemed_points < $data['points_withdrawn']) {
                return response()->json(['success' => false, 'message' => 'Insufficient unredeemed points.'], 400);
            }

            // Deduct points
            $progress->unredeemed_points -= $data['points_withdrawn'];
            $progress->redeemed_points += $data['points_withdrawn'];
            $progress->redemption_count += 1; // Count as a redemption
            
            // Recalculate pending redemption count
            $target = $progress->offer->target_points;
            if ($target > 0) {
                $progress->pending_redemption_count = (int) floor($progress->unredeemed_points / $target);
                $progress->can_redeem = $progress->unredeemed_points >= $target;
            }
            $progress->save();

            $withdrawal = WithdrawalRequest::create([
                'user_id'          => $user->id,
                'offer_id'         => $data['offer_id'],
                'points_withdrawn' => $data['points_withdrawn'],
                'amount'           => null, // To be filled by Admin or calculated elsewhere
                'status'           => 'pending',
                'payment_method'   => $data['payment_method'],
                'payment_details'  => $data['payment_details'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal request submitted successfully.',
                'data'    => $withdrawal
            ], 201);
        });
    }

    // List all requests for Admin
    public function adminIndex(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $query = WithdrawalRequest::with(['user:id,name,role', 'offer:id,title']);
        
        if ($request->has('status')) {
            $query->where(fn($q) => $q->where('status', $request->status));
        }

        return response()->json([
            'success' => true,
            'data'    => $query->latest()->get()
        ]);
    }

    // Admin approve request
    public function approve(Request $request, $id)
    {
        // Admin authorization
        if (!$request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $data = $request->validate([
            'amount'      => 'required|numeric|min:0',
            'admin_notes' => 'nullable|string'
        ]);

        $withdrawal = WithdrawalRequest::findOrFail($id);
        
        if ($withdrawal->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Request is not pending.'], 400);
        }

        $withdrawal->update([
            'status'      => 'approved',
            'amount'      => $data['amount'],
            'admin_notes' => $data['admin_notes'] ?? null
        ]);

        return response()->json(['success' => true, 'message' => 'Request approved.', 'data' => $withdrawal]);
    }

    // Admin reject request
    public function reject(Request $request, $id)
    {
        // Admin authorization
        if (!$request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $data = $request->validate([
            'admin_notes' => 'required|string'
        ]);

        $withdrawal = WithdrawalRequest::findOrFail($id);

        if ($withdrawal->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Request is not pending.'], 400);
        }

        DB::transaction(function () use ($withdrawal, $data) {
            $withdrawal->update([
                'status'      => 'rejected',
                'admin_notes' => $data['admin_notes']
            ]);

            // Refund points
            $progress = OfferProgress::where('user_id', $withdrawal->user_id)
                ->where('offer_id', $withdrawal->offer_id)
                ->lockForUpdate()
                ->first();

            if ($progress) {
                $progress->unredeemed_points += $withdrawal->points_withdrawn;
                $progress->redeemed_points -= $withdrawal->points_withdrawn;
                if ($progress->redemption_count > 0) {
                    $progress->redemption_count -= 1;
                }
                
                $target = $progress->offer->target_points;
                if ($target > 0) {
                    $progress->pending_redemption_count = (int) floor($progress->unredeemed_points / $target);
                    $progress->can_redeem = $progress->unredeemed_points >= $target;
                }
                $progress->save();
            }
        });

        return response()->json(['success' => true, 'message' => 'Request rejected and points refunded.', 'data' => $withdrawal]);
    }

    // Admin mark as paid
    public function markPaid(Request $request, $id)
    {
        // Admin authorization
        if (!$request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $withdrawal = WithdrawalRequest::findOrFail($id);

        if ($withdrawal->status !== 'approved') {
            return response()->json(['success' => false, 'message' => 'Only approved requests can be marked as paid.'], 400);
        }

        $withdrawal->update(['status' => 'paid']);

        return response()->json(['success' => true, 'message' => 'Request marked as paid.', 'data' => $withdrawal]);
    }
}
