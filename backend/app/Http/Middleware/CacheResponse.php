<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Cache;

class CacheResponse
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, int $ttl = 300): Response
    {
        // Only cache GET requests
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        // Create a unique key based on URL and authenticated user (if any)
        $key = 'api_cache_' . md5($request->fullUrl() . '_' . ($request->user()?->id ?? 'guest'));

        if (Cache::has($key)) {
            $cached = Cache::get($key);
            $response = response($cached['content'], $cached['status']);
            $response->withHeaders($cached['headers']);
            $response->header('X-Cache', 'HIT');
            return $response;
        }

        /** @var \Illuminate\Http\Response $response */
        $response = $next($request);

        // Only cache successful JSON responses
        if ($response->isSuccessful()) {
            Cache::put($key, [
                'content' => $response->getContent(),
                'status' => $response->getStatusCode(),
                'headers' => $response->headers->all(),
            ], $ttl);
            
            $response->header('X-Cache', 'MISS');
        }

        return $response;
    }
}
