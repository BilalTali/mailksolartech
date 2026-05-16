<?php

namespace App\Repositories;

use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class AgentRepository
{
    public function getPaginatedAgents(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = User::query()->where(fn($q) => $q->where('role', 'agent'));

        if (! empty($filters['status'])) {
            $query->where(fn($q) => $q->where('status', (string) $filters['status']));
        }

        if (! empty($filters['state'])) {
            $query->where(fn($q) => $q->where('state', (string) $filters['state']));
        }

        return $query->paginate($perPage);
    }

    public function findById(int $id): ?User
    {
        return User::query()->where(fn($q) => $q->where('role', 'agent'))->find($id);
    }
}
