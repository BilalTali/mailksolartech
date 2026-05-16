<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Support\Facades\Cache;

/**
 * @property int $id
 * @property string $key
 * @property string|null $value
 * @property string|null $group
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Setting newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Setting newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Setting query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Setting whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Setting whereGroup($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Setting whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Setting whereKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Setting whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Setting whereValue($value)
 */
class Setting extends Model
{
    use HasFactory;

    protected $fillable = ['group', 'key', 'value', 'user_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public const MEDIA_KEYS = [
        'company_favicon',
        'company_logo',
        'company_logo_2',
        'company_signature',
        'official_signature',
        'company_seal',
        'hero_video'
    ];

    protected static function booted()
    {
        static::saved(function ($setting) {
            $userId = $setting->user_id ?? 'global';
            Cache::forget("settings.{$userId}." . $setting->key);
            self::clearApiCaches();
        });

        static::deleted(function ($setting) {
            $userId = $setting->user_id ?? 'global';
            Cache::forget("settings.{$userId}." . $setting->key);
            self::clearApiCaches();
        });
    }

    protected static function clearApiCaches()
    {
        // Settings govern the entire frontend and dashboard experience. 
        // A full cache flush ensures no stale IDs or cached response middleware bypasses the fresh assets.
        Cache::flush();
    }

    /**
     * Transform a relative storage path into a full URL.
     */
    public static function transformMediaUrl(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        if (str_starts_with($value, 'http') || str_starts_with($value, 'data:') || str_starts_with($value, 'blob:')) {
            return $value;
        }

        return asset('storage/' . $value);
    }

    public static function getValue(string $key, $default = null, $userId = null, bool $transform = true): mixed
    {
        // If no userId provided, attempt to use authenticated user's root admin context
        if ($userId === null && auth()->check()) {
            /** @var \App\Models\User $user */
            $user = auth()->user();
            $userId = $user->getRootAdminId();
        }

        $userIdStr = $userId ?? 'global';
        
        $value = Cache::rememberForever("settings.{$userIdStr}." . $key, function () use ($key, $userId) {
            $setting = static::query()
                ->where('key', $key)
                ->where('user_id', $userId)
                ->first();
            
            // Fallback to global setting if user-specific one doesn't exist AND context is a user
            if (!$setting && $userId !== null) {
                $setting = static::query()
                    ->where('key', $key)
                    ->whereNull('user_id')
                    ->first();
            }

            return $setting ? (string)$setting->value : null;
        });

        $finalValue = $value !== null ? $value : $default;

        // Auto-transform media keys if transform is enabled
        if ($transform && in_array($key, self::MEDIA_KEYS)) {
            return self::transformMediaUrl($finalValue);
        }

        return $finalValue;
    }

    /**
     * Get all merged settings (Global + User override) for a specific user ID.
     * Transformation of media URLs is handled automatically.
     */
    public static function getMergedSettings($userId = null)
    {
        // 1. Fetch Global Settings
        $globalSettings = static::query()
            ->whereNull('user_id')
            ->get();

        // 2. Fetch User-specific Settings
        $userSettings = collect();
        if ($userId) {
            $userSettings = static::query()
                ->where('user_id', $userId)
                ->get();
        }

        // 3. Merge: User settings override global settings
        $merged = $globalSettings->keyBy('key')->merge(
            $userSettings->keyBy('key')
        )->values();

        // 4. Transform media URLs
        $merged->transform(function ($setting) {
            if (in_array($setting->key, self::MEDIA_KEYS)) {
                $setting->value = self::transformMediaUrl($setting->value);
            }
            return $setting;
        });

        return $merged;
    }
}
