<?php
if (function_exists('opcache_reset')) {
    opcache_reset();
}

header('Content-Type: text/plain; charset=utf-8');

echo "--- Directory Diagnostics ---\n";
echo "Current directory: " . __DIR__ . "\n";
echo "Parent directory: " . realpath(__DIR__ . '/..') . "\n\n";

function findLogFiles($dir, &$results = array()) {
    $files = scandir($dir);
    foreach ($files as $key => $value) {
        $path = realpath($dir . DIRECTORY_SEPARATOR . $value);
        if (!is_dir($path)) {
            if (strpos($value, 'log') !== false || strpos($value, 'error') !== false) {
                $results[] = $path;
            }
        } else if ($value != "." && $value != "..") {
            // Only scan public, storage, bootstrap/cache to avoid deep heavy traversal
            if (in_array($value, ['public', 'storage', 'bootstrap', 'logs', 'framework'])) {
                findLogFiles($path, $results);
            }
        }
    }
    return $results;
}

$foundLogs = [];
findLogFiles(realpath(__DIR__ . '/..'), $foundLogs);

echo "Found Log/Error Files:\n";
print_r($foundLogs);

foreach ($foundLogs as $file) {
    echo "\n=== Contents of $file (Last 50 lines) ===\n";
    if (is_readable($file)) {
        $lines = file($file);
        $count = count($lines);
        $start = max(0, $count - 50);
        for ($i = $start; $i < $count; $i++) {
            echo $lines[$i];
        }
    } else {
        echo "File is NOT readable.\n";
    }
}
