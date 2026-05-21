<?php

/**
 * MalikSolarTech — Temporary Live Server Raw DB Diagnostics (Multi-path version)
 */

header('Content-Type: text/plain; charset=utf-8');

echo "==================================================\n";
echo " MalikSolarTech Live Server Raw DB Diagnostics\n";
echo " Time: " . date('Y-m-d H:i:s') . "\n";
echo "==================================================\n\n";

$pathsToTry = [
    __DIR__ . '/../.env',
    __DIR__ . '/../../.env',
    '/home/u596750690/domains/maliksolartech.com/public_html/backend/.env',
    '/home/u596750690/domains/maliksolartech.com/public_html/.env'
];

$envPath = null;
echo "Scanning for .env file:\n";
foreach ($pathsToTry as $path) {
    $real = realpath($path);
    $exists = file_exists($path) ? 'YES' : 'NO';
    $readable = is_readable($path) ? 'YES' : 'NO';
    echo "Path: $path\n  Exists: $exists, Readable: $readable, RealPath: " . ($real ?: 'N/A') . "\n";
    if ($exists === 'YES' && $readable === 'YES' && !$envPath) {
        $envPath = $path;
    }
}

if (!$envPath) {
    die("\nError: No readable .env file found in any scanned path.\n");
}

echo "\nUsing .env file at: $envPath\n\n";

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

try {
    $dsn = "mysql:host=" . $dbConfig['DB_HOST'] . ";port=" . $dbConfig['DB_PORT'] . ";dbname=" . $dbConfig['DB_DATABASE'] . ";charset=utf8mb4";
    $pdo = new PDO($dsn, $dbConfig['DB_USERNAME'], $dbConfig['DB_PASSWORD'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5
    ]);
    echo "Database Connection: SUCCESS\n\n";

    // Perform correction of legacy technicians ownership to Latif Ahmad Tali (ID 2)
    echo "Fixing ownership of legacy technicians (ID 21 & 22) -> Latif Ahmad Tali (ID 2):\n";
    $affected = $pdo->exec("UPDATE users SET parent_id = 2 WHERE id IN (21, 22) AND role = 'field_technical_team' AND parent_id IS NULL");
    echo "Rows updated: $affected\n\n";

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
