<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ConsumerService
{
    /**
     * Create a consumer user account linked to a lead.
     * Called automatically when a lead is created from the public form.
     */
    public function createForLead(Lead $lead): ?User
    {
        // Don't create if one already exists for this lead
        if (User::where('lead_id', $lead->id)->where('role', 'consumer')->exists()) {
            return null;
        }

        $mobile   = $lead->beneficiary_mobile ?? '';
        $password = 'Welcome@123';   // Default initial password
        $email    = $this->generateEmail($mobile, $lead->id);

        $consumer = User::create([
            'name'     => $lead->beneficiary_name,
            'email'    => $email,
            'mobile'   => $mobile,
            'password' => Hash::make($password),
            'role'     => 'consumer',
            'lead_id'  => $lead->id,
            'status'   => 'active',
        ]);

        // Store plain password temporarily on the lead so admin/notification can read it once
        $lead->update(['consumer_portal_password' => $password]);

        return $consumer;
    }

    /**
     * Generate a deterministic, unique consumer email.
     * Format: consumer_{lead_id}_{mobile_last4}@consumer.andleeb.in
     */
    private function generateEmail(string $mobile, int $leadId): string
    {
        $suffix = strlen($mobile) >= 4 ? substr($mobile, -4) : str_pad($leadId, 4, '0', STR_PAD_LEFT);
        return "consumer_{$leadId}_{$suffix}@consumer.andleeb.in";
    }
}
