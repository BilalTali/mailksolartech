<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int|null $user_id
 * @property \Illuminate\Support\Carbon $scanned_at
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property string|null $referer
 * @property-read \App\Models\User|null $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QrScanLog newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QrScanLog newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QrScanLog query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QrScanLog whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QrScanLog whereIpAddress($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QrScanLog whereReferer($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QrScanLog whereScannedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QrScanLog whereUserAgent($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QrScanLog whereUserId($value)
 */
class QrScanLog extends Model
{
    public $timestamps = false;

    const CREATED_AT = 'scanned_at';

    protected $fillable = [
        'user_id',
        'ip_address',
        'user_agent',
        'referer',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
