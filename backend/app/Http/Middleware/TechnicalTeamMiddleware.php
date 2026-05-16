<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TechnicalTeamMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() || ! $request->user()->isFieldTechnician()) {
            return response()->json(['error' => 'Unauthorized. Must be a Field Technical Team member.'], 403);
        }

        return $next($request);
    }
}
