<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class LeadPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Lead $lead): bool
    {
        if ($user->isAdmin() || $user->isOperator()) return true;

        if ($user->isSuperAgent()) {
            return $lead->assigned_super_agent_id === $user->id || $lead->created_by_super_agent_id === $user->id;
        }

        if ($user->isAgent()) {
            return $lead->assigned_agent_id === $user->id || $lead->submitted_by_agent_id === $user->id;
        }

        if ($user->isEnumerator()) {
            return $lead->submitted_by_enumerator_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Lead $lead): bool
    {
        if ($user->isAdmin() || $user->isOperator()) return true;

        if ($user->isSuperAgent()) {
            return $lead->assigned_super_agent_id === $user->id || $lead->created_by_super_agent_id === $user->id;
        }

        if ($user->isAgent()) {
            return $lead->assigned_agent_id === $user->id || $lead->submitted_by_agent_id === $user->id;
        }

        if ($user->isEnumerator()) {
            return $lead->submitted_by_enumerator_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Lead $lead): bool
    {
        if ($user->isAdmin()) return true;
        
        return false;
    }

    /**
     * F6 — Determine whether the user may change the lead's status.
     *
     * Rules:
     *  - Admin / Operator: always permitted (full override).
     *  - Field Technician: only for leads where they are assigned as the
     *    surveyor OR installer (prevents them touching unassigned leads).
     *  - Super Agent / Agent / Enumerator: never (no status-change permission).
     */
    public function updateStatus(User $user, Lead $lead): bool
    {
        if ($user->isAdmin() || $user->isOperator()) {
            return true;
        }

        if ($user->isFieldTechnician()) {
            return $lead->assigned_surveyor_id === $user->id
                || $lead->assigned_installer_id === $user->id;
        }

        if ($user->isSuperAgent()) {
            return $lead->assigned_super_agent_id === $user->id || $lead->created_by_super_agent_id === $user->id;
        }

        if ($user->isAgent()) {
            return $lead->assigned_agent_id === $user->id || $lead->submitted_by_agent_id === $user->id;
        }

        if ($user->isEnumerator()) {
            return $lead->submitted_by_enumerator_id === $user->id;
        }

        return false;
    }

    /**
     * F6 — Determine whether the user may upload documents to this lead.
     * Mirrors the same rules as updateStatus for consistency.
     */
    public function uploadDocument(User $user, Lead $lead): bool
    {
        return $this->update($user, $lead);
    }
}

