<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
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
    public function view(User $user, User $model): bool
    {
        if ($user->isAdmin() || $user->id === $model->id) return true;
        
        if ($user->isSuperAgent()) {
            return $model->super_agent_id === $user->id || $model->parent_id === $user->id;
        }

        if ($user->isAgent()) {
            return $model->parent_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        if ($user->isAdmin() || $user->id === $model->id) return true;
        
        if ($user->isSuperAgent()) {
            return $model->super_agent_id === $user->id || $model->parent_id === $user->id;
        }

        if ($user->isAgent()) {
            return $model->parent_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, User $model): bool
    {
        if ($user->isAdmin()) return true;
        return false;
    }
}
