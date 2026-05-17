<?php

/**
 * OPcache Invalidation Endpoint
 * 
 * Flushes LiteSpeed/PHP-FPM in-memory RAM cache after automated Git/SSH deployments
 * to prevent stale bytecode execution (500 errors, Class not found, etc.).
 */

if (!isset($_GET['token']) || empty($_GET['token'])) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: No token provided']);
    exit;
}

// Fallback token matches the GitHub Actions cURL secret
$expectedToken = getenv('OPCACHE_RESET_TOKEN');
if (empty($expectedToken)) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'OPcache reset not configured. Set OPCACHE_RESET_TOKEN in server environment.']);
    exit;
}

if ($_GET['token'] !== $expectedToken) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Invalid token']);
    exit;
}

$opcacheEnabled = function_exists('opcache_reset') && function_exists('opcache_get_status') && call_user_func('opcache_get_status') !== false;

$result = [
    'status' => 'success',
    'timestamp' => date('Y-m-d H:i:s'),
    'opcache_enabled' => $opcacheEnabled,
];

if ($opcacheEnabled) {
    call_user_func('opcache_reset');
    $result['message'] = 'OPcache reset successfully';
} else {
    $result['message'] = 'OPcache is not enabled or not accessible in this SAPI context';
}

header('Content-Type: application/json');
echo json_encode($result);
