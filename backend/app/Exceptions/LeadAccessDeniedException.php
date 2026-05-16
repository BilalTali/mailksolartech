<?php

namespace App\Exceptions;

use Exception;

class LeadAccessDeniedException extends Exception
{
    public function __construct(string $message = 'You are not authorized to perform this action on this lead.')
    {
        parent::__construct($message, 403);
    }
}
