<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsEnumerator
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'enumerator') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Enumerator access restricted.',
            ], 403);
        }

        if ($user->status === 'pending') {
            return response()->json(['success' => false, 'message' => 'Account pending approval.'], 403);
        }

        if ($user->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Account is suspended or inactive.'], 403);
        }

        return $next($request);
    }
}
