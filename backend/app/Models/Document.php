<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $title
 * @property string|null $description
 * @property string|null $file_path
 * @property string|null $thumbnail_path
 * @property string|null $category
 * @property bool $is_published
 * @property int $sort_order
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string|null $deleted_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereCategory($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereFilePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereIsPublished($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereSortOrder($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereThumbnailPath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereUpdatedAt($value)
 */
class Document extends Model
{
    protected $fillable = [
        'title',
        'description',
        'category',
        'file_path',
        'thumbnail_path',
        'is_published',
        'sort_order',
        'admin_id',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
