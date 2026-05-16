<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class PrerenderMiddleware
{
    /**
     * Crawlers to intercept for pre-rendering.
     *
     * @var array
     */
    protected $crawlers = [
        'googlebot',
        'bingbot',
        'yandex',
        'baiduspider',
        'facebookexternalhit',
        'twitterbot',
        'linkedinbot',
        'pinterest',
        'slackbot',
        'vkShare',
        'W3C_Validator',
        'redditbot',
        'applebot',
        'whatsapp',
        'flipboard',
        'tumblr',
        'bitlybot',
        'SkypeShell',
        'TelegramBot',
    ];

    /**
     * Extensions to ignore (direct file hits).
     *
     * @var array
     */
    protected $ignoredExtensions = [
        '.js', '.css', '.xml', '.less', '.png', '.jpg', '.jpeg',
        '.gif', '.pdf', '.doc', '.txt', '.ico', '.rss', '.zip',
        '.mp3', '.rar', '.exe', '.wmv', '.doc', '.avi', '.ppt',
        '.mpg', '.mpeg', '.tif', '.wav', '.mov', '.psd', '.ai',
        '.xls', '.mp4', '.m4a', '.swf', '.dat', '.dmg', '.iso',
        '.flv', '.m4v', '.torrent', '.woff', '.ttf', '.svg', '.webp',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->shouldPrerender($request)) {
            return $this->prerender($request);
        }

        return $next($request);
    }

    /**
     * Determine if the request should be pre-rendered.
     */
    protected function shouldPrerender(Request $request): bool
    {
        $userAgent = strtolower($request->header('User-Agent', ''));
        $bufferAgent = $request->header('X-Bufferbot');

        // Only GET requests
        if (!$request->isMethod('GET')) {
            return false;
        }

        // Ignore API and non-HTML extensions
        if ($request->is('api/*') || Str::contains($request->getPathInfo(), $this->ignoredExtensions)) {
            return false;
        }

        // Check if crawler
        $isCrawler = false;
        foreach ($this->crawlers as $crawler) {
            if (str_contains($userAgent, strtolower($crawler))) {
                $isCrawler = true;
                break;
            }
        }

        if ($bufferAgent) {
            $isCrawler = true;
        }

        // If _escaped_fragment_ is present
        if ($request->has('_escaped_fragment_')) {
            $isCrawler = true;
        }

        return $isCrawler;
    }

    /**
     * Proxy the request to Prerender.io.
     */
    protected function prerender(Request $request): Response
    {
        $token = config('services.prerender.token');
        $baseUrl = 'https://service.prerender.io/';
        $targetUrl = $request->fullUrl();

        try {
            $response = Http::withHeaders([
                'X-Prerender-Token' => $token,
            ])
            ->timeout(20)
            ->get($baseUrl . $targetUrl);

            if ($response->successful()) {
                return response($response->body(), $response->status())
                    ->header('Content-Type', 'text/html; charset=UTF-8')
                    ->header('X-Prerender-Internal', 'true');
            }
        } catch (\Exception $e) {
            // Fallback to normal rendering if prerender fails
            \Log::error('Prerender failed: ' . $e->getMessage());
        }

        return response()->view('app'); // Fallback to our main index view
    }
}
