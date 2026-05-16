<?php

namespace App\Repositories;

use App\Models\Lead;
use Illuminate\Pagination\LengthAwarePaginator;

class LeadRepository
{
    public function getPaginatedLeads(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Lead::query()->with(['assignedAgent', 'submittedByAgent']);

        if (! empty($filters['status'])) {
            if (is_array($filters['status'])) {
                $query->where(fn ($q) => $q->whereIn('status', $filters['status']));
            } else {
                $query->where(fn ($q) => $q->where('status', $filters['status']));
            }
        }

        if (! empty($filters['assigned_agent_id'])) {
            $query->where(fn ($q) => $q->where('assigned_agent_id', $filters['assigned_agent_id']));
        }

        if (! empty($filters['state'])) {
            $query->where(fn ($q) => $q->where('beneficiary_state', $filters['state']));
        }

        if (! empty($filters['source'])) {
            $query->where(fn ($q) => $q->where('source', $filters['source']));
        }

        if (! empty($filters['search'])) {
            $search = str_replace(['%', '_'], ['\%', '\_'], $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where(fn ($q2) => $q2->where('beneficiary_name', 'like', "%{$search}%"))
                    ->orWhere(fn ($q2) => $q2->where('beneficiary_mobile', 'like', "%{$search}%"))
                    ->orWhere(fn ($q2) => $q2->where('consumer_number', 'like', "%{$search}%"));
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function findByUlid(string $ulid): ?Lead
    {
        return Lead::query()->with(['assignedAgent', 'statusLogs', 'documents'])->where(fn ($q) => $q->where('ulid', $ulid))->first();
    }
}
