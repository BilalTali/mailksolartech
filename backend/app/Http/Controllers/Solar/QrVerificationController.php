<?php

namespace App\Http\Controllers\Solar;

use App\Http\Controllers\Controller;

use App\Models\QrScanLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class QrVerificationController extends Controller
{
    /**
     * Public verification page for phone scans.
     */
    public function verify(Request $request, string $token)
    {
        /** @var User|null $user */
        $user = User::query()
            ->where(fn ($q) => $q->where('qr_token', $token))
            ->with(['superAgent'])
            ->first();

        // Log the scan
        $this->logScan($request, $user?->id);

        if (! $user) {
            return view('verify.invalid', [
                'reason' => 'QR code not found. This card may be invalid or has been revoked.',
            ]);
        }

        // Update scan statistics
        /** @var User $user */
        $user->increment('scan_count');
        $user->update(['last_verified_at' => now()]);

        $isActive = $user->status === 'active';
        $isSuspended = $user->status === 'inactive' || $user->status === 'suspended';

        return view('verify.result', [
            'user' => $user,
            'isActive' => $isActive,
            'isSuspended' => $isSuspended,
            'cardNumber' => $user->agent_id ?? $user->super_agent_code ?? 'ADM',
            'designation' => $this->getDesignation($user),
            'scannedAt' => Carbon::now()->format('d M Y, h:i A'),
            'initials' => $this->getInitials($user->name),
            'fatherName' => $user->father_name ?? 'N/A',
            'dob' => $user->dob ? $user->dob->format('d M Y') : 'N/A',
            'bloodGroup' => $user->blood_group ?? 'N/A',
            'mobile' => $user->mobile ?? 'N/A',
            'clearance' => \App\Models\Setting::getValue('icard_clearance', 'Level-V (Elite)'),
        ]);
    }

    /**
     * Internal scan logging.
     */
    private function logScan(Request $request, ?int $userId): void
    {
        try {
            QrScanLog::create([
                'user_id' => $userId,
                'ip_address' => $request->ip(),
                'user_agent' => substr($request->userAgent() ?? '', 0, 500),
                'referer' => substr($request->header('referer') ?? '', 0, 500),
            ]);
        } catch (\Exception $e) {
            Log::warning('QR scan log failed: '.$e->getMessage());
        }
    }

    /**
     * Get display designation based on role.
     */
    private function getDesignation(User $user): string
    {
        return match ($user->role) {
            'admin' => 'ADMINISTRATOR',
            'super_agent' => 'SUPER AGENT',
            'agent' => 'FIELD AGENT',
            default => 'MEMBER',
        };
    }

    /**
     * Get initials for avatar fallback.
     */
    private function getInitials(string $name): string
    {
        $parts = explode(' ', trim($name));
        $first = $parts[0][0] ?? '';
        $last = (count($parts) > 1) ? $parts[count($parts) - 1][0] : '';

        return strtoupper($first.$last);
    }
}
