<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $title
 * @property string|null $description
 * @property string|null $image_path
 * @property \Illuminate\Support\Carbon|null $date
 * @property bool $is_published
 * @property int $sort_order
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string|null $deleted_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Media newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Media newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Media query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Media whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Media whereDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Media whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Media whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Media whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Media whereImagePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Media whereIsPublished($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Media whereSortOrder($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Media whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Media whereUpdatedAt($value)
 */
class Media extends Model
{
    protected $fillable = [
        'title',
        'winner_name',
        'description',
        'image_path',
        'date',
        'is_published',
        'sort_order',
        'admin_id',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'date' => 'date',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
