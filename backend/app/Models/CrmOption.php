<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'category',
        'label',
        'value',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Scope a query to only include active options.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to fetch a specific category, ordered explicitly.
     */
    public function scopeForCategory($query, $category)
    {
        return $query->where('category', $category)->orderBy('sort_order', 'asc')->orderBy('label', 'asc');
    }
}
