<?php
header('Content-Type: text/plain; charset=utf-8');

echo "=== System Info ===\n";
echo "PHP Version: " . phpversion() . "\n";
echo "SAPI Name: " . php_sapi_name() . "\n";
echo "Current File: " . __FILE__ . "\n";
echo "Current Directory: " . __DIR__ . "\n\n";

$backendDir = realpath(__DIR__ . '/..');
echo "Backend Base Dir: " . $backendDir . "\n";

if ($backendDir && is_dir($backendDir)) {
    echo "Directory exists.\n";
    $files = scandir($backendDir);
    echo "Files in Backend Dir:\n";
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..') {
            $path = $backendDir . '/' . $file;
            $type = is_dir($path) ? 'DIR' : 'FILE';
            echo " - [$type] $file\n";
        }
    }
} else {
    echo "Backend directory does NOT exist or is not readable.\n";
}

$autoload = $backendDir . '/vendor/autoload.php';
echo "\nTarget Autoload: " . $autoload . "\n";
if (file_exists($autoload)) {
    echo "vendor/autoload.php exists!\n";
} else {
    echo "vendor/autoload.php does NOT exist!\n";
}
