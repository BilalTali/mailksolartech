<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsConsumer
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() || $request->user()->role !== 'consumer') {
            return response()->json(['error' => 'Unauthorized. Consumer access only.'], 403);
        }

        return $next($request);
    }
}
