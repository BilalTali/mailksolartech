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
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Achievement newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Achievement newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Achievement query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Achievement whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Achievement whereDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Achievement whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Achievement whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Achievement whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Achievement whereImagePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Achievement whereIsPublished($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Achievement whereSortOrder($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Achievement whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Achievement whereUpdatedAt($value)
 */
class Achievement extends Model
{
    protected $table = 'achievements';

    protected $fillable = [
        'title',
        'winner_name',
        'description',
        'image_path',
        'date',
        'is_published',
        'sort_order',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'date' => 'date',
    ];
}
