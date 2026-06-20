<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use NotificationChannels\WebPush\HasPushSubscriptions;

/**
 * @property int $id
 * @property string $name
 * @property string|null $father_name
 * @property \Illuminate\Support\Carbon|null $dob
 * @property string|null $gender
 * @property string|null $blood_group
 * @property string|null $religion
 * @property string|null $marital_status
 * @property string|null $email
 * @property string|null $mobile
 * @property string|null $password
 * @property string $role
 * @property string $status
 * @property float|int $wallet_balance
 * @property \Illuminate\Support\Carbon|null $approved_at
 * @property string|null $agent_id
 * @property string|null $super_agent_code
 * @property int|null $super_agent_id
 * @property int|null $created_by_super_agent_id
 * @property array<array-key, mixed>|null $managed_states
 * @property string|null $district
 * @property string|null $state
 * @property string|null $area
 * @property string|null $permanent_address
 * @property string|null $current_address
 * @property string|null $pincode
 * @property string|null $landmark
 * @property string|null $aadhaar_number
 * @property string|null $aadhaar_document
 * @property string|null $pan_number
 * @property string|null $pan_document
 * @property string|null $voter_id
 * @property string|null $bank_name
 * @property string|null $bank_account_number
 * @property string|null $bank_ifsc
 * @property string|null $bank_branch
 * @property string|null $upi_id
 * @property string|null $upi_id
 * @property string|null $occupation
 * @property string|null $qualification
 * @property string|null $education_level
 * @property string|null $education_cert
 * @property string|null $resume
 * @property string|null $mou_signed
 * @property int|null $experience_years
 * @property array<array-key, mixed>|null $languages_known
 * @property string|null $reference_name
 * @property string|null $reference_mobile
 * @property string|null $territory
 * @property int|null $target_monthly
 * @property string|null $profile_photo
 * @property string|null $signature_image
 * @property \Illuminate\Support\Carbon|null $last_login_at
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property int|null $approved_by
 * @property string|null $letter_number
 * @property string|null $qr_token
 * @property string|null $qr_generated_at
 * @property string|null $last_verified_at
 * @property int $scan_count
 * @property \Illuminate\Support\Carbon|null $joining_date
 * @property string|null $joining_letter_valid_until
 * @property string|null $joining_letter_revoked_at
 * @property int|null $created_by_agent_id
 * @property array|null $permissions
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Lead> $assignedLeads
 * @property-read int|null $assigned_leads_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Lead> $assignedSuperAgentLeads
 * @property-read int|null $assigned_super_agent_leads_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Commission> $commissions
 * @property-read int|null $commissions_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, User> $createdAgents
 * @property-read int|null $created_agents_count
 * @property-read User|null $createdBySuperAgent
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Lead> $createdLeads
 * @property-read int|null $created_leads_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Lead> $enumeratorLeads
 * @property-read int|null $enumerator_leads_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, User> $enumerators
 * @property-read int|null $enumerators_count
 * @property-read int $profile_completion
 * @property-read string|null $profile_photo_url
 * @property-read \Illuminate\Database\Eloquent\Collection<int, User> $managedAgents
 * @property-read int|null $managed_agents_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Notification> $notifications
 * @property-read int|null $notifications_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Commission> $overrideCommissions
 * @property-read int|null $override_commissions_count
 * @property-read User|null $parentAgent
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\QrScanLog> $qrScanLogs
 * @property-read int|null $qr_scan_logs_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Lead> $submittedLeads
 * @property-read int|null $submitted_leads_count
 * @property-read User|null $superAgent
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \Laravel\Sanctum\PersonalAccessToken> $tokens
 * @property-read int|null $tokens_count
 * @method static Builder<static>|User active()
 * @method static Builder<static>|User admins()
 * @method static Builder<static>|User agents()
 * @method static Builder<static>|User enumerators()
 * @method static \Database\Factories\UserFactory factory($count = null, $state = [])
 * @method static Builder<static>|User newModelQuery()
 * @method static Builder<static>|User newQuery()
 * @method static Builder<static>|User onlyTrashed()
 * @method static Builder<static>|User query()
 * @method static Builder<static>|User superAgents()
 * @method static Builder<static>|User whereAadhaarDocument($value)
 * @method static Builder<static>|User whereAadhaarNumber($value)
 * @method static Builder<static>|User whereAgentId($value)
 * @method static Builder<static>|User whereApprovedAt($value)
 * @method static Builder<static>|User whereApprovedBy($value)
 * @method static Builder<static>|User whereArea($value)
 * @method static Builder<static>|User whereBankAccountNumber($value)
 * @method static Builder<static>|User whereBankBranch($value)
 * @method static Builder<static>|User whereBankIfsc($value)
 * @method static Builder<static>|User whereBankName($value)
 * @method static Builder<static>|User whereBloodGroup($value)
 * @method static Builder<static>|User whereCreatedAt($value)
 * @method static Builder<static>|User whereCreatedByAgentId($value)
 * @method static Builder<static>|User whereCreatedBySuperAgentId($value)
 * @method static Builder<static>|User whereCurrentAddress($value)
 * @method static Builder<static>|User whereDeletedAt($value)
 * @method static Builder<static>|User whereDistrict($value)
 * @method static Builder<static>|User whereDob($value)
 * @method static Builder<static>|User whereEducationCert($value)
 * @method static Builder<static>|User whereEducationLevel($value)
 * @method static Builder<static>|User whereEmail($value)
 * @method static Builder<static>|User whereEmailVerifiedAt($value)
 * @method static Builder<static>|User whereExperienceYears($value)
 * @method static Builder<static>|User whereFatherName($value)
 * @method static Builder<static>|User whereGender($value)
 * @method static Builder<static>|User whereId($value)
 * @method static Builder<static>|User whereJoiningDate($value)
 * @method static Builder<static>|User whereJoiningLetterRevokedAt($value)
 * @method static Builder<static>|User whereJoiningLetterValidUntil($value)
 * @method static Builder<static>|User whereLandmark($value)
 * @method static Builder<static>|User whereLanguagesKnown($value)
 * @method static Builder<static>|User whereLastLoginAt($value)
 * @method static Builder<static>|User whereLastVerifiedAt($value)
 * @method static Builder<static>|User whereLetterNumber($value)
 * @method static Builder<static>|User whereManagedStates($value)
 * @method static Builder<static>|User whereMaritalStatus($value)
 * @method static Builder<static>|User whereMobile($value)
 * @method static Builder<static>|User whereMouSigned($value)
 * @method static Builder<static>|User whereName($value)
 * @method static Builder<static>|User whereOccupation($value)
 * @method static Builder<static>|User wherePanDocument($value)
 * @method static Builder<static>|User wherePanNumber($value)
 * @method static Builder<static>|User wherePassword($value)
 * @method static Builder<static>|User wherePermanentAddress($value)
 * @method static Builder<static>|User wherePincode($value)
 * @method static Builder<static>|User whereProfilePhoto($value)
 * @method static Builder<static>|User whereQrGeneratedAt($value)
 * @method static Builder<static>|User whereQrToken($value)
 * @method static Builder<static>|User whereQualification($value)
 * @method static Builder<static>|User whereReferenceMobile($value)
 * @method static Builder<static>|User whereReferenceName($value)
 * @method static Builder<static>|User whereReligion($value)
 * @method static Builder<static>|User whereRememberToken($value)
 * @method static Builder<static>|User whereResume($value)
 * @method static Builder<static>|User whereRole($value)
 * @method static Builder<static>|User whereScanCount($value)
 * @method static Builder<static>|User whereSignatureImage($value)
 * @method static Builder<static>|User whereState($value)
 * @method static Builder<static>|User whereStatus($value)
 * @method static Builder<static>|User whereSuperAgentCode($value)
 * @method static Builder<static>|User whereSuperAgentId($value)
 * @method static Builder<static>|User whereTargetMonthly($value)
 * @method static Builder<static>|User whereTerritory($value)
 * @method static Builder<static>|User whereUpdatedAt($value)
 * @method static Builder<static>|User whereUpiId($value)
 * @method static Builder<static>|User withTrashed(bool $withTrashed = true)
 * @method static Builder<static>|User withoutTrashed()
 */
