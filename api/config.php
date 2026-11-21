<?php
// RegiTrack API - shared configuration and helpers.
// Every endpoint includes this file first.

declare(strict_types=1);

// Database settings (XAMPP defaults: user "root", empty password).
// To use different settings without editing this file, create api/config.local.php
// that defines $DB_DSN, $DB_USER and $DB_PASS (that file is ignored by Git).
$DB_DSN  = 'mysql:host=127.0.0.1;dbname=regitrack;charset=utf8mb4';
$DB_USER = 'root';
$DB_PASS = '';
if (is_file(__DIR__ . '/config.local.php')) {
    require __DIR__ . '/config.local.php';
}

date_default_timezone_set('Asia/Manila');

// Session cookie: not readable by JavaScript, not sent from other sites.
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Strict',
    'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);
session_name('REGITRACKSESSID');
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

// Request statuses (Chapter 2, Table 11).
const STAFF_SETTABLE_STATUSES = [
    'Verification', 'Requirements Incomplete', 'Processing',
    'Pending Approval', 'Ready for Release', 'Rejected',
];
const APPROVABLE_STATUSES = ['Pending Approval', 'Ready for Release'];

function db(): PDO
{
    static $pdo = null;
    global $DB_DSN, $DB_USER, $DB_PASS;
    if ($pdo === null) {
        try {
            $pdo = new PDO($DB_DSN, $DB_USER, $DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            error_log('RegiTrack DB connection failed: ' . $e->getMessage());
            respond(['error' => 'Cannot connect to the database. Is MySQL running and was database/regitrack.sql imported?'], 500);
        }
    }
    return $pdo;
}

function respond(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function now(): string
{
    return date('Y-m-d H:i:s');
}

function require_method(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        respond(['error' => 'Method not allowed.'], 405);
    }
}

// Reads a JSON request body. Requiring JSON also blocks plain cross-site form posts.
function json_body(): array
{
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($type, 'application/json') !== 0) {
        respond(['error' => 'Expected a JSON request body.'], 415);
    }
    $data = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($data)) {
        respond(['error' => 'Invalid JSON.'], 400);
    }
    return $data;
}

function str_field(array $data, string $key, int $maxLength, bool $required = true): ?string
{
    $value = isset($data[$key]) && is_scalar($data[$key]) ? trim((string) $data[$key]) : '';
    if ($value === '') {
        if ($required) {
            respond(['error' => "Missing required field: $key."], 422);
        }
        return null;
    }
    if (mb_strlen($value) > $maxLength) {
        respond(['error' => "Field $key is too long (max $maxLength characters)."], 422);
    }
    return $value;
}

// Loads the logged-in user from the database on every call, so a deactivated
// account or a changed role takes effect immediately.
function current_user(): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    $stmt = db()->prepare(
        'SELECT user_id, full_name, username, role, account_status, can_approve
           FROM users WHERE user_id = ?'
    );
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    if (!$user || $user['account_status'] !== 'Active') {
        $_SESSION = [];
        session_destroy();
        return null;
    }
    return $user;
}

// Server-side role check (FR14). Pages may hide buttons, but only this decides access.
function require_role(array $roles): array
{
    $user = current_user();
    if ($user === null) {
        respond(['error' => 'Please sign in.'], 401);
    }
    if (!in_array($user['role'], $roles, true)) {
        respond(['error' => 'You do not have access to this action.'], 403);
    }
    return $user;
}

function public_user(array $user): array
{
    return [
        'username'   => $user['username'],
        'name'       => $user['full_name'],
        'role'       => $user['role'],
        'canApprove' => (bool) $user['can_approve'],
    ];
}

function student_profile_id(int $userId): int
{
    $stmt = db()->prepare('SELECT student_profile_id FROM student_profiles WHERE user_id = ?');
    $stmt->execute([$userId]);
    $id = $stmt->fetchColumn();
    if ($id === false) {
        respond(['error' => 'No student profile is linked to this account.'], 409);
    }
    return (int) $id;
}

function add_history(int $requestId, string $status, ?string $remarks, int $userId): void
{
    db()->prepare(
        'INSERT INTO status_history (request_id, status, remarks, changed_by, changed_at)
         VALUES (?, ?, ?, ?, ?)'
    )->execute([$requestId, $status, $remarks, $userId, now()]);
}

// Shapes a request row the way the existing front-end pages expect it.
function request_out(array $r): array
{
    return [
        'id'            => $r['reference_number'],
        'student'       => $r['full_name'],
        'username'      => $r['username'],
        'studentNumber' => $r['student_number'],
        'course'        => $r['course'],
        'yearAttended'  => $r['years_attended'],
        'document'      => $r['document_name'],
        'purpose'       => $r['purpose'],
        'studentNotes'  => $r['student_notes'] ?? '',
        'status'        => $r['status'],
        'submitted'     => substr($r['submitted_at'], 0, 10),
        'releaseDate'   => $r['release_date'] ?? '',
        'notes'         => $r['remarks'] ?? '',
        'requirements'  => ((int) $r['attachment_count']) > 0
            ? $r['attachment_count'] . ' file(s) uploaded'
            : 'No file uploaded yet',
    ];
}

const REQUEST_SELECT = '
    SELECT r.request_id, r.reference_number, r.purpose, r.student_notes, r.status,
           r.release_date, r.remarks, r.submitted_at,
           u.full_name, u.username,
           sp.student_number, sp.course, sp.years_attended,
           dt.name AS document_name,
           (SELECT COUNT(*) FROM attachments a WHERE a.request_id = r.request_id) AS attachment_count
      FROM requests r
      JOIN student_profiles sp ON sp.student_profile_id = r.student_profile_id
      JOIN users u             ON u.user_id = sp.user_id
      JOIN document_types dt   ON dt.document_type_id = r.document_type_id';
