<?php
declare(strict_types=1);

// Serves the static public .html pages (via the Apache rewrite) so each eligible visit can be counted
// and the footer can show the stored total. URLs visitors see do not change.
require_once __DIR__ . '/includes/visit-counter.php';

$page = (string) ($_GET['p'] ?? 'index');
$file = preg_match('#^(?:articles/)?[A-Za-z0-9_-]+$#', $page) === 1 ? __DIR__ . '/' . $page . '.html' : '';

if ($file === '' || !is_file($file)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=UTF-8');
    exit('Page not found.');
}

visit_counter_record();
if (session_status() === PHP_SESSION_ACTIVE) {
    session_write_close();
}

$html = (string) file_get_contents($file);
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: private, no-cache');
header('X-Content-Type-Options: nosniff');
echo visit_counter_inject_footer($html);
