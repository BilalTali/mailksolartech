<?php

/**
 * MalikSolarTech — Temporary Live Server Diagnostic Tool (Raw PHP version)
 */

header('Content-Type: text/plain; charset=utf-8');

echo "==================================================\n";
echo " MalikSolarTech Live Server Raw DB Diagnostics\n";
echo " Time: " . date('Y-m-d H:i:s') . "\n";
echo "==================================================\n\n";

$envPath = __DIR__ . '/../.env';
if (!file_exists($envPath)) {
    die("Error: .env file does not exist at: $envPath\n");
}

// Simple manual .env parser
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
        // Strip quotes
        $val = trim($val, '"\'');
        if (array_key_exists($key, $dbConfig)) {
            $dbConfig[$key] = $val;
        }
    }
}

echo "Database config found:\n";
echo "Host: " . $dbConfig['DB_HOST'] . "\n";
echo "Database: " . $dbConfig['DB_DATABASE'] . "\n";
echo "Username: " . $dbConfig['DB_USERNAME'] . "\n\n";

try {
    $dsn = "mysql:host=" . $dbConfig['DB_HOST'] . ";port=" . $dbConfig['DB_PORT'] . ";dbname=" . $dbConfig['DB_DATABASE'] . ";charset=utf8mb4";
    $pdo = new PDO($dsn, $dbConfig['DB_USERNAME'], $dbConfig['DB_PASSWORD'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5
    ]);
    echo "Database Connection: SUCCESS\n\n";

    // 1. Query field technicians
    echo "Field Technicians (from database):\n";
    echo str_pad("ID", 5) . str_pad("Name", 30) . str_pad("Email", 30) . str_pad("Parent ID", 12) . "\n";
    echo str_repeat("-", 80) . "\n";
    
    $stmt = $pdo->prepare("SELECT id, name, email, parent_id FROM users WHERE role = 'field_technical_team' AND deleted_at IS NULL");
    $stmt->execute();
    $techs = $stmt->fetchAll();
    
    foreach ($techs as $tech) {
        echo str_pad($tech['id'], 5) . 
             str_pad(substr($tech['name'], 0, 28), 30) . 
             str_pad(substr($tech['email'], 0, 28), 30) . 
             str_pad($tech['parent_id'] ?? 'NULL', 12) . "\n";
    }

    // 2. Query all admins/super_admins
    echo "\nAdministrators (from database):\n";
    echo str_pad("ID", 5) . str_pad("Name", 30) . str_pad("Email", 30) . str_pad("Role", 15) . "\n";
    echo str_repeat("-", 80) . "\n";
    
    $stmt2 = $pdo->prepare("SELECT id, name, email, role FROM users WHERE role IN ('admin', 'super_admin') AND deleted_at IS NULL");
    $stmt2->execute();
    $admins = $stmt2->fetchAll();
    
    foreach ($admins as $adm) {
        echo str_pad($adm['id'], 5) . 
             str_pad(substr($adm['name'], 0, 28), 30) . 
             str_pad(substr($adm['email'], 0, 28), 30) . 
             str_pad($adm['role'], 15) . "\n";
    }

} catch (\Exception $e) {
    echo "Database Connection or Query FAILED: " . $e->getMessage() . "\n";
}
