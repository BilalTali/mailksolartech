<?php
header('Content-Type: text/plain; charset=utf-8');

$logDir = __DIR__ . '/../storage/logs';
echo "Log Directory: " . realpath($logDir) . "\n";

if (is_dir($logDir)) {
    echo "Directory exists.\n";
    $files = scandir($logDir);
    echo "Files in Directory:\n";
    print_r($files);
} else {
    echo "Directory does NOT exist.\n";
}

$logFile = $logDir . '/laravel.log';
echo "\nTarget Log File: " . $logFile . "\n";
if (file_exists($logFile)) {
    echo "Log file exists. Size: " . filesize($logFile) . " bytes\n";
    $lines = 150;
    $data = file($logFile);
    $lineCount = count($data);
    echo "Total Log Lines: " . $lineCount . "\n\n";
    $start = max(0, $lineCount - $lines);
    for ($i = $start; $i < $lineCount; $i++) {
        echo $data[$i];
    }
} else {
    echo "Log file does not exist.\n";
}
