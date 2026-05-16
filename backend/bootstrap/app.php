<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->append(\App\Http\Middleware\PrerenderMiddleware::class);
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureIsAdmin::class,
            'admin_or_operator' => \App\Http\Middleware\EnsureIsAdminOrOperator::class,
            'agent' => \App\Http\Middleware\EnsureIsAgent::class,
            'super_agent' => \App\Http\Middleware\EnsureIsSuperAgent::class,
            'admin_or_super_agent' => \App\Http\Middleware\EnsureIsAdminOrSuperAgent::class,
            'enumerator' => \App\Http\Middleware\EnsureIsEnumerator::class,
            'super_admin' => \App\Http\Middleware\EnsureIsSuperAdmin::class,
            'consumer' => \App\Http\Middleware\EnsureIsConsumer::class,
            'super_admin_security' => \App\Http\Middleware\SuperAdminSecurity::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*')) {
                \Illuminate\Support\Facades\Log::error('Validation Failed', ['url' => $request->url(), 'errors' => $e->errors()]);
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->is('v1/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->is('v1/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resource not found.',
                ], 404);
            }
        });

        // Phase 2: Pipeline enforcement — forward-only violations return 422
        $exceptions->render(function (\App\Exceptions\InvalidLeadOperationException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->is('v1/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }
        });

        $exceptions->render(function (\Exception $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->is('v1/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => config('app.debug') ? $e->getMessage() : 'Server Error',
                ], 500);
            }
        });
    })->create();
