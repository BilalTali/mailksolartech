<?php
header('Content-Type: text/plain; charset=utf-8');

$logFile = __DIR__ . '/../storage/logs/laravel.log';

if (!file_exists($logFile)) {
    echo "Log file not found at: " . realpath($logFile) . "\n";
    exit;
}

$lines = 150;
$data = file($logFile);
$lineCount = count($data);

echo "Total Log Lines: " . $lineCount . "\n\n";

$start = max(0, $lineCount - $lines);
for ($i = $start; $i < $lineCount; $i++) {
    echo $data[$i];
}
