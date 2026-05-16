<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\PasswordResetOtpMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function sendOtp(Request $request)
    {
        $request->validate([
            'identifier' => 'required',
            'password' => 'required|string',
            'role' => 'required|string'
        ]);

        $identifier = trim($request->identifier);
        $expectedRole = $request->role;


        $bruteKey = 'login-attempt:' . $request->ip();
        if (RateLimiter::tooManyAttempts($bruteKey, 10)) {
            $seconds = RateLimiter::availableIn($bruteKey);
            return response()->json([
                'success' => false,
                'message' => 'Too many failed login attempts. Try again in ' . ceil($seconds / 60) . ' minutes.',
            ], 429);
        }
        
        // Robust User Lookup: Try all possible identifier fields
        $user = User::query()->where(function ($q) use ($identifier) {
            $q->where('email', $identifier)
              ->orWhere('mobile', $identifier)
              ->orWhere('agent_id', $identifier)
              ->orWhere('super_agent_code', $identifier)
              ->orWhere('enumerator_id', $identifier);
        })
        ->where(function ($q) use ($expectedRole) {
            if ($expectedRole === 'admin') {
                $q->whereIn('role', ['admin', 'operator']);
            } elseif ($expectedRole !== 'any') {
                $q->where('role', $expectedRole);
            }
        })
        ->first();

        if (!$user) {
            Log::warning("User not found for identifier: {$identifier} and role: {$expectedRole}");
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials. User record not found.'
            ], 422);
        }

        if (!Hash::check($request->password, $user->password)) {
            Log::warning("Password mismatch for user: {$user->email}");
            // Increment brute-force counter on bad credentials
            RateLimiter::hit($bruteKey, 15 * 60);
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials. Password verification failed.'
            ], 422);
        }
        
        /** @var User $user */
        // Status Validation
        if (in_array($user->role, ['agent', 'super_agent', 'enumerator', 'field_technical_team', 'operator'])) {
            if ($user->status === 'pending') {
                return response()->json(['success' => false, 'message' => 'Account pending approval'], 403);
            }
            if ($user->status === 'inactive') {
                return response()->json(['success' => false, 'message' => 'Account suspended'], 403);
            }
        }

        if (!$user->email) {
            $msg = ($user->role === 'field_technical_team') 
                ? 'No email associated with your technician account. Please ask your Admin to add an email to your profile so you can receive OTPs.'
                : 'No email associated with this account. Please contact support.';
                
            return response()->json(['success' => false, 'message' => $msg], 422);
        }

        $throttleKey = 'send-otp:'.$user->mobile;
        $cooldownKey = 'otp-cooldown:'.$user->mobile;

        // Strict 60-second cooldown between individual OTP requests
        if (RateLimiter::tooManyAttempts($cooldownKey, 1)) {
            $seconds = RateLimiter::availableIn($cooldownKey);
            return response()->json([
                'success' => false,
                'message' => 'Please wait ' . $seconds . ' seconds before requesting another OTP.'
            ], 429);
        }

        // Allow 5 attempts per 15 minutes overall
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'message' => 'Too many OTP requests. Please try again after ' . ceil($seconds / 60) . ' minutes.'
            ], 429);
        }

        RateLimiter::hit($throttleKey, 15 * 60); // 15 minutes window overall
        RateLimiter::hit($cooldownKey, 60);      // 60 seconds tight cooldown

        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // STEP 1: Invalidate previous OTPs to ensure no DB block from unexpired old OTPs
        DB::table('login_otps')->where('email', $user->email)->delete();

        // STEP 2 & 3: Save fresh OTP
        DB::table('login_otps')->insert([
            'email' => $user->email,
            'otp' => Hash::make($otp),
            'expires_at' => now()->addMinutes(5),
            'attempts' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // STEP 4: Send direct immediately (synchronously)
        try {
            Mail::to($user->email)->send(new \App\Mail\LoginOtpMail($otp));
        } catch (\Throwable $e) {
            Log::error("OTP Mailer Failure for " . $user->email . ": " . $e->getMessage(), [
                'exception' => $e,
                'user_id' => $user->id,
                'role' => $user->role
            ]);
        }


        return response()->json([
            'success' => true,
            'message' => 'Credentials verified. We sent an OTP to your registered email address.',
        ]);
    }

    public function loginOtp(Request $request)
    {
        $request->validate([
            'identifier' => 'required',
            'otp' => 'required|digits:6',
            'role' => 'required|string'
        ]);

        $identifier = trim($request->identifier);
        $expectedRole = $request->role;

        
        if (preg_match('/^SM-\d+-\d+$/', $identifier) || preg_match('/^ENM-\d+-\d+$/', $identifier)) {
            $field = str_starts_with($identifier, 'SM') ? 'agent_id' : 'enumerator_id';
        } else {
            $field = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'mobile';
        }

        $user = User::query()->with(['superAgent'])->where(function ($q) use ($field, $identifier, $expectedRole) {
            $q->where($field, $identifier);
            if ($expectedRole === 'admin') {
                $q->whereIn('role', ['admin', 'operator']);
            } elseif ($expectedRole !== 'any') {
                $q->where('role', $expectedRole);
            }
        })->first();



        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found for this role.'
            ], 422);
        }

        /** @var User $user */
        $email = (string) $user->email;

        /** @var \stdClass|null $otpRecord */
        $otpRecord = DB::table('login_otps')
            ->where(fn($q) => $q->where('email', $email))
            ->where(fn($q) => $q->where('expires_at', '>', now()))
            ->first();

        if (!$otpRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP. Please request a new one.'
            ], 422);
        }

        if ($otpRecord->attempts >= 5) {
            DB::table('login_otps')->where(fn($q) => $q->where('email', $email))->delete();
            return response()->json([
                'success' => false,
                'message' => 'Too many failed attempts. This OTP has been invalidated.'
            ], 422);
        }

        if (!Hash::check($request->otp, (string) $otpRecord->otp)) {
            DB::table('login_otps')
                ->where(fn($q) => $q->where('email', $email))
                ->increment('attempts');

            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code. Please try again.'
            ], 422);
        }

        // OTP is valid
        DB::table('login_otps')->where(fn($q) => $q->where('email', $email))->delete();

        /** @var User $user */
        $token = $user->createToken('auth_token')->plainTextToken;

        $user->last_login_at = now();
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'token' => $token,
                'user' => [
                    'id'                   => $user->id,
                    'name'                 => $user->name,
                    'email'                => $user->email,
                    'mobile'               => $user->mobile,
                    'agent_id'             => $user->agent_id,
                    'super_agent_code'     => $user->super_agent_code,
                    'role'                 => $user->role,
                    'status'               => $user->status,
                    'approved_at'          => $user->approved_at,
                    'profile_completion'   => $user->profile_completion,
                    'super_agent_id'       => $user->super_agent_id,
                    'profile_photo'        => $user->profile_photo,
                    'district'             => $user->district,
                    'state'                => $user->state,
                ],
            ],
        ]);

    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        // Ensure qr_token exists for dashboard features
        if (! $user->qr_token) {
            $user->qr_token = bin2hex(random_bytes(16));
            $user->save();
        }

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function setPassword(Request $request)
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        /** @var User $user */
        $user = $request->user();
        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password set successfully.',
        ]);
    }

    /**
     * Step 1: Send a 6-digit OTP to the user's registered email for password reset.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
            'role'       => 'nullable|string',
        ]);

        $identifier   = trim($request->identifier);
        $expectedRole = $request->role ?? null;

        // Detect field from identifier format
        if (preg_match('/^SM-\d+-\d+$/', $identifier)) {
            $field = 'agent_id';
        } elseif (preg_match('/^ENM-\d+-\d+$/', $identifier)) {
            $field = 'enumerator_id';
        } else {
            $field = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'mobile';
        }

        $query = User::query()->where(fn($q) => $q->where($field, $identifier));
        if ($expectedRole && $expectedRole !== 'any') {
            $query->where(fn($q) => $q->where('role', $expectedRole));
        }
        $user = $query->first();
        
        Log::info("Forgot password request for identifier: {$identifier}, role: {$expectedRole}. User found: " . ($user ? 'Yes' : 'No'));

        // Always return success to prevent enumeration
        if (!$user || !$user->email) {
            Log::warning("Forgot password failed: User not found or has no email. Identifier: {$identifier}");
            return response()->json([
                'success' => true,
                'message' => 'If an account matched that identifier, a reset OTP has been sent to its registered email.'
            ]);
        }

        $throttleKey = 'forgot-pwd:'.$user->mobile;
        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            // Still return success to prevent enumeration
            return response()->json([
                'success' => true,
                'message' => 'If an account matched that identifier, a reset OTP has been sent to its registered email.'
            ]);
        }
        RateLimiter::hit($throttleKey, 15 * 60);

        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::table('login_otps')->updateOrInsert(
            ['email' => $user->email],
            [
                'otp'        => Hash::make($otp),
                'expires_at' => now()->addMinutes(5),
                'attempts'   => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        try {
            Mail::to($user->email)->send(new PasswordResetOtpMail($otp, $user->name));
        } catch (\Exception $e) {
            Log::error("Forgot password OTP mail failed for: {$user->email}. Error: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'A password reset OTP has been sent to your registered email address.',
        ]);
    }

    /**
     * Step 2: Verify OTP.
     * Step 3: Set new password.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'identifier'            => 'required|string',
            'otp'                   => 'required|digits:6',
            'password'              => 'required|string|min:8|confirmed',
            'role'                  => 'nullable|string',
        ]);

        $identifier   = trim($request->identifier);
        $expectedRole = $request->role ?? null;

        if (preg_match('/^SM-\d+-\d+$/', $identifier)) {
            $field = 'agent_id';
        } elseif (preg_match('/^ENM-\d+-\d+$/', $identifier)) {
            $field = 'enumerator_id';
        } else {
            $field = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'mobile';
        }

        $query = User::query()->where(fn($q) => $q->where($field, $identifier));
        if ($expectedRole && $expectedRole !== 'any') {
            $query->where(fn($q) => $q->where('role', $expectedRole));
        }
        $user = $query->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found.'], 422);
        }

        /** @var User $user */
        if (!$user->email) {
            return response()->json(['success' => false, 'message' => 'No email associated with account.'], 422);
        }

        $email = (string) $user->email;

        /** @var \stdClass|null $otpRecord */
        $otpRecord = DB::table('login_otps')
            ->where('email', $email)
            ->where('expires_at', '>', now())
            ->first();

        if (!$otpRecord) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired OTP.'], 422);
        }

        // Defensive check for attempts property
        $attempts = isset($otpRecord->attempts) ? (int)$otpRecord->attempts : 0;
        if ($attempts >= 5) {
            DB::table('login_otps')->where('email', $email)->delete();
            return response()->json(['success' => false, 'message' => 'Too many failed attempts. This OTP has been invalidated.'], 422);
        }

        if (!Hash::check($request->otp, (string) ($otpRecord->otp ?? ''))) {
            DB::table('login_otps')->where('email', $email)->increment('attempts');
            return response()->json(['success' => false, 'message' => 'Invalid verification code.'], 422);
        }

        // OTP valid — update password and clean up
        $user->password = Hash::make($request->password);
        $user->save();

        DB::table('login_otps')->where('email', $email)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Your password has been reset successfully. You may now log in.',
        ]);
    }

    public function uploadProfilePhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        /** @var User $user */
        $user = $request->user();

        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
                Storage::disk('public')->delete($user->profile_photo);
            }

            $path = $request->file('photo')->store('profiles', 'public');

            $user->profile_photo = $path;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Profile photo uploaded successfully',
                'data' => $user->fresh(),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No photo uploaded',
        ], 400);
    }
}
