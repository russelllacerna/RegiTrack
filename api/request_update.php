<?php
// POST {reference, status, releaseDate?, notes?} -> Registrar Staff update a request (FR8, FR9 release date).
// Every change is written to status_history (FR11).
require __DIR__ . '/config.php';
require_method('POST');

$user = require_role(['registrar']);
$body = json_body();

$reference = str_field($body, 'reference', 20);
$status    = str_field($body, 'status', 30);
$notes     = str_field($body, 'notes', 1000, false);
$release   = str_field($body, 'releaseDate', 10, false);

if (!in_array($status, STAFF_SETTABLE_STATUSES, true)) {
    respond(['error' => 'Final approval and release must be recorded through the approval queue.'], 422);
}
if ($release !== null) {
    $d = DateTime::createFromFormat('Y-m-d', $release);
    if (!$d || $d->format('Y-m-d') !== $release) {
        respond(['error' => 'Release date must be a valid date.'], 422);
    }
}

$stmt = db()->prepare('SELECT request_id, status, release_date FROM requests WHERE reference_number = ?');
$stmt->execute([$reference]);
$req = $stmt->fetch();
if (!$req) {
    respond(['error' => 'Request not found.'], 404);
}
if (in_array($req['status'], ['Approved for Release', 'Released'], true)) {
    respond(['error' => 'This request has already been approved or released.'], 409);
}

$pdo = db();
$pdo->beginTransaction();
try {
    $pdo->prepare(
        'UPDATE requests SET status = ?, release_date = ?, remarks = ?, assigned_staff_id = ?, updated_at = ?
          WHERE request_id = ?'
    )->execute([$status, $release ?? $req['release_date'], $notes, $user['user_id'], now(), $req['request_id']]);
    add_history((int) $req['request_id'], $status, $notes, (int) $user['user_id']);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    error_log('RegiTrack update failed: ' . $e->getMessage());
    respond(['error' => 'The update could not be saved.'], 500);
}
respond(['ok' => true]);
