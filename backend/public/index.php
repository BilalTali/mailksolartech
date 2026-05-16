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

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
