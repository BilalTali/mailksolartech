<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsumerRating extends Model
{
    protected $fillable = [
        'lead_id',
        'consumer_id',
        'rated_user_id',
        'role_rated',
        'rating',
        'comments',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function consumer()
    {
        return $this->belongsTo(User::class, 'consumer_id');
    }

    public function ratedUser()
    {
        return $this->belongsTo(User::class, 'rated_user_id');
    }
}
