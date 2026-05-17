<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "Starting Laravel Bootstrap Test...\n\n";

$autoload = __DIR__ . '/../vendor/autoload.php';
echo "Checking autoload: $autoload\n";
if (file_exists($autoload)) {
    echo "Autoload exists! Loading...\n";
    require $autoload;
    echo "Autoload loaded successfully.\n\n";
} else {
    echo "FATAL: Autoload file does NOT exist!\n";
    exit;
}

$appFile = __DIR__ . '/../bootstrap/app.php';
echo "Checking app.php: $appFile\n";
if (file_exists($appFile)) {
    echo "App.php exists! Bootstrapping...\n";
    try {
        $app = require_once $appFile;
        echo "App bootstrapped successfully.\n\n";
        
        echo "Attempting to resolve Kernel...\n";
        $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
        echo "Kernel resolved successfully: " . get_class($kernel) . "\n\n";
        
        echo "Attempting to boot application...\n";
        $response = $kernel->handle(
            $request = Illuminate\Http\Request::capture()
        );
        echo "Application booted and request handled successfully! Status: " . $response->getStatusCode() . "\n";
    } catch (\Throwable $e) {
        echo "FATAL ERROR CAUGHT DURING BOOTSTRAP:\n";
        echo "Message: " . $e->getMessage() . "\n";
        echo "File: " . $e->getFile() . "\n";
        echo "Line: " . $e->getLine() . "\n";
        echo "Trace:\n" . $e->getTraceAsString() . "\n";
    }
} else {
    echo "FATAL: App.php does NOT exist!\n";
}
