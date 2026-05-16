<?php

namespace App\Http\Controllers\Solar;

use App\Http\Controllers\Controller;

/**
 * SitemapController — generates a dynamic XML sitemap for all public pages.
 * The sitemap is served with a Cache-Control header so reverse proxies cache it.
 */
class SitemapController extends Controller
{
    /** @var string Base URL of the frontend application. */
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('app.url'), '/');
    }

    /**
     * Return the XML sitemap.
     */
    public function index(): \Illuminate\Http\Response
    {
        $today = date('Y-m-d');

        $urls = [
            // Core landing pages — highest priority, crawled daily
            ['loc' => '/',                          'priority' => '1.0', 'changefreq' => 'daily',   'lastmod' => $today],
            ['loc' => '/faq',                       'priority' => '0.9', 'changefreq' => 'weekly',  'lastmod' => $today],
            ['loc' => '/pm-surya-ghar-guide',       'priority' => '1.0', 'changefreq' => 'monthly', 'lastmod' => $today],
            ['loc' => '/solar-subsidy-calculator',  'priority' => '0.9', 'changefreq' => 'monthly', 'lastmod' => $today],
            ['loc' => '/state-wise-subsidy',        'priority' => '0.9', 'changefreq' => 'monthly', 'lastmod' => $today],

            // Informational pages
            ['loc' => '/about',                     'priority' => '0.8', 'changefreq' => 'monthly', 'lastmod' => $today],
            ['loc' => '/contact',                   'priority' => '0.8', 'changefreq' => 'monthly', 'lastmod' => $today],
            ['loc' => '/scheme',                    'priority' => '0.8', 'changefreq' => 'monthly', 'lastmod' => $today],
            ['loc' => '/documents',                 'priority' => '0.7', 'changefreq' => 'weekly',  'lastmod' => $today],
            ['loc' => '/media',                     'priority' => '0.7', 'changefreq' => 'weekly',  'lastmod' => $today],

            // Tools & interactions
            ['loc' => '/track-status',              'priority' => '0.9', 'changefreq' => 'always',  'lastmod' => $today],
            ['loc' => '/agent/register',            'priority' => '0.9', 'changefreq' => 'monthly', 'lastmod' => $today],

            // Legal
            ['loc' => '/privacy-policy',            'priority' => '0.4', 'changefreq' => 'yearly',  'lastmod' => '2025-01-01'],
            ['loc' => '/terms-conditions',          'priority' => '0.4', 'changefreq' => 'yearly',  'lastmod' => '2025-01-01'],
            ['loc' => '/refund-policy',             'priority' => '0.4', 'changefreq' => 'yearly',  'lastmod' => '2025-01-01'],
        ];

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
              . ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
              . ' xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9'
              . ' http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">';

        foreach ($urls as $url) {
            $xml .= '<url>';
            $xml .= '<loc>' . $this->xmlEscape($this->baseUrl . $url['loc']) . '</loc>';
            $xml .= '<lastmod>' . $this->xmlEscape($url['lastmod']) . '</lastmod>';
            $xml .= '<changefreq>' . $this->xmlEscape($url['changefreq']) . '</changefreq>';
            $xml .= '<priority>' . $this->xmlEscape($url['priority']) . '</priority>';
            $xml .= '</url>';
        }

        $xml .= '</urlset>';

        return response($xml, 200)
            ->header('Content-Type', 'text/xml; charset=UTF-8')
            ->header('Cache-Control', 'public, max-age=3600'); // Cache 1 hour
    }

    /**
     * Return the robots.txt file (dynamic, reflects app.url).
     */
    public function robots(): \Illuminate\Http\Response
    {
        $lines = [
            'User-agent: *',
            'Allow: /',
            'Disallow: /admin',
            'Disallow: /api/',
            'Disallow: /super-agent/',
            'Disallow: /enumerator/',
            'Disallow: /super-admin/',
            'Disallow: /agent/login',
            'Disallow: /agent/dashboard',
            '',
            'Sitemap: ' . $this->baseUrl . '/sitemap.xml',
        ];

        return response(implode("\n", $lines), 200)
            ->header('Content-Type', 'text/plain');
    }

    /**
     * Escape special XML characters in a string.
     */
    private function xmlEscape(string $string): string
    {
        return htmlspecialchars($string, ENT_XML1, 'UTF-8');
    }
}
