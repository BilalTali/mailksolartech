<?php

namespace App\Services;

use App\Models\Commission;
use App\Models\Lead;
use App\Models\SuperAgentTeamLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SuperAgentService
{
    public function __construct(private NotificationService $notificationService) {}

    /**
     * Get aggregated team stats for a super agent's dashboard.
     */
    public function getTeamStats(User $superAgent): array
    {
        $agentIds = User::query()->agents()->where(fn ($q) => $q->where('super_agent_id', $superAgent->id))->pluck('id');

        // 1. Team Stats (Consolidated)
        $agentStats = User::query()->agents()
            ->where(fn ($q) => $q->where('super_agent_id', $superAgent->id))
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        // 2. Lead Status Summary
        $leadsQuery = Lead::query()->where(function ($q) use ($agentIds, $superAgent) {
            $q->where(fn ($q2) => $q2->where('assigned_super_agent_id', $superAgent->id))
                ->orWhereIn('assigned_agent_id', $agentIds)
                ->orWhereIn('submitted_by_agent_id', $agentIds);
        });

        $statusCounts = (clone $leadsQuery)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $totalLeads = $statusCounts->sum();

        // 3. Commissions Summary (using conditional sums)
        /** @var object|null $commSummary */
        $commSummary = Commission::query()->where(fn ($q) => $q->where('payee_id', $superAgent->id))
            ->where(fn ($q) => $q->where('payee_role', 'super_agent'))
            ->select(
                DB::raw('sum(case when payment_status = "unpaid" then amount else 0 end) as pending'),
                DB::raw('sum(case when payment_status = "paid" then amount else 0 end) as paid'),
                DB::raw('sum(case when payment_status = "paid" and month(paid_at) = '.now()->month.' and year(paid_at) = '.now()->year.' then amount else 0 end) as this_month')
            )
            ->first();

        /** @var object|null $agentCommSummary */
        $agentCommSummary = Commission::query()->where(fn ($q) => $q->whereIn('payee_id', $agentIds))
            ->where(fn ($q) => $q->where('payee_role', 'agent'))
            ->select(
                DB::raw('sum(case when payment_status = "unpaid" then amount else 0 end) as pending'),
                DB::raw('sum(case when payment_status = "paid" then amount else 0 end) as paid')
            )
            ->first();

        // 4. Trends (Minimal queries)
        $now = now();
        $lastMonth = now()->subMonth();

        return [
            'team' => [
                'total_agents' => $agentIds->count(),
                'active_agents' => $agentStats->get('active', 0),
                'pending_agents' => $agentStats->get('pending', 0),
            ],
            'leads' => [
                'total' => $totalLeads,
                'new' => $statusCounts->get('new', 0),
                'in_progress' => $totalLeads - $statusCounts->get('NEW', 0) - $statusCounts->get('LEAD_COMPLETED', 0) - $statusCounts->get('REJECTED', 0) - $statusCounts->get('INVALID', 0) - $statusCounts->get('DUPLICATE', 0),
                'installed' => $statusCounts->get('REGISTERED', 0) + $statusCounts->get('SURVEY_DONE', 0) + $statusCounts->get('AT_BANK', 0) + $statusCounts->get('PROJECT_COMMISSIONING', 0) + $statusCounts->get('SUBSIDY_REQUEST', 0) + $statusCounts->get('SUBSIDY_APPLIED', 0) + $statusCounts->get('SUBSIDY_DISBURSED', 0),
                'completed' => $statusCounts->get('LEAD_COMPLETED', 0),
                'rejected' => $statusCounts->get('rejected', 0),
            ],
            'commissions' => [
                'override_pending' => (float) ($commSummary?->pending ?? 0),
                'override_paid' => (float) ($commSummary?->paid ?? 0),
                'override_this_month' => (float) ($commSummary?->this_month ?? 0),
                'agent_pending' => (float) ($agentCommSummary?->pending ?? 0),
                'agent_paid' => (float) ($agentCommSummary?->paid ?? 0),
            ],
            'trends' => [
                'leads_this_month' => (clone $leadsQuery)->where(function ($q) use ($now) {
                    $q->whereYear('created_at', $now->year)->whereMonth('created_at', $now->month);
                })->count(),
                'leads_last_month' => (clone $leadsQuery)->where(function ($q) use ($lastMonth) {
                    $q->whereYear('created_at', $lastMonth->year)->whereMonth('created_at', $lastMonth->month);
                })->count(),
                'installs_this_month' => (clone $leadsQuery)->where(function ($q) use ($now) {
                    $q->whereIn('status', ['REGISTERED', 'SURVEY_DONE', 'AT_BANK', 'LEAD_COMPLETED', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_APPLIED', 'SUBSIDY_DISBURSED'])->whereYear('updated_at', $now->year)->whereMonth('updated_at', $now->month);
                })->count(),
                'installs_last_month' => (clone $leadsQuery)->where(function ($q) use ($lastMonth) {
                    $q->whereIn('status', ['REGISTERED', 'SURVEY_DONE', 'AT_BANK', 'LEAD_COMPLETED', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_APPLIED', 'SUBSIDY_DISBURSED'])->whereYear('updated_at', $lastMonth->year)->whereMonth('updated_at', $lastMonth->month);
                })->count(),
            ],
        ];
    }

    /**
     * Assign an agent to a super agent (admin action).
     */
    public function assignAgent(User $superAgent, User $agent, User $assignedBy): void
    {
        DB::transaction(function () use ($superAgent, $agent, $assignedBy) {
            $agent->super_agent_id = $superAgent->id;
            $agent->parent_id = $superAgent->id;
            $agent->save();

            SuperAgentTeamLog::create([
                'super_agent_id' => $superAgent->id,
                'agent_id' => $agent->id,
                'assigned_by' => $assignedBy->id,
                'assigned_at' => now(),
            ]);

            // Notify super agent
            $this->notificationService->send(
                $superAgent->id,
                'agent_assigned_to_team',
                'New Agent Assigned',
                "Agent {$agent->name} ({$agent->agent_id}) has been assigned to your team."
            );

            // Notify agent
            $this->notificationService->send(
                $agent->id,
                'assigned_to_super_agent',
                'Team Assignment',
                "You have been assigned to Super Agent {$superAgent->name} ({$superAgent->super_agent_code})."
            );
        });
    }

    /**
     * Unassign an agent from their super agent.
     */
    public function unassignAgent(User $superAgent, User $agent, User $removedBy, ?string $notes = null): void
    {
        DB::transaction(function () use ($superAgent, $agent, $notes) {
            $agent->super_agent_id = null;
            $agent->save();

            $log = SuperAgentTeamLog::where('super_agent_id', $superAgent->id)
                ->where('agent_id', $agent->id)
                ->whereNull('unassigned_at')
                ->latest()
                ->first();

            if ($log) {
                $log->update(['unassigned_at' => now(), 'notes' => $notes]);
            }

            $this->notificationService->send(
                $superAgent->id,
                'agent_removed_from_team',
                'Agent Removed from Team',
                "Agent {$agent->name} ({$agent->agent_id}) has been removed from your team."
            );

            $this->notificationService->send(
                $agent->id,
                'unassigned_from_super_agent',
                'Team Reassignment',
                "You have been unassigned from Super Agent {$superAgent->name}. Contact admin for further details."
            );
        });
    }

    /**
     * Admin approves a super agent.
     */
    public function approveSuperAgent(User $superAgent, ?User $admin = null): User
    {
        return DB::transaction(function () use ($superAgent, $admin) {
            $updateData = ['status' => 'active'];

            if (! $superAgent->super_agent_code) {
                $updateData['super_agent_code'] = app(AgentService::class)->generateSuperAgentCode();
            }

            if (! $superAgent->letter_number) {
                $updateData['letter_number'] = app(JoiningLetterService::class)->generateLetterNumber($superAgent);
                $updateData['joining_date'] = now()->toDateString();
                $updateData['approved_at'] = now();
                $updateData['approved_by'] = $admin ? $admin->id : null;

                // QR Token Generation
                $updateData['qr_token'] = hash('sha256', \Illuminate\Support\Str::random(40).$superAgent->id.now()->timestamp);
                $updateData['qr_generated_at'] = now();
            }

            $superAgent->update($updateData);

            $this->notificationService->send(
                $superAgent->id,
                'super_agent_approved',
                'Business Development Manager Account Approved!',
                "Your account is approved. Your Manager ID is {$superAgent->super_agent_code}."
            );

            return $superAgent->fresh();
        });
    }

    /**
     * Check if a super agent is authorized to access a given lead.
     */
    public function canAccessLead(User $superAgent, Lead $lead): bool
    {
        $agentIds = User::query()->agents()
            ->where(fn ($q) => $q->where('super_agent_id', $superAgent->id))
            ->pluck('id');

        return $lead->assigned_super_agent_id === $superAgent->id
            || $agentIds->contains($lead->assigned_agent_id)
            || $agentIds->contains($lead->submitted_by_agent_id);
    }
}
