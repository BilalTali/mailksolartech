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
            echo "Database Connection: SUCCESS\n";
        } catch (\Exception $e) {
            echo "Database Connection: FAILED (" . $e->getMessage() . ")\n";
        }
    } else {
        echo "Database Connection: UNABLE TO PARSE .env\n";
    }
} else {
    echo "Database Connection: NO .env FILE\n";
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
                            $sample = array_slice($inner, 0, 3);
                            echo "       Samples: " . implode(', ', $sample) . "\n";
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

// 2. Read Laravel Log File
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
