<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $ulid
 * @property string $source
 * @property string|null $referral_agent_id
 * @property int|null $assigned_agent_id
 * @property int|null $assigned_super_agent_id
 * @property int|null $submitted_by_agent_id
 * @property int|null $created_by_super_agent_id
 * @property string $owner_type
 * @property string $verification_status
 * @property int $revert_count
 * @property string|null $revert_reason
 * @property int|null $verified_by_super_agent_id
 * @property \Illuminate\Support\Carbon|null $verified_at
 * @property \Illuminate\Support\Carbon|null $reverted_at
 * @property int|null $reverted_by
 * @property string $beneficiary_name
 * @property string $beneficiary_mobile
 * @property string|null $beneficiary_email
 * @property string $beneficiary_state
 * @property string $beneficiary_district
 * @property string|null $beneficiary_address
 * @property string|null $beneficiary_pincode
 * @property string|null $consumer_number
 * @property string|null $discom_name
 * @property string|null $roof_size
 * @property string|null $system_capacity
 * @property float|int|null $monthly_bill_amount
 * @property string|null $status
 * @property string $commission_entry_status
 * @property string|null $query_message
 * @property string|null $admin_notes
 * @property \Illuminate\Support\Carbon|null $follow_up_date
 * @property string|null $govt_application_number
 * @property string|null $rejection_reason
 * @property float|int|null $commission_amount
 * @property bool $commission_paid
 * @property \Illuminate\Support\Carbon|null $commission_paid_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property int|null $submitted_by_enumerator_id
 * @property-read \App\Models\User|null $assignedAgent
 * @property-read \App\Models\User|null $assignedSuperAgent
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Commission> $commissions
 * @property-read int|null $commissions_count
 * @property-read \App\Models\User|null $createdBySuperAgent
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\LeadDocument> $documents
 * @property-read int|null $documents_count
 * @property-read array $formatted_commissions
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\LeadStatusLog> $statusLogs
 * @property-read int|null $status_logs_count
 * @property-read \App\Models\User|null $submittedByAgent
 * @property-read \App\Models\User|null $submittedByEnumerator
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\LeadVerification> $verifications
 * @property-read int|null $verifications_count
 * @property-read \App\Models\User|null $verifiedBySuperAgent
 * @method static Builder<static>|Lead needsVerificationBySuperAgent(int $superAgentId)
 * @method static Builder<static>|Lead newModelQuery()
 * @method static Builder<static>|Lead newQuery()
 * @method static Builder<static>|Lead onlyTrashed()
 * @method static Builder<static>|Lead query()
 * @method static Builder<static>|Lead visibleToAgent(int $agentId)
 * @method static Builder<static>|Lead visibleToSuperAgent(int $superAgentId)
 * @method static Builder<static>|Lead whereAdminNotes($value)
 * @method static Builder<static>|Lead whereAssignedAgentId($value)
 * @method static Builder<static>|Lead whereAssignedSuperAgentId($value)
 * @method static Builder<static>|Lead whereBeneficiaryAddress($value)
 * @method static Builder<static>|Lead whereBeneficiaryDistrict($value)
 * @method static Builder<static>|Lead whereBeneficiaryEmail($value)
 * @method static Builder<static>|Lead whereBeneficiaryMobile($value)
 * @method static Builder<static>|Lead whereBeneficiaryName($value)
 * @method static Builder<static>|Lead whereBeneficiaryPincode($value)
 * @method static Builder<static>|Lead whereBeneficiaryState($value)
 * @method static Builder<static>|Lead whereBeneficiaryWhatsapp($value)
 * @method static Builder<static>|Lead whereCommissionAmount($value)
 * @method static Builder<static>|Lead whereCommissionEntryStatus($value)
 * @method static Builder<static>|Lead whereCommissionPaid($value)
 * @method static Builder<static>|Lead whereCommissionPaidAt($value)
 * @method static Builder<static>|Lead whereConsumerNumber($value)
 * @method static Builder<static>|Lead whereCreatedAt($value)
 * @method static Builder<static>|Lead whereCreatedBySuperAgentId($value)
 * @method static Builder<static>|Lead whereDeletedAt($value)
 * @method static Builder<static>|Lead whereDiscomName($value)
 * @method static Builder<static>|Lead whereFollowUpDate($value)
 * @method static Builder<static>|Lead whereGovtApplicationNumber($value)
 * @method static Builder<static>|Lead whereId($value)
 * @method static Builder<static>|Lead whereMonthlyBillAmount($value)
 * @method static Builder<static>|Lead whereOwnerType($value)
 * @method static Builder<static>|Lead whereQueryMessage($value)
 * @method static Builder<static>|Lead whereReferralAgentId($value)
 * @method static Builder<static>|Lead whereRejectionReason($value)
 * @method static Builder<static>|Lead whereRevertCount($value)
 * @method static Builder<static>|Lead whereRevertReason($value)
 * @method static Builder<static>|Lead whereRevertedAt($value)
 * @method static Builder<static>|Lead whereRevertedBy($value)
 * @method static Builder<static>|Lead whereRoofSize($value)
 * @method static Builder<static>|Lead whereSource($value)
 * @method static Builder<static>|Lead whereStatus($value)
 * @method static Builder<static>|Lead whereSubmittedByAgentId($value)
 * @method static Builder<static>|Lead whereSubmittedByEnumeratorId($value)
 * @method static Builder<static>|Lead whereSystemCapacity($value)
 * @method static Builder<static>|Lead whereUlid($value)
 * @method static Builder<static>|Lead whereUpdatedAt($value)
 * @method static Builder<static>|Lead whereVerificationStatus($value)
 * @method static Builder<static>|Lead whereVerifiedAt($value)
 * @method static Builder<static>|Lead whereVerifiedBySuperAgentId($value)
 * @method static Builder<static>|Lead withTrashed(bool $withTrashed = true)
 */
