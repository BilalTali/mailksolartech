<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Strict check: allow 'admin', 'operator', and 'super_admin' roles.
        // Super admins use these endpoints for global tenant settings.
        if (! $user || ! in_array($user->role, ['admin', 'operator', 'super_admin'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.',
            ], 403);
        }

        // Block suspended or pending accounts even with a valid token.
        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your account is not active. Please contact support.',
            ], 403);
        }

        return $next($request);
    }
}
