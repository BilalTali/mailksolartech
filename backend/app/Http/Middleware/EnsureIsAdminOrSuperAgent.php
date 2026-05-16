<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsAdminOrSuperAgent
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, ['admin', 'super_agent'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        if ($user->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Account is inactive or suspended.'], 403);
        }

        return $next($request);
    }
}
