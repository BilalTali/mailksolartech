<?php

header('Content-Type: text/plain; charset=utf-8');

$pathsToTry = [
    __DIR__ . '/../.env',
    __DIR__ . '/../../.env',
    '/home/u596750690/domains/maliksolartech.com/public_html/backend/.env',
    '/home/u596750690/domains/maliksolartech.com/public_html/.env'
];

$envPath = null;
foreach ($pathsToTry as $path) {
    if (file_exists($path) && is_readable($path)) {
        $envPath = $path;
        break;
    }
}

if (!$envPath) {
    die("No .env file found.\n");
}

$dbConfig = [
    'DB_HOST' => '127.0.0.1',
    'DB_PORT' => '3306',
    'DB_DATABASE' => '',
    'DB_USERNAME' => '',
    'DB_PASSWORD' => ''
];

$lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    if (strpos(trim($line), '#') === 0) continue;
    $parts = explode('=', $line, 2);
    if (count($parts) === 2) {
        $key = trim($parts[0]);
        $val = trim($parts[1]);
        $val = trim($val, '"\'');
        if (array_key_exists($key, $dbConfig)) {
            $dbConfig[$key] = $val;
        }
    }
}

try {
    $dsn = "mysql:host=" . $dbConfig['DB_HOST'] . ";port=" . $dbConfig['DB_PORT'] . ";dbname=" . $dbConfig['DB_DATABASE'] . ";charset=utf8mb4";
    $pdo = new PDO($dsn, $dbConfig['DB_USERNAME'], $dbConfig['DB_PASSWORD'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $stmt = $pdo->prepare("SELECT id, name, email, role, parent_id, created_by_agent_id, created_by_super_agent_id, enumerator_creator_role FROM users WHERE role = 'enumerator' ORDER BY id DESC LIMIT 25");
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    echo "Matching users:\n";
    echo json_encode($users, JSON_PRETTY_PRINT) . "\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
