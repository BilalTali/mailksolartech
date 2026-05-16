<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

class GloballyUniqueMobile implements ValidationRule
{
    protected ?int $ignoreUserId;

    public function __construct(?int $ignoreUserId = null)
    {
        $this->ignoreUserId = $ignoreUserId;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $query = DB::table('users')->where(fn ($q) => $q->where('mobile', $value))->whereNull('deleted_at');
        
        if ($this->ignoreUserId) {
            $query->where(fn ($q) => $q->where('id', '!=', $this->ignoreUserId));
        }

        if ($query->exists()) {
            $fail('This mobile number is already registered in the system.');
        }
    }
}
