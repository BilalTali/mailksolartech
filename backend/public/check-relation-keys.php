<?php
header('Content-Type: application/json; charset=utf-8');

$pathsToTry = [
    __DIR__ . '/../vendor/autoload.php',
    __DIR__ . '/../../vendor/autoload.php',
];

$autoloadPath = null;
foreach ($pathsToTry as $path) {
    if (file_exists($path)) {
        $autoloadPath = $path;
        break;
    }
}

if (!$autoloadPath) {
    die(json_encode(['error' => 'Autoload not found']));
}

require $autoloadPath;

$bootstrapPaths = [
    __DIR__ . '/../bootstrap/app.php',
    __DIR__ . '/../../bootstrap/app.php',
];

$bootstrapPath = null;
foreach ($bootstrapPaths as $path) {
    if (file_exists($path)) {
        $bootstrapPath = $path;
        break;
    }
}

if (!$bootstrapPath) {
    die(json_encode(['error' => 'Bootstrap not found']));
}

$app = require_once $bootstrapPath;
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::roleEnumerator()
    ->with(['parentAgent', 'createdBySuperAgent', 'parent'])
    ->whereNotNull('created_by_agent_id')
    ->first();

echo json_encode($user, JSON_PRETTY_PRINT);
