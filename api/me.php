<?php
// GET -> the signed-in user, plus the student profile for students.
require __DIR__ . '/config.php';
require_method('GET');

$user = require_role(['student', 'registrar', 'admin']);
$out = ['user' => public_user($user)];

if ($user['role'] === 'student') {
    $stmt = db()->prepare(
        'SELECT student_number, course, years_attended, program_level, coordinator
           FROM student_profiles WHERE user_id = ?'
    );
    $stmt->execute([$user['user_id']]);
    $p = $stmt->fetch();
    $out['profile'] = $p ? [
        'studentNumber' => $p['student_number'],
        'course'        => $p['course'],
        'yearAttended'  => $p['years_attended'],
        'programLevel'  => $p['program_level'],
        'coordinator'   => $p['coordinator'] ?? '',
    ] : null;
}
respond($out);
