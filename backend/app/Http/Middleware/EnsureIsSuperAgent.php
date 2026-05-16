<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsSuperAgent
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'super_agent') {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Super Agent access only.'], 403);
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
