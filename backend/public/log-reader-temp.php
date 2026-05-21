<?php

/**
 * MalikSolarTech — Temporary Live Server Diagnostic Tool
 * 
 * Securely outputs the last 50 lines of the Laravel error log and tests DB
 * to help diagnose 500 errors on the live site.
 */

header('Content-Type: text/plain; charset=utf-8');

$logPath = __DIR__ . '/../storage/logs/laravel.log';

echo "==================================================\n";
echo " MalikSolarTech Live Server Diagnostics\n";
echo " Time: " . date('Y-m-d H:i:s') . "\n";
echo " PHP Version: " . PHP_VERSION . "\n";
echo "==================================================\n\n";

// 1. Check PHP configuration and database connection
echo "Checking Environment & Dependencies:\n";
echo "--------------------------------------------------\n";
echo "PDO Extension Loaded: " . (extension_loaded('pdo') ? 'YES' : 'NO') . "\n";
echo "PDO MySQL Driver Loaded: " . (extension_loaded('pdo_mysql') ? 'YES' : 'NO') . "\n";
echo ".env File Exists: " . (file_exists(__DIR__ . '/../.env') ? 'YES' : 'NO') . "\n";
echo "Storage Path Writable: " . (is_writable(__DIR__ . '/../storage') ? 'YES' : 'NO') . "\n";
echo "Cache Path Writable: " . (is_writable(__DIR__ . '/../storage/framework/cache') ? 'YES' : 'NO') . "\n";

// Check Bootstrap Cache Files
$cacheDir = __DIR__ . '/../bootstrap/cache/';
if (is_dir($cacheDir)) {
    echo "bootstrap/cache directory exists.\n";
    $files = array_diff(scandir($cacheDir), ['.', '..', '.gitignore']);
    foreach ($files as $file) {
        $filePath = $cacheDir . $file;
        echo " - $file (" . filesize($filePath) . " bytes)\n";
    }
}

// Test DB Connection
if (file_exists(__DIR__ . '/../.env')) {
    $env = parse_ini_file(__DIR__ . '/../.env');
    if ($env) {
        $host = $env['DB_HOST'] ?? 'localhost';
        $db = $env['DB_DATABASE'] ?? '';
        $user = $env['DB_USERNAME'] ?? '';
        $pass = $env['DB_PASSWORD'] ?? '';
        
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 3
            ]);
            echo "Database Connection: SUCCESS (Connected to database: '$db')\n";
        } catch (\Exception $e) {
            echo "Database Connection: FAILED (" . $e->getMessage() . ")\n";
        }
    } else {
        echo "Database Connection: UNABLE TO PARSE .env\n";
    }
} else {
    echo "Database Connection: NO .env FILE\n";
}

// Test Laravel Bootstrap
echo "\nLaravel Framework Bootstrap Test:\n";
echo "--------------------------------------------------\n";
try {
    if (!file_exists(__DIR__.'/../vendor/autoload.php')) {
        throw new \Exception("vendor/autoload.php not found.");
    }
    require_once __DIR__.'/../vendor/autoload.php';
    
    if (!file_exists(__DIR__.'/../bootstrap/app.php')) {
        throw new \Exception("bootstrap/app.php not found.");
    }
    
    /** @var \Illuminate\Foundation\Application $app */
    $app = require_once __DIR__.'/../bootstrap/app.php';
    
    $kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
    echo "Laravel Application Booted successfully!\n";
    
    $dbName = \Illuminate\Support\Facades\DB::connection()->getDatabaseName();
    echo "Laravel DB Connection SUCCESS! Database: '$dbName'\n";
    
} catch (\Throwable $e) {
    echo "Laravel Bootstrap FAILED:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n";

// 2. Read Laravel Log File
echo "Last 50 Lines of Laravel Log:\n";
echo "--------------------------------------------------\n";

if (!file_exists($logPath)) {
    echo "Log file not found at: $logPath\n";
} else {
    readLastLines($logPath, 50);
}

function readLastLines($filepath, $lines = 50) {
    $f = fopen($filepath, 'r');
    if (!$f) {
        echo "Could not open log file for reading.\n";
        return;
    }
    
    $lineArr = [];
    while (($line = fgets($f)) !== false) {
        $lineArr[] = $line;
        if (count($lineArr) > $lines) {
            array_shift($lineArr);
        }
    }
    fclose($f);
    
    echo implode("", $lineArr);
}
