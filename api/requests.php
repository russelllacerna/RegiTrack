<?php
// GET  -> students: their own requests only (FR5, FR14); staff and admin: all requests (FR7).
// POST -> students submit a new request and receive a reference number (FR2, FR4).
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user = require_role(['student', 'registrar', 'admin']);

    if ($user['role'] === 'student') {
        $stmt = db()->prepare(REQUEST_SELECT . ' WHERE sp.user_id = ? ORDER BY r.submitted_at DESC, r.request_id DESC');
        $stmt->execute([$user['user_id']]);
    } else {
        $stmt = db()->query(REQUEST_SELECT . ' ORDER BY r.submitted_at DESC, r.request_id DESC');
    }
    respond(['requests' => array_map('request_out', $stmt->fetchAll())]);
}

require_method('POST');
$user = require_role(['student']);
$body = json_body();

// Student details come from the student's own profile, not from the form,
// so a student cannot file a request under someone else's name or number.
$profileId = student_profile_id((int) $user['user_id']);

$docTypeId = filter_var($body['documentTypeId'] ?? null, FILTER_VALIDATE_INT);
if ($docTypeId === false || $docTypeId === null) {
    respond(['error' => 'Select a document type.'], 422);
}
$stmt = db()->prepare('SELECT 1 FROM document_types WHERE document_type_id = ? AND is_active = 1');
$stmt->execute([$docTypeId]);
if (!$stmt->fetchColumn()) {
    respond(['error' => 'That document type is not available.'], 422);
}

$purpose = str_field($body, 'purpose', 255);
$notes   = str_field($body, 'notes', 1000, false);
if (empty($body['privacyConsent'])) {
    respond(['error' => 'Please agree to the privacy notice before submitting.'], 422);
}

$pdo = db();
$pdo->beginTransaction();
try {
    $ts = now();
    // Insert with a temporary unique value, then derive the reference from the new ID.
    $pdo->prepare(
        'INSERT INTO requests (reference_number, student_profile_id, document_type_id, purpose,
                               student_notes, status, submitted_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute(['TMP-' . bin2hex(random_bytes(6)), $profileId, $docTypeId, $purpose, $notes, 'Submitted', $ts, $ts]);
    $requestId = (int) $pdo->lastInsertId();
    $reference = sprintf('RT-%s-%04d', date('Y'), $requestId);
    $pdo->prepare('UPDATE requests SET reference_number = ? WHERE request_id = ?')->execute([$reference, $requestId]);
    add_history($requestId, 'Submitted', 'Request submitted', (int) $user['user_id']);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    error_log('RegiTrack submit failed: ' . $e->getMessage());
    respond(['error' => 'The request could not be saved. Please try again.'], 500);
}

respond(['reference' => $reference], 201);
