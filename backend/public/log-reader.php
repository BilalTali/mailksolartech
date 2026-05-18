<?php

/**
 * MalikSolarTech — Live Server Diagnostic / Log Reader Tool
 * 
 * Securely outputs the last 50 lines of the Laravel error log or any active
 * PHP errors to help diagnose 500 Internal Server Errors on the live site.
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
echo ".env.production Exists: " . (file_exists(__DIR__ . '/../.env.production') ? 'YES' : 'NO') . "\n";
echo "Storage Path Writable: " . (is_writable(__DIR__ . '/../storage') ? 'YES' : 'NO') . "\n";
echo "Cache Path Writable: " . (is_writable(__DIR__ . '/../storage/framework/cache') ? 'YES' : 'NO') . "\n";

// Test DB Connection
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $env = [];
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $val = trim($parts[1]);
            // Strip potential quotes
            if (preg_match('/^"?(.*?)"?$/', $val, $matches)) {
                $val = $matches[1];
            }
            $env[$key] = $val;
        }
    }
    
    if (!empty($env)) {
        $host = $env['DB_HOST'] ?? 'localhost';
        $port = $env['DB_PORT'] ?? '3306';
        $db = $env['DB_DATABASE'] ?? '';
        $user = $env['DB_USERNAME'] ?? '';
        $pass = $env['DB_PASSWORD'] ?? '';
        
        try {
            $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 3
            ]);
            echo "Database Connection: SUCCESS (Connected to database: '$db' on '$host')\n";
            
            // Query branding settings
            echo "\nDatabase Settings Table Inspection:\n";
            echo "--------------------------------------------------\n";
            try {
                $stmt = $pdo->query("SELECT `key`, `value` FROM `settings` WHERE `key` LIKE '%logo%' OR `key` LIKE '%icon%' OR `key` LIKE '%background%' OR `key` LIKE '%branding%' OR `key` = 'app_name'");
                $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if (count($settings) > 0) {
                    foreach ($settings as $row) {
                        echo "Key: " . str_pad($row['key'], 25) . " -> Value: " . $row['value'] . "\n";
                    }
                } else {
                    echo "No branding keys found in 'settings' table.\n";
                }
            } catch (\Exception $dbEx) {
                echo "Error querying 'settings' table: " . $dbEx->getMessage() . "\n";
            }
        } catch (\Exception $e) {
            echo "Database Connection: FAILED (" . $e->getMessage() . ")\n";
            echo "Attempted: host=$host, port=$port, dbname=$db, username=$user\n";
        }
    } else {
        echo "Database Connection: UNABLE TO PARSE .env (no key-value pairs parsed)\n";
    }
} else {
    echo "Database Connection: NO .env FILE\n";
}

echo "\n";

// 1.2 Check Bootstrap Cache Files
echo "Bootstrap Cache Check:\n";
echo "--------------------------------------------------\n";
$cacheDir = __DIR__ . '/../bootstrap/cache/';
if (is_dir($cacheDir)) {
    echo "Directory exists: $cacheDir\n";
    $files = array_diff(scandir($cacheDir), ['.', '..', '.gitignore']);
    if (count($files) > 0) {
        echo "Found cached files (THESE SHOULD BE CLEARED ON LIVE SERVER!):\n";
        foreach ($files as $file) {
            $filePath = $cacheDir . $file;
            echo " - $file (" . filesize($filePath) . " bytes, Last modified: " . date('Y-m-d H:i:s', filemtime($filePath)) . ")\n";
            
            // Check for potential absolute path leaks in cached config
            if ($file === 'config.php') {
                $content = file_get_contents($filePath);
                if (strpos($content, '/Users/computergallery') !== false) {
                    echo "   ⚠️ WARNING: This cached config contains absolute paths from the local Mac development machine!\n";
                    echo "   This WILL cause 500 errors on the live server. Run 'php artisan config:clear' on the live server immediately.\n";
                }
            }
        }
    } else {
        echo "No cached files found. (Good - cache is clear)\n";
    }
} else {
    echo "bootstrap/cache directory NOT found!\n";
}

echo "\n";

// 1.5. Analyze Persistent Storage Directories
echo "Persistent Storage Analysis:\n";
echo "--------------------------------------------------\n";
$solarStorage = '/home/u596750690/solar_storage';
if (@is_dir($solarStorage)) {
    echo "Directory exists: $solarStorage\n";
    $subdirs = ['public', 'private', 'leads'];
    foreach ($subdirs as $sub) {
        $subpath = "$solarStorage/$sub";
        if (@is_dir($subpath)) {
            echo " - $subpath exists\n";
            $files = array_diff(scandir($subpath), ['.', '..']);
            echo "   Contains " . count($files) . " items/dirs.\n";
            
            // Look deeper inside public
            if ($sub === 'public') {
                foreach ($files as $item) {
                    $itempath = "$subpath/$item";
                    if (@is_dir($itempath)) {
                        $inner = array_diff(scandir($itempath), ['.', '..']);
                        echo "     * $item/ directory has " . count($inner) . " files.\n";
                        if (count($inner) > 0) {
                            echo "       Files: " . implode(', ', $inner) . "\n";
                        }
                    } else {
                        echo "     * File: $item\n";
                    }
                }
            }
        } else {
            echo " - $subpath NOT FOUND\n";
        }
    }
} else {
    echo "Directory NOT found: $solarStorage\n";
}

// Check local public storage link
$localPublic = __DIR__ . '/../storage/app/public';
echo "\nLocal app/public path: $localPublic\n";
if (file_exists($localPublic)) {
    echo " - Path exists. Is link: " . (is_link($localPublic) ? 'YES' : 'NO') . "\n";
    if (is_link($localPublic)) {
        echo "   Target: " . readlink($localPublic) . "\n";
    } else {
        echo "   (This is a physical directory, not a symlink!)\n";
    }
} else {
    echo " - Path does not exist!\n";
}

echo "\n";

// 2. Test Laravel Bootstrap
echo "Laravel Framework Bootstrap Test:\n";
echo "--------------------------------------------------\n";
try {
    if (!file_exists(__DIR__.'/../vendor/autoload.php')) {
        throw new \Exception("vendor/autoload.php not found. Did you run 'composer install'?");
    }
    require_once __DIR__.'/../vendor/autoload.php';
    
    if (!file_exists(__DIR__.'/../bootstrap/app.php')) {
        throw new \Exception("bootstrap/app.php not found.");
    }
    
    /** @var \Illuminate\Foundation\Application $app */
    $app = require_once __DIR__.'/../bootstrap/app.php';
    
    // Resolve Http Kernel
    $kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
    echo "Laravel Application Booted successfully!\n";
    
    // Test DB connection via Laravel DB Facade
    echo "Testing Database via Laravel DB Facade...\n";
    $dbName = \Illuminate\Support\Facades\DB::connection()->getDatabaseName();
    echo "Laravel DB Connection SUCCESS! Database Name: '$dbName'\n";
    
    // Try to get public settings via Setting Model to see if the settings table has any model errors
    echo "Testing Setting Model...\n";
    $settingsCount = \App\Models\Setting::count();
    echo "Setting Model SUCCESS! Stored settings count: $settingsCount\n";
    
} catch (\Throwable $e) {
    echo "Laravel Bootstrap FAILED with Exception:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Stack Trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n";

// 3. Read Laravel Log File
echo "Last 50 Lines of Laravel Log:\n";
echo "--------------------------------------------------\n";

if (!file_exists($logPath)) {
    echo "Log file not found at: $logPath\n";
    
    // Search for any log files
    $logsDir = __DIR__ . '/../storage/logs/';
    if (is_dir($logsDir)) {
        echo "Found files in storage/logs/:\n";
        $files = scandir($logsDir);
        foreach ($files as $file) {
            if ($file !== '.' && $file !== '..') {
                echo " - $file (" . filesize($logsDir . $file) . " bytes)\n";
            }
        }
    } else {
        echo "storage/logs/ directory does not exist!\n";
    }
} else {
    $file = escapeshellarg($logPath);
    // Use tail if available, otherwise read via PHP
    if (function_exists('shell_exec')) {
        $output = shell_exec("tail -n 50 $file");
        if ($output) {
            echo $output;
        } else {
            readLastLines($logPath, 50);
        }
    } else {
        readLastLines($logPath, 50);
    }
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
