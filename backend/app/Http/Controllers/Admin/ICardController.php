<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ICardService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;

class ICardController extends Controller
{
    public function __construct(private ICardService $iCardService) {}

    /**
     * Download the authenticated user's second ID card as PDF.
     */
    public function download2(Request $request): Response
    {
        $requestedUserId = $request->route('userId') ?? $request->query('userId');
        $user = Auth::user();

        if ($requestedUserId) {
            if ($request->hasValidSignature() || ($user?->isAdmin())) {
                $user = User::findOrFail($requestedUserId);
            }
        }

        if (! $user) {
            \Illuminate\Support\Facades\Log::warning('ICard2 download failed: User not found or unauthorized', [
                'userId_param' => $requestedUserId,
                'auth_id' => Auth::id()
            ]);
            abort(401, 'Unauthorized or invalid download link');
        }

        return $this->iCardService->generateAndDownload2($user);
    }

    /**
     * Get signed download URL for the current user's iCard 2.
     */
    public function getDownloadUrl2(Request $request)
    {
        $user = Auth::user();
        $targetUserId = $request->query('userId', $user?->id);
        
        $isAdmin = $user && in_array($user->role, ['admin', 'super_admin', 'operator']);

        if (!$isAdmin) {
            if ($targetUserId != $user?->id) {
                abort(403, 'Unauthorized to download this ID card');
            }
            if ($user?->status !== 'active' || $user?->profile_completion < 60) {
                abort(403, 'ID card is available only for approved users with at least 60% complete profiles.');
            }
        }

        $url = URL::temporarySignedRoute(
            'icard.download2',
            now()->addMinutes(10),
            ['userId' => $targetUserId]
        );

        return response()->json(['url' => $url]);
    }

}
