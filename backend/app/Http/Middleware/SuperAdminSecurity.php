<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SuperAdminSecurity
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $cacheKey = 'super-admin-security-unlocked:' . $user->id;

        if (!Cache::has($cacheKey)) {
            return response()->json([
                'success' => false, 
                'message' => 'Security verification required.',
                'security_required' => true
            ], 423); // Locked
        }

        return $next($request);
    }
}
