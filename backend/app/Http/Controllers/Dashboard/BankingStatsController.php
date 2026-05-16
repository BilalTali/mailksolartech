<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Lead;
use App\Enums\LeadStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Builder;

class BankingStatsController extends Controller
{
    // ─── Status groupings ────────────────────────────────────────────────────

    /** Statuses that count as "submitted to bank" */
    private const BANK_SUBMITTED_STATUSES = [
        'FILE_SUBMITTED_TO_BANK', 'SIGNATURE_PENDING', 'SIGNATURE_DONE',
        'FILE_PENDING_DISBURSAL', 'FILE_DISBURSED', 'FILE_REJECTED',
        'DISBURSEMENT_VERIFIED', 'DISPATCH_INITIATED', 'IN_TRANSIT', 'DELIVERED',
        'MATERIAL_DISPATCHED_TO_INSTALLER',
        'MATERIAL_RECEIVED_BY_INSTALLER', 'MATERIAL_VERIFIED_BY_CONSUMER',
        'INSTALLATION_SCHEDULED', 'INSTALLATION_IN_PROGRESS', 'SOLAR_INSTALLED',
        'INSTALLATION_COMPLETED', 'INSTALLATION_VERIFIED', 'POD_INSPECTION_INITIATED',
        'POD_SUCCESSFUL', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_APPLIED',
        'SUBSIDY_DISBURSED', 'COMPLETED', 'LEAD_COMPLETED', 'REJECTED'
    ];

    /** Statuses that count as "disbursed" */
    private const DISBURSED_STATUSES = [
        'DISBURSEMENT_VERIFIED', 'DISPATCH_INITIATED', 'IN_TRANSIT', 'DELIVERED',
        'MATERIAL_VERIFIED_BY_CONSUMER',
        'INSTALLATION_SCHEDULED', 'INSTALLATION_IN_PROGRESS', 'SOLAR_INSTALLED',
        'POD_INSPECTION_INITIATED',
        'POD_SUCCESSFUL', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_APPLIED',
        'SUBSIDY_DISBURSED', 'LEAD_COMPLETED',
    ];

    /** Statuses considered "pending at bank" (not yet disbursed, not rejected) */
    private const BANK_PENDING_STATUSES = [
        'FILE_SUBMITTED_TO_BANK', 'SIGNATURE_PENDING', 'SIGNATURE_DONE',
        'FILE_PENDING_DISBURSAL', 'FILE_DISBURSED',
    ];

    /** Rejected statuses */
    private const REJECTED_STATUSES = ['FILE_REJECTED', 'REJECTED'];

    // ─── Scope helper ─────────────────────────────────────────────────────────

    private function getScopedLeadQuery($user): Builder
    {
        $query = Lead::query();

        if ($user->isSuperAdmin()) {
            return $query;
        }

        if ($user->isAdmin()) {
            $managedIds = $user->getManagedUserIds();
            $query->where(function ($q) use ($user, $managedIds) {
                $q->where(function ($q2) use ($managedIds) {
                    $q2->where('owner_type', 'admin_pool')
                       ->where(function ($q3) use ($managedIds) {
                           $q3->whereIn('created_by_super_agent_id', $managedIds)
                              ->orWhereIn('submitted_by_agent_id', $managedIds)
                              ->orWhereIn('submitted_by_enumerator_id', $managedIds)
                              ->orWhereIn('assigned_agent_id', $managedIds)
                              ->orWhereIn('assigned_super_agent_id', $managedIds)
                              ->orWhereIn('assigned_admin_id', $managedIds);
                       });
                })
                ->orWhere('assigned_admin_id', $user->id)
                ->orWhere('wa_handler_admin_id', $user->id);
            });
            return $query;
        }

        if ($user->isSuperAgent()) {
            return $query->visibleToSuperAgent($user->id);
        }

        if ($user->isAgent()) {
            return $query->visibleToAgent($user->id);
        }

        if ($user->isEnumerator()) {
            return $query->where('submitted_by_enumerator_id', $user->id);
        }

        return $query->where('id', '<', 0);
    }

    // ─── 1. Existing Summary (kept intact) ───────────────────────────────────

