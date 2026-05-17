<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Custom storage handler for Hostinger symlink bypass
$uri = $_SERVER['REQUEST_URI'] ?? '';
if (strpos($uri, '/storage/') !== false) {
    $path = explode('/storage/', $uri, 2)[1];
    $path = explode('?', $path)[0]; // remove query string
    $path = urldecode($path); // decode URL encoded chars
    
    // Mitigate directory traversal
    if (strpos($path, '../') !== false || strpos($path, '..\\') !== false) {
        http_response_code(403);
        echo 'Directory traversal strictly forbidden.';
        exit;
    }

    $fullPath = __DIR__.'/../storage/app/public/' . $path;
    if (file_exists($fullPath) && is_file($fullPath)) {
        $mime = mime_content_type($fullPath);
        // Fallback for missing mimetypes
        if (!$mime || $mime === 'application/octet-stream') {
            $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
            $mimes = [
                'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
                'pdf' => 'application/pdf', 'svg' => 'image/svg+xml', 'webp' => 'image/webp',
                'mp4' => 'video/mp4', 'webm' => 'video/webm',
            ];
            $mime = $mimes[$ext] ?? 'application/octet-stream';
        }
        
        $filesize = filesize($fullPath);
        
        // Basic Range request support (required for Safari/iOS video playback)
        if (isset($_SERVER['HTTP_RANGE'])) {
            if (preg_match('/bytes=\h*(\d+)-(\d*)[\D.*]?/i', $_SERVER['HTTP_RANGE'], $matches)) {
                $begin = intval($matches[1]);
                $end = !empty($matches[2]) ? intval($matches[2]) : $filesize - 1;
                $length = ($end - $begin) + 1;
                
                header('HTTP/1.1 206 Partial Content');
                header("Content-Type: $mime");
                header("Cache-Control: public, max-age=31536000");
                header("Accept-Ranges: bytes");
                header("Content-Range: bytes $begin-$end/$filesize");
                header("Content-Length: $length");
                
                $fp = fopen($fullPath, 'rb');
                fseek($fp, $begin);
                echo fread($fp, $length);
                fclose($fp);
                exit;
            }
        }
        
        header('Content-Type: ' . $mime);
        header('Cache-Control: public, max-age=31536000');
        header('Accept-Ranges: bytes');
        header('Content-Length: ' . $filesize);
        readfile($fullPath);
        exit;
    } else {
        // Fast 404 for missing storage files to avoid booting Laravel
        http_response_code(404);
        echo "404 Not Found: The requested media file was not found on the server. If this was uploaded recently, a Git deployment may have wiped it if it was untracked.";
        exit;
    }
}

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Auto-restore .env from .env.production if it was deleted by a Git Webhook
if (!file_exists(__DIR__.'/../.env') && file_exists(__DIR__.'/../.env.production')) {
    copy(__DIR__.'/../.env.production', __DIR__.'/../.env');
}

// Ensure critical Laravel directories exist (Hostinger Git deploy wipes them)
$criticalDirs = [
    __DIR__.'/../storage/logs',
    __DIR__.'/../storage/framework/cache',
    __DIR__.'/../storage/framework/sessions',
    __DIR__.'/../storage/framework/views',
    __DIR__.'/../bootstrap/cache'
];
foreach ($criticalDirs as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
}

if (!file_exists(__DIR__.'/../vendor/autoload.php')) {
    $output = '';
    if (function_exists('shell_exec')) {
        $output = shell_exec('cd ' . __DIR__ . '/../ && composer install --no-dev --optimize-autoloader 2>&1');
        
        // Fallback using explicit path if default composer fails
        if (!file_exists(__DIR__.'/../vendor/autoload.php')) {
            $output .= "\n" . shell_exec('cd ' . __DIR__ . '/../ && /opt/alt/php83/usr/bin/php /opt/composer/composer.phar install --no-dev --optimize-autoloader 2>&1');
        }
    } else {
        $output = 'shell_exec is disabled on this server. Cannot auto-install dependencies.';
    }
    
    if (!file_exists(__DIR__.'/../vendor/autoload.php')) {
        http_response_code(500);
        echo "<h1>500 Internal Server Error</h1>";
        echo "<p>Vendor directory missing. Auto-recovery failed. Please check Hostinger SSH or ensure your GitHub Action HOSTINGER_PASSWORD secret is configured.</p>";
        echo "<pre>" . htmlspecialchars($output) . "</pre>";
        exit;
    }
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

try {
    /** @var Application $app */
    $app = require_once __DIR__.'/../bootstrap/app.php';

    $app->handleRequest(Request::capture());
} catch (\Throwable $e) {
    http_response_code(500);
    echo "<h1>Critical Boot Error</h1>";
    echo "<p><strong>Message:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>File:</strong> " . htmlspecialchars($e->getFile()) . ":" . $e->getLine() . "</p>";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
    exit;
}
