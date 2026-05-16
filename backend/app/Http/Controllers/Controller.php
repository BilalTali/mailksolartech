<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

abstract class Controller
{
    use \App\Traits\ApiResponse, AuthorizesRequests;
}
