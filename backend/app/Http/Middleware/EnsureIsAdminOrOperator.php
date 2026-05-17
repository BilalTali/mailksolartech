<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsAdminOrOperator
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Allow: admin, operator roles only (super_admin has its own guarded route group).
        $allowedRoles = ['admin', 'operator'];
        if (! $user || ! in_array($user->role, $allowedRoles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin or Operator access required.'
            ], 403);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your account is not active. Please contact support.',
            ], 403);
        }

        return $next($request);
    }
}
