<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string|null $email
 * @property string|null $phone
 * @property string $message
 * @property int $rating
 * @property string|null $admin_reply
 * @property \Illuminate\Support\Carbon|null $replied_at
 * @property bool $is_published
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string|null $deleted_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feedback newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feedback newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feedback query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feedback whereAdminReply($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feedback whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feedback whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feedback whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feedback whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feedback whereIsPublished($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feedback whereMessage($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feedback whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feedback wherePhone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feedback whereRating($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feedback whereRepliedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feedback whereUpdatedAt($value)
 */
class Feedback extends Model
{
    protected $table = 'feedbacks';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'message',
        'rating',
        'admin_reply',
        'replied_at',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'replied_at' => 'datetime',
        'rating' => 'integer',
    ];
}
