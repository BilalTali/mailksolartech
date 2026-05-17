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
        if (!$mime) {
            $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
            $mimes = ['png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'pdf' => 'application/pdf', 'svg' => 'image/svg+xml', 'webp' => 'image/webp'];
            $mime = $mimes[$ext] ?? 'application/octet-stream';
        }
        header('Content-Type: ' . $mime);
        header('Cache-Control: public, max-age=31536000');
        readfile($fullPath);
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
    $output = shell_exec('cd ' . __DIR__ . '/../ && composer install --no-dev --optimize-autoloader 2>&1');
    
    // Fallback using explicit path if default composer fails
    if (!file_exists(__DIR__.'/../vendor/autoload.php')) {
        $output .= "\n" . shell_exec('cd ' . __DIR__ . '/../ && /opt/alt/php83/usr/bin/php /opt/composer/composer.phar install --no-dev --optimize-autoloader 2>&1');
    }
    
    if (!file_exists(__DIR__.'/../vendor/autoload.php')) {
        http_response_code(500);
        echo "<h1>500 Internal Server Error</h1>";
        echo "<p>Vendor directory missing. Auto-recovery failed. Please check Hostinger SSH.</p>";
        echo "<pre>" . htmlspecialchars($output) . "</pre>";
        exit;
    }
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