class User extends Authenticatable implements \Illuminate\Contracts\Auth\MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, HasPushSubscriptions;

    const ROLE_ADMIN = 'admin';
    const ROLE_SUPER_ADMIN = 'super_admin';
    const ROLE_SUPER_AGENT = 'super_agent';
    const ROLE_AGENT = 'agent';
    const ROLE_ENUMERATOR = 'enumerator';
    const ROLE_OPERATOR = 'operator';
    const ROLE_FIELD_TECHNICAL_TEAM = 'field_technical_team';

    protected $fillable = [
        'name', 'father_name', 'dob', 'blood_group', 'email', 'mobile', 'password',
        'district', 'state', 'area', 'aadhaar_number',
        'occupation', 'profile_photo', 'religion', 'gender', 'marital_status',
        'permanent_address', 'current_address', 'pincode', 'landmark',
        'pan_number', 'voter_id', 'bank_name', 'bank_account_number',
        'bank_ifsc', 'bank_branch', 'upi_id', 'qualification', 'experience_years',
        'languages_known', 'reference_name', 'reference_mobile', 'territory',
        'target_monthly', 'letter_number', 'joining_date', 'signature_image',
        'aadhaar_document', 'pan_document', 'education_level', 'education_cert',
        'resume', 'mou_signed', 'super_agent_id', 'created_by_super_agent_id',
        'created_by_agent_id', 'enumerator_id', 'enumerator_creator_role',
        'offer_point_threshold',
        'parent_id', 'permissions', 'role', 'status', 'technician_type',
        'lead_id', // Consumer portal: links consumer account to their lead
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if (! $user->qr_token) {
                $user->qr_token = bin2hex(random_bytes(16));
            }
        });

        static::saving(function ($user) {
            if ($user->role === self::ROLE_ENUMERATOR && $user->status === 'active' && !$user->enumerator_id) {
                $user->enumerator_id = app(\App\Services\AgentService::class)->generateEnumeratorId();
            }
        });
    }


    protected $appends = ['profile_photo_url', 'profile_completion', 'code'];

    protected $hidden = [
        'password', 'remember_token', 'aadhaar_number', 'bank_account_number',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'approved_at' => 'datetime',
            'dob' => 'date',
            'joining_date' => 'date',
            'password' => 'hashed',
            'aadhaar_number' => 'encrypted',
            'bank_account_number' => 'encrypted',
            'managed_states' => 'array',
            'languages_known' => 'array',
            'permissions' => 'array',
        ];
    }

    // ====== Accessors ======

    public function getProfilePhotoUrlAttribute(): ?string
    {
        if (! $this->profile_photo) {
            return null;
        }

        if (filter_var($this->profile_photo, FILTER_VALIDATE_URL)) {
            return $this->profile_photo;
        }

        return url('storage/'.$this->profile_photo);
    }

    public function getCodeAttribute(): ?string
    {
        return match ($this->role) {
            'super_agent' => $this->super_agent_code,
            'agent' => $this->agent_id,
            'enumerator' => $this->enumerator_id,
            default => null,
        };
    }

    /**
     * Calculate profile completion percentage.
     *
     * Encrypted fields (aadhaar_number, bank_account_number) are read inside
     * a try-catch to gracefully handle legacy rows that were stored as plain
     * text before the encryption cast was applied. Without this guard, any
     * such row will throw a DecryptException when Eloquent serialises the
     * model, producing a 500 on every endpoint that returns User collections.
     */
    public function getProfileCompletionAttribute(): int
    {
        $fields = [
            'father_name', 'dob', 'blood_group', 'email', 'mobile',
            'state', 'district', 'area', 'aadhaar_number',
            'occupation', 'religion', 'gender', 'marital_status',
            'permanent_address', 'current_address', 'pincode',
            'pan_number', 'voter_id',
            'bank_name', 'bank_account_number', 'bank_ifsc', 'bank_branch',
            'qualification', 'experience_years', 'languages_known',
            'reference_name', 'reference_mobile', 'territory',
            'profile_photo', 'signature_image',
        ];

        $completed = 0;
        foreach ($fields as $field) {
            try {
                if (! empty($this->{$field})) {
                    $completed++;
                }
            } catch (\Throwable $e) {
                // Encrypted field could not be decrypted (legacy plain-text value).
                // Treat the field as filled so it does not block profile completion.
                $completed++;
            }
        }

        return (int) round(($completed / count($fields)) * 100);
    }

    // ====== Relationships ======

    /** Agent → their assigned Super Agent */
    public function superAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'super_agent_id');
    }

    /** The immediate parent in the hierarchy (Admin <- SA <- Agent <- Enum) */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    /** All users that have this user as their immediate parent */
    public function children(): HasMany
    {
        return $this->hasMany(User::class, 'parent_id');
    }

    /** Super Agent → all agents assigned to them */
    public function managedAgents(): HasMany
    {
        return $this->hasMany(User::class, 'super_agent_id');
    }

    /** Super Agent → agents they originally created */
    public function createdAgents(): HasMany
    {
        return $this->hasMany(User::class, 'created_by_super_agent_id');
    }

    /** Super Agent → leads they created directly */
    public function createdLeads(): HasMany
    {
        return $this->hasMany(Lead::class, 'created_by_super_agent_id');
    }

    /** Agent → enumerators they created */
    public function enumerators(): HasMany
    {
        return $this->hasMany(User::class, 'created_by_agent_id');
    }

    /** Enumerator → the agent who created them */
    public function parentAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_agent_id');
    }

    /** Enumerator → leads they submitted */
    public function enumeratorLeads(): HasMany
    {
        return $this->hasMany(Lead::class, 'submitted_by_enumerator_id');
    }

    /** @return HasMany<Lead, $this> */
    public function assignedLeads(): HasMany
    {
        return $this->hasMany(Lead::class, 'assigned_agent_id');
    }

    public function assignedSuperAgentLeads(): HasMany
    {
        return $this->hasMany(Lead::class, 'assigned_super_agent_id');
    }

    public function submittedLeads(): HasMany
    {
        return $this->hasMany(Lead::class, 'submitted_by_agent_id');
    }

    /** @return HasMany<Commission, $this> */
    public function commissions(): HasMany
    {
        return $this->hasMany(Commission::class, 'payee_id')
            ->where(fn($q) => $q->where('payee_role', 'agent'));
    }

    public function enumeratorCommissions(): HasMany
    {
        return $this->hasMany(Commission::class, 'payee_id')
            ->where(fn($q) => $q->where('payee_role', 'enumerator'));
    }

    public function createdBySuperAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_super_agent_id');
    }

    /** @return HasMany<Commission, $this> */
    public function overrideCommissions(): HasMany
    {
        return $this->hasMany(Commission::class, 'payee_id')
            ->where(fn($q) => $q->where('payee_role', 'super_agent'));
    }

    /** @return HasMany<Notification, $this> */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /** @return HasMany<QrScanLog, $this> */
    public function qrScanLogs(): HasMany
    {
        return $this->hasMany(QrScanLog::class);
    }

    // ====== Query Scopes ======

    public function scopeRoleAdmin(Builder $query): Builder
    {
        return $query->where(fn ($q) => $q->where('role', 'admin'));
    }

    public function scopeRoleSuperAgent(Builder $query): Builder
    {
        return $query->where(fn ($q) => $q->where('role', 'super_agent'));
    }

    public function scopeRoleAgent(Builder $query): Builder
    {
        return $query->where(fn ($q) => $q->where('role', 'agent'));
    }

    public function scopeRoleEnumerator(Builder $query): Builder
    {
        return $query->where(fn ($q) => $q->where('role', 'enumerator'));
    }

    public function scopeRoleFieldTechnicalTeam(Builder $query): Builder
    {
        return $query->where(fn ($q) => $q->where('role', 'field_technical_team'));
    }

    public function scopeRoleSuperAdmin(Builder $query): Builder
    {
        return $query->where(fn ($q) => $q->where('role', 'super_admin'));
    }

    public function scopeOperators(Builder $query): Builder
    {
        return $query->where(fn ($q) => $q->where('role', 'operator'));
    }

    public function scopeAdmins(Builder $query): Builder
    {
        return $query->whereIn('role', ['admin', 'super_admin']);
    }

    public function scopeSuperAgents(Builder $query): Builder
    {
        return $this->scopeRoleSuperAgent($query);
    }

    public function scopeAgents(Builder $query): Builder
    {
        return $this->scopeRoleAgent($query);
    }

    public function scopeEnumerators(Builder $query): Builder
    {
        return $this->scopeRoleEnumerator($query);
    }

    public function scopeSuperAdmins(Builder $query): Builder
    {
        return $this->scopeRoleSuperAdmin($query);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where(fn ($q) => $q->where('status', 'active'));
    }

    // ====== Helper Methods ======

    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'super_admin']);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isSuperAgent(): bool
    {
        return $this->role === 'super_agent';
    }

    public function isAgent(): bool
    {
        return $this->role === 'agent';
    }

    public function isEnumerator(): bool
    {
        return $this->role === 'enumerator';
    }

    public function isOperator(): bool
    {
        return $this->role === 'operator';
    }

    public function isFieldTechnician(): bool
    {
        return $this->role === 'field_technical_team';
    }

    public function isConsumer(): bool
    {
        return $this->role === 'consumer';
    }

    public function hasAssignedSuperAgent(): bool
    {
        return ! is_null($this->super_agent_id);
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if (! is_array($this->permissions)) {
            return false;
        }

        return in_array($permission, $this->permissions) || in_array('*', $this->permissions);
    }

    /**
     * Get the full hierarchy chain upwards (recursive)
     * Returns: [self, parent, grandparent, ..., Admin]
     */
    public function hierarchyChain(): array
    {
        $chain = [$this];
        $current = $this;

        while ($current->parent_id && $current->id !== $current->parent_id) {
            $parent = User::find($current->parent_id);
            if (! $parent) {
                break;
            }
            $chain[] = $parent;
            $current = $parent;
            
            // Safety break for deep hierarchies
            if (count($chain) > 10) break;
        }

        return $chain;
    }

    /**
     * Get the ID of the root Admin for this user by traversing the hierarchy.
     * Returns null if no Admin is found or if the user is a Super Admin.
     */
    public function getRootAdminId(): ?int
    {
        if ($this->isSuperAdmin()) {
            return null;
        }

        if ($this->isAdmin()) {
            return $this->id;
        }

        // 1. Try recursive parent traversal first
        $chain = $this->hierarchyChain();
        foreach ($chain as $userObj) {
            if ($userObj->isAdmin() && !$userObj->isSuperAdmin()) {
                return $userObj->id;
            }
        }

        // 2. Fallback: Check direct relationship columns if parent_id chain is broken
        // This handles cases where parent_id wasn't set during creation or approval
        $relatedIds = array_filter([
            $this->parent_id,
            $this->super_agent_id,
            $this->created_by_super_agent_id,
            $this->created_by_agent_id
        ]);

        foreach ($relatedIds as $id) {
            $relatedUser = User::find($id);
            if ($relatedUser) {
                $rootId = $relatedUser->getRootAdminId();
                if ($rootId) return $rootId;
            }
        }

        return null;
    }

    /**
     * Get all user IDs within this user's team hierarchy (recursive).
     * Works for Admins to find all their team members.
     * Uses MariaDB Recursive CTE for performance.
     */
    public function getManagedUserIds(): array
    {
        $userId = (int) $this->id;
        if ($this->isOperator() && $this->parent_id) {
            $userId = (int) $this->parent_id;
        }
        
        $results = DB::select("
            WITH RECURSIVE team_hierarchy AS (
                SELECT id FROM users WHERE id = :start_id
                UNION ALL
                SELECT u.id FROM users u
                INNER JOIN team_hierarchy th ON u.parent_id = th.id
                WHERE u.deleted_at IS NULL
            )
            SELECT id FROM team_hierarchy
        ", ['start_id' => $userId]);

        $idCol = 'id';
        return array_column($results, $idCol);
    }
}
