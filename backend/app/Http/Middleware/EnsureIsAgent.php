<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsAgent
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'agent') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Agent access required.',
            ], 403);
        }

        if ($user->status === 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Account pending approval.',
            ], 403);
        }

        if ($user->status === 'inactive') {
            return response()->json([
                'success' => false,
                'message' => 'Account suspended.',
            ], 403);
        }

        return $next($request);
    }
}
