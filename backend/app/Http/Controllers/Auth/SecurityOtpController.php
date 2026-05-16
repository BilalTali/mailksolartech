<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\LoginOtpMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class SecurityOtpController extends Controller
{
    /**
     * Send OTP to the authenticated super admin for secure area access.
     */
    public function sendOtp(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->role !== 'super_admin' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $throttleKey = 'security-otp:' . $user->id;
        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'message' => 'Too many requests. Please try again in ' . ceil($seconds / 60) . ' minutes.'
            ], 429);
        }

        RateLimiter::hit($throttleKey, 10 * 60);

        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store OTP in DB (reusing login_otps table for consistency)
        DB::table('login_otps')->updateOrInsert(
            ['email' => $user->email],
            [
                'otp' => Hash::make($otp),
                'expires_at' => now()->addMinutes(5),
                'attempts' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        try {
            Mail::to($user->email)->send(new LoginOtpMail($otp));
        } catch (\Exception $e) {
            \Log::error("Security OTP Mail Failure: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to send OTP email.'], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Security OTP sent to your email.',
        ]);
    }

    /**
     * Verify the security OTP.
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'otp' => 'required|digits:6',
        ]);

        /** @var User $user */
        $user = $request->user();
        $email = $user->email;

        $otpRecord = DB::table('login_otps')
            ->where('email', $email)
            ->where('expires_at', '>', now())
            ->first();

        if (!$otpRecord) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired OTP.'], 422);
        }

        if (!Hash::check($request->otp, $otpRecord->otp)) {
            DB::table('login_otps')->where('email', $email)->increment('attempts');
            return response()->json(['success' => false, 'message' => 'Incorrect OTP.'], 422);
        }

        // OTP is valid
        DB::table('login_otps')->where('email', $email)->delete();

        // Unlock the security area for 1 hour
        $cacheKey = 'super-admin-security-unlocked:' . $user->id;
        Cache::put($cacheKey, true, 3600);

        return response()->json([
            'success' => true,
            'message' => 'Access granted to secure settings.',
            'unlock_token' => bin2hex(random_bytes(16)) // Optional additional layer
        ]);
    }

    /**
     * Check if the secure area is currently unlocked.
     */
    public function checkStatus(Request $request)
    {
        $user = $request->user();
        $cacheKey = 'super-admin-security-unlocked:' . $user->id;
        
        return response()->json([
            'success' => true,
            'is_unlocked' => Cache::has($cacheKey)
        ]);
    }
}
