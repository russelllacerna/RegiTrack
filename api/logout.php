<?php
// POST -> signs the current user out.
require __DIR__ . '/config.php';
require_method('POST');

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 42000, 'path' => $p['path'], 'domain' => $p['domain'],
        'secure' => $p['secure'], 'httponly' => $p['httponly'], 'samesite' => $p['samesite'],
    ]);
}
session_destroy();
respond(['ok' => true]);
