<?php
// POST {reference} -> final approval, only for staff accounts with approval permission (FR10).
require __DIR__ . '/config.php';
require_method('POST');

$user = require_role(['registrar']);
if (!$user['can_approve']) {
    respond(['error' => 'Only the University Registrar or an authorized delegate can approve release.'], 403);
}
$reference = str_field(json_body(), 'reference', 20);

$stmt = db()->prepare('SELECT request_id, status FROM requests WHERE reference_number = ?');
$stmt->execute([$reference]);
$req = $stmt->fetch();
if (!$req) {
    respond(['error' => 'Request not found.'], 404);
}
if (!in_array($req['status'], APPROVABLE_STATUSES, true)) {
    respond(['error' => 'Only requests pending approval can be approved.'], 409);
}

$pdo = db();
$pdo->beginTransaction();
try {
    $pdo->prepare('UPDATE requests SET status = ?, updated_at = ? WHERE request_id = ?')
        ->execute(['Approved for Release', now(), $req['request_id']]);
    add_history((int) $req['request_id'], 'Approved for Release', 'Final approval recorded', (int) $user['user_id']);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    error_log('RegiTrack approve failed: ' . $e->getMessage());
    respond(['error' => 'The approval could not be saved.'], 500);
}
respond(['ok' => true]);