    public function getSummary(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $this->getScopedLeadQuery($user);

        $totalLeads      = (clone $query)->count();
        $disbursed       = (clone $query)->whereIn('status', self::DISBURSED_STATUSES)->count();
        $notProceeded    = (clone $query)->whereIn('status', self::REJECTED_STATUSES)->count();
        $signaturePending= (clone $query)->whereNull('consumer_signature_path')->count();

        $bankStats = (clone $query)
            ->whereNotNull('beneficiary_bank_name')
            ->select('beneficiary_bank_name',
                DB::raw('SUM(CASE WHEN status IN ("' . implode('","', self::DISBURSED_STATUSES) . '") THEN 1 ELSE 0 END) as disbursed_count'),
                DB::raw('SUM(CASE WHEN status IN ("' . implode('","', self::REJECTED_STATUSES) . '") THEN 1 ELSE 0 END) as rejected_count')
            )
            ->groupBy('beneficiary_bank_name')
            ->get();

        $topPerformingBank = $bankStats->sortByDesc('disbursed_count')->first();
        $nonPerformingBank = $bankStats->sortByDesc('rejected_count')->first();

        return response()->json([
            'success' => true,
            'data' => [
                'total_leads'          => $totalLeads,
                'disbursed'            => $disbursed,
                'not_proceeded'        => $notProceeded,
                'signature_pending'    => $signaturePending,
                'top_performing_bank'  => $topPerformingBank?->beneficiary_bank_name ?? 'N/A',
                'non_performing_bank'  => $nonPerformingBank?->beneficiary_bank_name ?? 'N/A',
            ]
        ]);
    }

    // ─── 2. Existing Leads drill-down (kept intact) ───────────────────────────

    public function getLeads(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $this->getScopedLeadQuery($user);

        $filter = $request->query('filter', 'all');

        if ($filter === 'disbursed') {
            $query->whereIn('status', self::DISBURSED_STATUSES);
        } elseif ($filter === 'not_proceeded') {
            $query->whereIn('status', self::REJECTED_STATUSES);
        } elseif ($filter === 'signature_pending') {
            $query->whereNull('consumer_signature_path');
        }

        $perPage = $request->query('per_page', 15);

        $leads = $query->select([
            'id', 'beneficiary_name', 'beneficiary_bank_name', 'beneficiary_bank_account',
            'status', 'consumer_signature_path', 'created_at'
        ])
        ->orderBy('created_at', 'desc')
        ->paginate($perPage);

        $leads->getCollection()->transform(function ($lead) {
            $lead->masked_account = $this->maskAccount($lead->beneficiary_bank_account);
            $lead->has_signature  = !empty($lead->consumer_signature_path);
            return $lead;
        });

        return response()->json([
            'success' => true,
            'data'    => $leads
        ]);
    }

    // ─── 3. NEW: Bank-Aggregated Table (Admin / Super Admin) ─────────────────

    public function getBankAggregatedTable(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = $this->getScopedLeadQuery($user);

        // Apply date filters
        if ($request->filled('date_from')) {
            $query->whereDate('leads.created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('leads.created_at', '<=', $request->date_to);
        }

        // Apply bank name filter
        if ($request->filled('bank_name')) {
            $query->where('beneficiary_bank_name', $request->bank_name);
        }

        // Only leads with a bank name
        $query->whereNotNull('beneficiary_bank_name');

        $submittedList  = implode('","', self::BANK_SUBMITTED_STATUSES);
        $disbursedList  = implode('","', self::DISBURSED_STATUSES);
        $pendingList    = implode('","', self::BANK_PENDING_STATUSES);
        $rejectedList   = implode('","', self::REJECTED_STATUSES);

        $rows = $query->select([
            'beneficiary_bank_name',
            DB::raw('MAX(beneficiary_bank_ifsc) as ifsc_sample'),
            DB::raw('COUNT(*) as total_leads'),
            DB::raw('SUM(CASE WHEN status IN ("' . $submittedList . '") THEN 1 ELSE 0 END) as leads_submitted'),
            DB::raw('SUM(CASE WHEN status IN ("' . $disbursedList . '") THEN 1 ELSE 0 END) as leads_disbursed'),
            DB::raw('SUM(CASE WHEN status IN ("' . $pendingList . '") AND updated_at <= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as leads_pending_gt7'),
            DB::raw('SUM(CASE WHEN status IN ("' . $rejectedList . '") THEN 1 ELSE 0 END) as leads_rejected'),
        ])
        ->groupBy('beneficiary_bank_name')
        ->orderByDesc('total_leads')
        ->get()
        ->map(function ($row) {
            $submitted = (int) $row->leads_submitted;
            $disbursed = (int) $row->leads_disbursed;
            $row->success_rate = $submitted > 0
                ? round(($disbursed / $submitted) * 100, 1)
                : 0;
            return $row;
        });

        // Overall KPI summary
        $totalBanks     = $rows->count();
        $totalSubmitted = $rows->sum('leads_submitted');
        $totalDisbursed = $rows->sum('leads_disbursed');
        $totalPendingGt7= $rows->sum('leads_pending_gt7');
        $totalRejected  = $rows->sum('leads_rejected');
        $totalLeads     = $rows->sum('total_leads');

        return response()->json([
            'success' => true,
            'data'    => [
                'summary' => [
                    'total_banks'       => $totalBanks,
                    'total_leads'       => $totalLeads,
                    'total_submitted'   => $totalSubmitted,
                    'total_disbursed'   => $totalDisbursed,
                    'total_pending_gt7' => $totalPendingGt7,
                    'total_rejected'    => $totalRejected,
                ],
                'rows' => $rows,
            ]
        ]);
    }

    // ─── 4. NEW: Lead-Level Table (Super Agent / Agent / Enumerator) ──────────

    public function getBankLeadTable(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = $this->getScopedLeadQuery($user);

        // Only leads that have entered the banking pipeline
        $allBankStatuses = array_merge(
            self::BANK_SUBMITTED_STATUSES,
            self::DISBURSED_STATUSES,
            self::REJECTED_STATUSES
        );
        $query->whereIn('status', array_unique($allBankStatuses));

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('bank_name')) {
            $query->where('beneficiary_bank_name', $request->bank_name);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->filled('search')) {
            $s = '%' . str_replace(['%','_'], ['\%','\_'], $request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('beneficiary_name', 'like', $s)
                  ->orWhere('consumer_number', 'like', $s);
            });
        }

