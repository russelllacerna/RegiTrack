<?php
// POST {username, password} -> signs the user in (FR1).
require __DIR__ . '/config.php';
require_method('POST');

$body = json_body();
$username = strtolower(str_field($body, 'username', 50));
$password = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';
if ($password === '') {
    respond(['error' => 'Missing required field: password.'], 422);
}

$stmt = db()->prepare(
    'SELECT user_id, full_name, username, role, account_status, can_approve, password_hash
       FROM users WHERE username = ?'
);
$stmt->execute([$username]);
$user = $stmt->fetch();

// Same message for a wrong username or a wrong password, so accounts cannot be guessed.
if (!$user || !password_verify($password, $user['password_hash'])) {
    respond(['error' => 'Invalid username or password.'], 401);
}
if ($user['account_status'] !== 'Active') {
    respond(['error' => 'This account is inactive. Please contact the Registrar\'s Office.'], 403);
}

session_regenerate_id(true); // new session ID after login prevents session fixation
$_SESSION['user_id'] = (int) $user['user_id'];

respond(['user' => public_user($user)]);
