<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

class GloballyUniqueConsumerNumber implements ValidationRule
{
    protected ?int $ignoreLeadId;

    public function __construct(?int $ignoreLeadId = null)
    {
        $this->ignoreLeadId = $ignoreLeadId;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $query = DB::table('leads')->where(fn ($q) => $q->where('consumer_number', $value))->whereNull('deleted_at');
        
        if ($this->ignoreLeadId) {
            $query->where(fn ($q) => $q->where('id', '!=', $this->ignoreLeadId));
        }

        if ($query->exists()) {
            $fail('This Consumer Number has already been registered for a solar installation.');
        }
    }
}
