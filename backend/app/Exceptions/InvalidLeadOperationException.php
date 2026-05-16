<?php

namespace App\Exceptions;

use Exception;

class InvalidLeadOperationException extends Exception
{
    public function __construct(string $message = 'This operation is not valid for the lead in its current state.')
    {
        parent::__construct($message, 422);
    }
}
