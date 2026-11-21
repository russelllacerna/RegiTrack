<?php
// GET -> active document types students can request.
require __DIR__ . '/config.php';
require_method('GET');
require_role(['student', 'registrar', 'admin']);

$rows = db()->query(
    'SELECT document_type_id AS id, name FROM document_types WHERE is_active = 1 ORDER BY document_type_id'
)->fetchAll();
respond(['documentTypes' => $rows]);