        $perPage = min((int) $request->input('per_page', 15), 100);

        $leads = $query->select([
            'id', 'ulid', 'beneficiary_name', 'consumer_number',
            'beneficiary_bank_name', 'beneficiary_bank_branch',
            'beneficiary_bank_account', 'beneficiary_bank_ifsc',
            'status', 'created_at', 'updated_at',
        ])
        ->orderBy('updated_at', 'desc')
        ->paginate($perPage);

        $leads->getCollection()->transform(function ($lead) {
            $lead->masked_account = $this->maskAccount($lead->beneficiary_bank_account);
            $lead->status_label   = $this->statusLabel($lead->status);
            $lead->pipeline_stage = $this->pipelineStage($lead->status);
            $lead->days_in_status = now()->diffInDays($lead->updated_at);
            $lead->is_stalled     = in_array($lead->status, self::BANK_PENDING_STATUSES)
                                     && $lead->days_in_status > 7;
            // Don't expose raw account
            unset($lead->beneficiary_bank_account);
            return $lead;
        });

        return response()->json([
            'success' => true,
            'data'    => $leads
        ]);
    }

    // ─── 5. NEW: Filter Options ───────────────────────────────────────────────

    public function getBankFilterOptions(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = $this->getScopedLeadQuery($user);

        $banks = $query
            ->whereNotNull('beneficiary_bank_name')
            ->select('beneficiary_bank_name')
            ->distinct()
            ->orderBy('beneficiary_bank_name')
            ->pluck('beneficiary_bank_name');

        return response()->json([
            'success' => true,
            'data'    => [
                'banks'    => $banks,
                'statuses' => array_unique(array_merge(
                    self::BANK_SUBMITTED_STATUSES,
                    self::DISBURSED_STATUSES,
                    self::REJECTED_STATUSES
                )),
            ]
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function maskAccount(?string $account): string
    {
        if (!$account || strlen($account) < 4) return 'N/A';
        return str_repeat('*', max(0, strlen($account) - 4)) . substr($account, -4);
    }

    private function statusLabel(?string $status): string
    {
        if (!$status) return 'Unknown';
        $enum = LeadStatus::tryFrom($status);
        return $enum ? $enum->label() : str_replace('_', ' ', ucwords(strtolower($status), '_'));
    }

    private function pipelineStage(?string $status): string
    {
        if (in_array($status, self::REJECTED_STATUSES))      return 'Rejected';
        if (in_array($status, self::DISBURSED_STATUSES))     return 'Complete';
        if (in_array($status, self::BANK_PENDING_STATUSES))  return 'Pending at Bank';
        if (in_array($status, self::BANK_SUBMITTED_STATUSES))return 'Submitted';
        return 'Other';
    }
}