class Lead extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ulid',
        'source',
        'referral_agent_id',
        'category',
        'beneficiary_name',
        'beneficiary_mobile',
        'beneficiary_email',
        'beneficiary_state',
        'beneficiary_district',
        'beneficiary_address',
        'beneficiary_pincode',
        'consumer_number',
        'registration_number',
        'discom_name',
        'monthly_bill_amount',
        'roof_size',
        'system_capacity',
        'query_message',
        'admin_notes',
        'follow_up_date',
        'govt_application_number',
        'assigned_agent_id',
        'assigned_super_agent_id',
        'assigned_admin_id',
        'assigned_surveyor_id',
        'assigned_installer_id',
        'submitted_by_agent_id',
        'created_by_super_agent_id',
        'submitted_by_enumerator_id',
        'owner_type',
        'verification_status',
        'revert_count',
        'revert_reason',
        'verified_by_super_agent_id',
        'verified_at',
        'reverted_at',
        'reverted_by',
        // Billing / Invoice fields
        'bill_serial',
        'bill_date',
        'system_item',
        'system_make',
        'quotation_serial',
        'receipt_serial',
        'quotation_base_amount',
        'quotation_gst_amount',
        'quotation_total_amount',
        'receipt_amount',
        'billing_items',
        'billing_gst_percentage',
        // Consumer signature document path (QW-1)
        'consumer_signature_path',
        // Beneficiary bank details (QW-2)
        'beneficiary_bank_account',
        'beneficiary_bank_ifsc',
        'beneficiary_bank_branch',
        'beneficiary_bank_name',
        // Consumer portal one-time password (cleared after first login)
        // Top-down Admin allocation
        'admin_received_commission',
        'admin_meeting_allowance',
        'admin_additional_expenses',
        'admin_other_expenses',
        'installation_data',
        'lead_revenue',
    ];

    protected function casts(): array
    {
        return [
            'follow_up_date' => 'date',
            'bill_date' => 'date',
            'commission_paid_at' => 'datetime',
            'commission_paid' => 'boolean',
            'verified_at' => 'datetime',
            'reverted_at' => 'datetime',
            'revert_count' => 'integer',
            'billing_items' => 'array',
            'billing_gst_percentage' => 'float',
            'admin_received_commission' => 'float',
            'admin_meeting_allowance' => 'float',
            'admin_additional_expenses' => 'float',
            'admin_other_expenses' => 'array',
            'installation_data' => 'array',
            'lead_revenue' => 'float',
        ];
    }

    // NOTE: 'commission_status' is intentionally NOT in $appends.
    // It calls CommissionService->getCommissionStatus() which fires hierarchy
    // DB queries for EVERY lead in a collection. Compute it only on-demand
    // in the single-lead show() response via AdminLeadController::updateStatus().
    protected $appends = [
        'formatted_commissions',
        'admin_net_earning',
    ];

    protected static function booted(): void
    {
        static::saving(function (Lead $lead) {
            if (empty($lead->lead_revenue) && $lead->system_capacity) {
                $kw = (float) filter_var($lead->system_capacity, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
                if ($kw > 0) {
                    $lead->lead_revenue = $kw * 10000;
                }
            }
            
            // BATCH 3.2: Automatically resolve and denormalize the top-level super agent owner for N+1 free queries
            if (empty($lead->ascendant_super_agent_id)) {
                $saId = $lead->assigned_super_agent_id ?? $lead->created_by_super_agent_id;
                
                if (!$saId) {
                    $agentId = $lead->assigned_agent_id ?? $lead->submitted_by_agent_id;
                    if ($agentId) {
                        $agent = User::find($agentId);
                        $saId = $agent?->parent_id;
                    }
                }
                
                if (!$saId && $lead->submitted_by_enumerator_id) {
                    $enumerator = User::find($lead->submitted_by_enumerator_id);
                    if ($enumerator) {
                        $parent = User::find($enumerator->parent_id);
                        $saId = $parent?->role === 'super_agent' ? $parent->id : $parent?->parent_id;
                    }
                }
                
                if ($saId) {
                    $lead->ascendant_super_agent_id = $saId;
                }
            }
        });
    }

    /**
     * Calculate Admin Net Earning:
     * (Received from Super Admin) - (Sum of downlines) - (Sum of Other Expenses)
     */
    public function getAdminNetEarningAttribute(): float
    {
        $received = ($this->admin_received_commission ?? 0) 
            + ($this->admin_meeting_allowance ?? 0) 
            + ($this->admin_additional_expenses ?? 0);

        // Calculate downlines
        $downlinePayouts = 0;
        if ($this->relationLoaded('commissions')) {
            $downlinePayouts = $this->commissions->sum('amount');
        }

        // Calculate other expenses
        $otherExpenses = 0;
        if (is_array($this->admin_other_expenses)) {
            foreach ($this->admin_other_expenses as $expense) {
                $otherExpenses += (float) ($expense['amount'] ?? 0);
            }
        }

        return $received - $downlinePayouts - $otherExpenses;
    }

    // ── Relationships ─────────────────────────────────────────────────

    public function assignedAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_agent_id');
    }

    public function assignedSuperAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_super_agent_id');
    }

    public function assignedAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_admin_id');
    }

    public function assignedSurveyor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_surveyor_id');
    }

    public function assignedInstaller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_installer_id');
    }

    public function submittedByAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_agent_id');
    }

    public function submittedByEnumerator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_enumerator_id');
    }

    public function createdBySuperAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_super_agent_id');
    }

    public function verifiedBySuperAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_super_agent_id');
    }

    /** @return HasMany */
    public function statusLogs(): HasMany
    {
        /** @var HasMany $relation */
        $relation = $this->hasMany(LeadStatusLog::class)->orderBy('created_at', 'desc');
        return $relation;
    }

    /** @return HasMany */
    public function documents(): HasMany
    {
        return $this->hasMany(LeadDocument::class);
    }

    /** @return HasMany */
    public function commissions(): HasMany
    {
        return $this->hasMany(Commission::class);
    }

    /** @return HasMany */
    public function verifications(): HasMany
    {
        /** @var HasMany $relation */
        $relation = $this->hasMany(LeadVerification::class)->orderBy('created_at', 'asc');
        return $relation;
    }

    /** @return HasMany */
    public function technicalVisits(): HasMany
    {
        return $this->hasMany(LeadTechnicalVisit::class);
    }

    public function inventoryItems(): HasMany
    {
        return $this->hasMany(LeadInventoryItem::class);
    }

    public function installationSubmissions(): HasMany
    {
        return $this->hasMany(InstallationSubmission::class)->with('installationDocuments')->orderBy('id', 'desc');
    }

    public function surveyRequirement(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(LeadSurveyRequirement::class);
    }

    // ── Helper Methods ────────────────────────────────────────────────

    public function isInAdminPool(): bool
    {
        return $this->owner_type === 'admin_pool';
    }

    public function isInSuperAgentPool(): bool
    {
        return $this->owner_type === 'super_agent_pool';
    }

    public function needsVerification(): bool
    {
        return in_array($this->verification_status, [
            'pending_super_agent_verification',
            'reverted_to_agent',
        ]);
    }

    public function isVerified(): bool
    {
        return in_array($this->verification_status, [
            'super_agent_verified',
            'not_required',
            'admin_override',
        ]);
    }

    public function hasReachedMaxReverts(): bool
    {
        return $this->revert_count >= 3;
    }

    // ── Query Scopes ──────────────────────────────────────────────────

    /**
     * Leads visible to a specific super agent:
     * Anyone in their hierarchy chain (recursive children of their children)
     */
    public function scopeVisibleToSuperAgent(Builder $q, int $superAgentId): Builder
    {
        return $q->where(function ($query) use ($superAgentId) {
            // Fast denormalized lookup
            $query->where('ascendant_super_agent_id', $superAgentId)
                  // Fallback for legacy leads that haven't been backfilled yet
                  ->orWhereNull('ascendant_super_agent_id')->where(function ($fallbackQ) use ($superAgentId) {
                      $fallbackQ->where('assigned_super_agent_id', $superAgentId)
                          ->orWhere('created_by_super_agent_id', $superAgentId)
                          ->orWhereHas('submittedByAgent', function ($q2) use ($superAgentId) {
                              $q2->where('parent_id', $superAgentId);
                          })
                          ->orWhereHas('assignedAgent', function ($q2) use ($superAgentId) {
                              $q2->where('parent_id', $superAgentId);
                          })
                          ->orWhereHas('submittedByEnumerator', function ($q2) use ($superAgentId) {
                              $q2->whereHas('parent', fn($q3) => $q3->where('parent_id', $superAgentId))
                                  ->orWhere('parent_id', $superAgentId);
                          });
                  });
        });
    }

    /**
     * Leads that need verification by a specific super agent:
     * pending AND (assigned to SA, OR submitted by their team agent, OR submitted by their direct enumerator)
     */
    public function scopeNeedsVerificationBySuperAgent(Builder $q, int $superAgentId): Builder
    {
        return $q->where('verification_status', 'pending_super_agent_verification')
            ->where(function ($query) use ($superAgentId) {
                // Fast denormalized lookup
                $query->where('ascendant_super_agent_id', $superAgentId)
                      // Fallback for legacy leads
                      ->orWhereNull('ascendant_super_agent_id')->where(function ($fallbackQ) use ($superAgentId) {
                          $fallbackQ->where('assigned_super_agent_id', $superAgentId)
                              ->orWhere('created_by_super_agent_id', $superAgentId)
                              ->orWhereHas('submittedByAgent', function ($q2) use ($superAgentId) {
                                  $q2->where('parent_id', $superAgentId);
                              })
                              ->orWhereHas('submittedByEnumerator', function ($q2) use ($superAgentId) {
                                  $q2->where('parent_id', $superAgentId);
                              });
                      });
            });
    }

    /**
     * Leads visible to a specific agent:
     * submitted by them OR directly assigned to them
     */
    public function scopeVisibleToAgent(Builder $q, int $agentId): Builder
    {
        return $q->where(function ($query) use ($agentId) {
            $query->where(fn($q) => $q->where('submitted_by_agent_id', $agentId))
                ->orWhere(fn($q) => $q->where('assigned_agent_id', $agentId));
        });
    }

    /**
     * Leads visible to a specific field technician, filtered by pipeline status.
     *
     * Visibility rules:
     *  - Surveyor: sees the lead once it reaches REGISTERED (admin confirmed registration).
     *    Statuses before that (NEW, DOCUMENTS_FOR_REGISTRATION_COMPLETED, REJECTED) are hidden.
     *  - Installer: sees the lead once materials are being dispatched (DISPATCH_INITIATED).
     *    They should not see the lead during survey / banking / disbursement phases.
     */
    public function scopeVisibleToTechnician(Builder $q, int $technicianId): Builder
    {
        // Statuses at which a surveyor's lead becomes visible (REGISTERED and all subsequent)
        $surveyorVisibleStatuses = [
            'REGISTERED',
            'SURVEY_DONE',
            'LEAD_DOCUMENTS_PRINTED',
            'SIGNATURE_PENDING',
            'SIGNATURE_DONE',
            'FILE_DISBURSED',
            'DISBURSEMENT_VERIFIED',
            'DISPATCH_INITIATED',
            'IN_TRANSIT',
            'DELIVERED',
            'MATERIAL_VERIFIED_BY_CONSUMER',
            'INSTALLATION_SCHEDULED',
            'INSTALLATION_IN_PROGRESS',
            'SOLAR_INSTALLED',
            'POD_INSPECTION_INITIATED',
            'POD_REJECTED',
            'POD_SUCCESSFUL',
            'PROJECT_COMMISSIONING',
            'SUBSIDY_REQUEST',
            'SUBSIDY_DISBURSED',
            'LEAD_COMPLETED',
        ];

        // Statuses at which an installer's lead becomes visible (DISPATCH_INITIATED and all subsequent)
        $installerVisibleStatuses = [
            'DISPATCH_INITIATED',
            'IN_TRANSIT',
            'DELIVERED',
            'MATERIAL_VERIFIED_BY_CONSUMER',
            'INSTALLATION_SCHEDULED',
            'INSTALLATION_IN_PROGRESS',
            'SOLAR_INSTALLED',
            'POD_INSPECTION_INITIATED',
            'POD_REJECTED',
            'POD_SUCCESSFUL',
            'PROJECT_COMMISSIONING',
            'SUBSIDY_REQUEST',
            'SUBSIDY_DISBURSED',
            'LEAD_COMPLETED',
        ];

        return $q->where(function ($query) use ($technicianId, $surveyorVisibleStatuses, $installerVisibleStatuses) {
            // Surveyor: assigned + lead is at or past REGISTERED
            $query->where(function ($q) use ($technicianId, $surveyorVisibleStatuses) {
                $q->where('assigned_surveyor_id', $technicianId)
                  ->whereIn('status', $surveyorVisibleStatuses);
            })
            // Installer: assigned + lead is at or past DISPATCH_INITIATED
            ->orWhere(function ($q) use ($technicianId, $installerVisibleStatuses) {
                $q->where('assigned_installer_id', $technicianId)
                  ->whereIn('status', $installerVisibleStatuses);
            });
        });
    }

    // ── Virtual Attribute: formatted commissions ──────────────────────

    /**
     * Virtual attribute to provide formatted commissions for the frontend.
     */
    public function getFormattedCommissionsAttribute(): array
    {
        $commissions = $this->getRelationValue('commissions');

        $result = [
            'super_agent_commission' => null,
            'agent_commission' => null,
            'enumerator_commission' => null,
            'all' => []
        ];

        // Guard: if relation is not loaded or null, return empty structure
        if (!is_iterable($commissions)) {
            return $result;
        }

        foreach ($commissions as $c) {
            $formatted = $this->formatComm($c);
            $result['all'][] = $formatted;

            // Map to legacy keys for frontend compatibility
            if ($c->payee_role === 'super_agent') {
                $result['super_agent_commission'] = $formatted;
            } elseif ($c->payee_role === 'agent') {
                $result['agent_commission'] = $formatted;
            } elseif ($c->payee_role === 'enumerator') {
                $result['enumerator_commission'] = $formatted;
            }
        }

        return $result;
    }

    private function formatComm(Commission $c): array
    {
        return [
            'id' => $c->id,
            'amount' => (float) $c->amount,
            'payee_id' => $c->payee_id,
            'payee_role' => $c->payee_role,
            'payee_name' => $c->payee?->name ?? 'Unknown',
            'payee_code' => match ($c->payee_role) {
                'super_agent' => $c->payee?->super_agent_code ?? '',
                'agent' => $c->payee?->agent_id ?? '',
                'enumerator' => $c->payee?->enumerator_id ?? '',
                default => '',
            },
            'entered_by_name' => $c->enteredBy?->name ?? 'System',
            'payment_status' => $c->payment_status,
            'is_locked' => $c->isLocked(),
            'is_editable' => !$c->isLocked(),
        ];
    }

    /**
     * Unified commission status and prompts for the frontend.
     */
    public function getCommissionStatusAttribute(): array
    {
        // Guard: a lead with null status (e.g. legacy/seed data) would cause
        // PipelineService::positionOf(null) to throw a TypeError and crash any
        // endpoint that serialises Lead collections (e.g. admin dashboard stats).
        if ($this->status === null) {
            return [];
        }

        $prompts = app(\App\Services\CommissionService::class)->getCommissionStatus($this);
        $user = auth()->user();

        // Scope prompts to the current user (Payer). 
        // This ensures Admin only sees prompts where they pay BDM (super_agent),
        // Super Agent only sees prompts where they pay Agent/Enumerator, etc.
        if ($user) {
            $userId = (int) $user->id;
            $prompts = array_values(array_filter($prompts, function ($p) use ($userId, $user) {
                // Match by payer_id
                $payerId = (int) ($p['payer_id'] ?? 0);
                if ($payerId === $userId)
                    return true;

                // HIERARCHY OVERRIDE: Super Agent should see prompts for their team (Agent/Enumerator) 
                // even if they are not the immediate payer.
                if ($user->isSuperAgent()) {
                    $payee = User::find($p['payee_id']);
                    if ($payee && app(\App\Services\HierarchyService::class)->findAscendantSuperAgentId($payee) === $userId) {
                        return true;
                    }
                }

                // Admin sees any prompt where they are the logical payer (covers direct agents,
                // super agents, and enumerators that report straight to admin — e.g. referral leads).
                if ($user->isAdmin() || $user->isSuperAdmin()) {
                    return ($p['payer_role'] ?? '') === 'admin';
                }

                return false;
            }));
        }

        return [
            'prompts' => $prompts,
            'entry_status' => $this->commission_entry_status,
        ];
    }
}
