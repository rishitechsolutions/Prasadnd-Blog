<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/security.php';

function admin_header(string $title, ?array $admin = null): void
{
    ?>
    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title><?= h($title) ?> | Admin Dashboard</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/admin/admin.css">
    </head>
    <body>
        <header class="admin-topbar">
            <a class="admin-brand" href="<?= $admin ? '/admin/index.php' : '/' ?>">
                <span class="admin-brand-mark"><img src="/assets/newlogo.JPEG" alt=""></span>
                <span class="admin-brand-copy">
                    <strong>Admin Dashboard</strong>
                    <small>PRASAD ND · PORTFOLIO</small>
                </span>
            </a>
            <?php if ($admin): ?>
            <nav class="admin-nav" aria-label="Admin navigation">
                <a class="admin-nav-link" href="/admin/index.php">Overview</a>
                <a class="admin-nav-link" href="/beyond-work.html">View website</a>
                <form action="/admin/logout.php" method="post">
                    <?= csrf_input() ?>
                    <button class="admin-button" type="submit">Log out</button>
                </form>
            </nav>
            <?php else: ?>
                <a class="admin-nav-link admin-return-link" href="/">Back to portfolio</a>
            <?php endif; ?>
        </header>
    <?php
}

function admin_flash(?array $flash): void
{
    if (!$flash || !isset($flash['message'])) {
        return;
    }
    $isError = ($flash['type'] ?? '') === 'error';
    ?>
    <div class="admin-flash<?= $isError ? ' admin-flash-error' : '' ?>" role="status">
        <?= h((string) $flash['message']) ?>
    </div>
    <?php
}

function admin_footer(bool $withEditor = false): void
{
    if ($withEditor) {
        echo '<script src="/admin/admin.js" defer></script>';
    }
    echo '</body></html>';
}