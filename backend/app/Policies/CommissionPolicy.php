<?php

namespace App\Policies;

use App\Models\Commission;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class CommissionPolicy
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
    public function view(User $user, Commission $commission): bool
    {
        if ($user->isAdmin()) return true;
        
        // Direct involvement
        if ($commission->entered_by === $user->id || $commission->payee_id === $user->id) {
            return true;
        }

        // Logical Parent Check (BDM monitoring their team's earnings)
        if ($user->isSuperAgent()) {
            if ($commission->payee_role === 'field_technical_team') {
                return false;
            }
            $logicalParentId = app(\App\Services\HierarchyService::class)->getLogicalParentId($commission->payee, $commission->lead);
            return (int) $logicalParentId === (int) $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Commission $commission): bool
    {
        if ($user->isAdmin()) return true;
        if ($commission->entered_by === $user->id) return true;

        // Recursive Hierarchy Check (Allows BDM to manage their whole team's payouts)
        if ($user->isSuperAgent()) {
            if ($commission->payee_role === 'field_technical_team') {
                return false;
            }
            $ascendantSAId = app(\App\Services\HierarchyService::class)->findAscendantSuperAgentId($commission->payee);
            return (int) $ascendantSAId === (int) $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Commission $commission): bool
    {
        if ($user->isAdmin()) return true;
        if ($commission->entered_by === $user->id) return true;

        // Only Admin or the Original Enterer can delete a commission record.
        return false;
    }
}
