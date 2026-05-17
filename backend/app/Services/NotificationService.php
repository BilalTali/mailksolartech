<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\Offer;
use App\Models\OfferRedemption;
use App\Models\SuperAgentAbsorbedPoints;

class NotificationService
{
    public function create(int $userId, string $type, string $title, string $message, array $data = []): Notification
    {
        $dbNotif = Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        // HIGH-09: Dispatch WebPush asynchronously — never block the calling HTTP request or DB transaction.
        $notifId = $dbNotif->id;
        dispatch(function () use ($userId, $title, $message, $data, $notifId) {
            try {
                $user = User::find($userId);
                if ($user) {
                    $url = $data['url'] ?? '/notifications';
                    $user->notify(new \App\Notifications\WebPushNotification($title, $message, $url));
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('WebPush failed (queued): ' . $e->getMessage());
            }
        })->afterResponse();

        return $dbNotif;
    }

    public function send(int $userId, string $type, string $title, string $message, array $data = []): Notification
    {
        return $this->create($userId, $type, $title, $message, $data);
    }

    public function notifyAdmins(string $type, string $title, string $message, array $data = []): void
    {
        $admins = User::query()->admins()->get();
        foreach ($admins as $admin) {
            $this->create($admin->id, $type, $title, $message, $data);
        }
    }

    // --- Offer specific ---

    public function notifyOfferRedeemable(Offer $offer, User $user, int $pendingCount): void
    {
        $times = $pendingCount > 1 ? "{$pendingCount} times" : 'once';
        $this->create($user->id, 'offer_redeemable',
            "🎁 You can redeem: {$offer->title}",
            "You've earned enough installations to claim your prize ({$offer->prize_label}) — {$times}! Go to Offers to redeem."
        );
    }

    public function notifyOfferMilestone(Offer $offer, User $user, int $toNext, int $pendingCount): void
    {
        $extra = $pendingCount > 0 ? " (+{$pendingCount} ready to redeem!)" : '';
        $this->create($user->id, 'offer_milestone',
            "⚡ {$toNext} more to next prize — {$offer->title}",
            "Just {$toNext} more installation(s) to claim: {$offer->prize_label}{$extra}"
        );
    }

    public function notifyAdminOfferRedemptionClaimed(Offer $offer, User $agent, OfferRedemption $r): void
    {
        $this->notifyAdmins('offer_redemption_claimed',
            "🎁 Redemption #{$r->redemption_number} — {$offer->title}",
            "{$agent->name} ({$agent->agent_id}) has claimed their prize: {$offer->prize_label}. Please arrange delivery."
        );
    }

    public function notifyAgentRedemptionApproved(Offer $offer, User $agent, OfferRedemption $r): void
    {
        $this->create($agent->id, 'redemption_approved',
            "✅ Prize approved — {$offer->prize_label}",
            "Admin has approved your claim (Redemption #{$r->redemption_number}). Prize delivery is being arranged."
        );
    }

    public function notifyAgentPrizeDelivered(Offer $offer, User $agent): void
    {
        $this->create($agent->id, 'prize_delivered',
            "📦 Prize delivered — {$offer->prize_label}",
            'Your prize has been marked as delivered. Congratulations and keep going!'
        );
    }

    public function notifyCollectiveOfferCompleted(Offer $offer): void
    {
        $this->notifyAdmins('collective_offer_completed',
            "🎯 Collective Offer Completed: {$offer->title}",
            "The team has hit the target of {$offer->target_points} points. Prize: {$offer->prize_label}"
        );
    }

    public function notifyAgentGracePeriodExpired(User $agent, Offer $offer): void
    {
        $this->create($agent->id, 'offer_grace_expired',
            "⏰ Offer Ended: {$offer->title}",
            "The redemption window for \"{$offer->title}\" has now closed. Your eligible reward was not claimed in time."
        );
    }

    public function notifySuperAgentNewAbsorption(int $saId, Offer $offer): void
    {
        $sa = User::find($saId);
        if (! $sa) {
            return;
        }

        $absorbedRecords = SuperAgentAbsorbedPoints::query()
            ->where(fn($q) => $q->where('super_agent_id', $saId))
            ->where(fn($q) => $q->where('offer_id', $offer->id))
            ->where(fn($q) => $q->where('status', 'unclaimed'))
            ->with('sourceAgent:id,name,agent_id')
            ->get();

        if ($absorbedRecords->isEmpty()) {
            return;
        }

        $agentNames = $absorbedRecords->map(fn ($r) => $r->sourceAgent->name)->join(', ');
        $totalPoints = $absorbedRecords->sum('absorbed_installations');

        $visibilityNote = match ($offer->visible_to) {
            'agents' => 'This was an Agents-only offer — your agents worked toward it and their unclaimed points are now yours to claim.',
            'super_agents' => 'This offer was for Super Agents.',
            default => 'This offer was open to all participants.',
        };

        $this->create($sa->id, 'absorbed_points_available',
            "📥 Points Absorbed: \"{$offer->title}\"",
            "The offer \"{$offer->title}\" has ended. " . (string)$totalPoints . " installation points from your agent(s) (" . (string)$agentNames . ") have been transferred to you. {$visibilityNote} Visit Offers → Absorbed Points to claim your reward."
        );
    }

    public function notifyAdminSAAbsorbedClaim(SuperAgentAbsorbedPoints $ap, User $sa): void
    {
        $this->notifyAdmins('absorbed_claim_request',
            "📥 Absorbed Points Claim: {$sa->name}",
            "{$sa->name} ({$sa->super_agent_code}) has claimed {$ap->absorbed_points} absorbed points from offer \"{$ap->offer->title}\". Please review and deliver."
        );
    }

    // =========================================================================
    // Phase 7 — Pipeline Event Notifications
    // =========================================================================

    /** Admin: new lead requires MNRE registration */
    public function notifyAdminNewLead(\App\Models\Lead $lead): void
    {
        $this->notifyAdmins('lead_new',
            "📋 New Lead: {$lead->beneficiary_name}",
            "A new application has been submitted by {$lead->beneficiary_name} from {$lead->beneficiary_district}, {$lead->beneficiary_state}. ULID: {$lead->ulid}"
        );
    }

    /** Admin: consumer submitted a support ticket */
    public function notifyAdminSupportTicket(\App\Models\Lead $lead, string $subject, string $message): void
    {
        $this->notifyAdmins('support_ticket',
            "📩 Support Request: {$lead->beneficiary_name}",
            "Consumer submitted a query [{$subject}]: " . substr($message, 0, 50) . "..."
        );
    }

    /** Lead: registration confirmed (MNRE) */
    public function notifyLeadRegistered(\App\Models\Lead $lead): void
    {
        $this->notifyLeadContacts($lead, 'lead_registered',
            '✅ MNRE Registration Confirmed',
            "Your solar application has been registered on the PM-Surya Ghar portal. Application: {$lead->ulid}"
        );
    }

    /** Lead + Agent: material dispatched */
    public function notifyMaterialDispatched(\App\Models\Lead $lead): void
    {
        $this->notifyLeadContacts($lead, 'material_dispatched',
            '🚚 Solar Material Dispatched',
            "Your solar installation materials have been dispatched and are on the way to your site. Application: {$lead->ulid}"
        );
    }

    /** Installer: installation checklist rejected */
    public function notifyInstallationRejected(\App\Models\Lead $lead, string $reason): void
    {
        if ($lead->assigned_installer_id) {
            $this->send($lead->assigned_installer_id, 'installation_rejected',
                '❌ Installation Checklist Rejected',
                "Your installation checklist for {$lead->beneficiary_name} was rejected. Reason: {$reason}. Please re-submit with corrections."
            );
        }
    }

    /** Admin: installation checklist submitted for review */
    public function notifyAdminInstallationSubmitted(\App\Models\Lead $lead): void
    {
        $this->notifyAdmins('installation_submitted',
            "🔧 Installation Checklist Submitted — {$lead->beneficiary_name}",
            "The installation team has submitted the 8-document checklist for {$lead->beneficiary_name} ({$lead->ulid}). Please review."
        );
    }

    /** Lead + Agent: installation verified */
    public function notifyInstallationVerified(\App\Models\Lead $lead): void
    {
        $this->notifyLeadContacts($lead, 'installation_verified',
            '✅ Solar Installation Verified',
            "The installation at your site has been officially verified. Your solar system is now operational. Application: {$lead->ulid}"
        );
    }

    /** Lead + Agent: POD successful — system live */
    public function notifyPodSuccessful(\App\Models\Lead $lead): void
    {
        $this->notifyLeadContacts($lead, 'pod_successful',
            '🌟 POD Successful — System Live!',
            "Your solar plant has passed the POD (Proof of Delivery) inspection. Subsidy processing has started. Application: {$lead->ulid}"
        );
    }

    /** Lead: disbursement loan verified */
    public function notifyDisbursementVerified(\App\Models\Lead $lead): void
    {
        $this->notifyLeadContacts($lead, 'disbursement_verified',
            '💰 Loan Disbursed',
            "Your bank loan/disbursement has been verified. Installation of your solar system will begin shortly. Application: {$lead->ulid}"
        );
    }

    /** Lead: subsidy applied */
    public function notifySubsidyApplied(\App\Models\Lead $lead): void
    {
        $this->notifyLeadContacts($lead, 'subsidy_applied',
            '⭐ Subsidy Application Filed',
            "Your MNRE subsidy application has been filed. Approval and disbursement are expected soon. Application: {$lead->ulid}"
        );
    }

    /** Lead: subsidy disbursed */
    public function notifySubsidyDisbursed(\App\Models\Lead $lead): void
    {
        $this->notifyLeadContacts($lead, 'subsidy_disbursed',
            '🎉 Subsidy Disbursed!',
            "Your MNRE subsidy amount has been disbursed. Congratulations! Your solar project is now fully complete. Application: {$lead->ulid}"
        );
    }

    /** Lead + Agent + Admin: project fully completed */
    public function notifyLeadCompleted(\App\Models\Lead $lead): void
    {
        // Notify beneficiary contacts
        $this->notifyLeadContacts($lead, 'lead_completed',
            '🏆 Project Complete — Congratulations!',
            "Your solar project is 100% complete. Enjoy clean energy and savings every month! Application: {$lead->ulid}"
        );
        // Notify admin team
        $this->notifyAdmins('lead_completed',
            "🏆 Lead Completed: {$lead->beneficiary_name}",
            "The solar project for {$lead->beneficiary_name} ({$lead->ulid}) has been fully completed. All pipeline stages are done."
        );
    }

    /** Super Admin escalated a ticket to an Admin */
    public function notifyAdminEscalation(\App\Models\Lead $lead, string $message): void
    {
        if ($lead->assigned_admin_id) {
            $this->create($lead->assigned_admin_id, 'ticket_escalated',
                "🚨 Escalated Ticket: {$lead->beneficiary_name}",
                "Super Admin has escalated a support query to you: " . substr($message, 0, 100),
                ['url' => "/admin/monitor/leads?search={$lead->ulid}"]
            );
        }
    }

    /** Admin delegated a ticket to a technical team member */
    public function notifyTeamDelegation(\App\Models\Lead $lead, string $message, \App\Models\User $teamMember): void
    {
        $this->create($teamMember->id, 'ticket_delegated',
            "🔧 Support Task Assigned: {$lead->beneficiary_name}",
            "Admin has assigned a support task to you: " . substr($message, 0, 100),
            ['url' => "/technical/leads/{$lead->ulid}"]
        );
    }

    /**
     * Helper: notify the lead's assigned agent, super agent, and enumerator.
     * Does NOT send to the consumer account (they have their own portal).
     */
    private function notifyLeadContacts(\App\Models\Lead $lead, string $type, string $title, string $message): void
    {
        $notified = [];

        // HIGH-10: Include enumerator in all pipeline milestone notifications.
        foreach ([
            $lead->assigned_agent_id,
            $lead->assigned_super_agent_id,
            $lead->submitted_by_agent_id,
            $lead->submitted_by_enumerator_id,  // was missing
        ] as $userId) {
            if ($userId && ! in_array($userId, $notified)) {
                $this->send($userId, $type, $title, $message);
                $notified[] = $userId;
            }
        }
    }
}
