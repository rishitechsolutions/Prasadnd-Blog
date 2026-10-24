<?php
declare(strict_types=1);

require_once __DIR__ . '/admin.php';

const ADMIN_FIXED_USERNAME = 'prasad@prasadnd.com';
const ADMIN_RESET_TOKEN_TTL_MINUTES = 30;
const ADMIN_RESET_COOLDOWN_SECONDS = 120;
const ADMIN_RESET_MIN_LENGTH = 8;

function reset_mail_is_configured(): bool
{
    $from = (string) (app_config()['mail_from'] ?? '');
    return filter_var($from, FILTER_VALIDATE_EMAIL) !== false;
}

function reset_token_hash(string $token): string
{
    return hash('sha256', $token);
}

function fixed_admin(PDO $pdo): ?array
{
    $statement = $pdo->prepare('SELECT id, username FROM admins WHERE username = :username LIMIT 1');
    $statement->execute(['username' => ADMIN_FIXED_USERNAME]);
    $admin = $statement->fetch();
    return $admin ?: null;
}

// Creates a single-use token and emails it to the fixed admin address only.
function send_admin_reset_email(PDO $pdo, array $admin): bool
{
    $recent = $pdo->prepare('SELECT COUNT(*) FROM admin_password_resets WHERE admin_id = :id AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL ' . ADMIN_RESET_COOLDOWN_SECONDS . ' SECOND)');
    $recent->execute(['id' => $admin['id']]);
    if ((int) $recent->fetchColumn() > 0) {
        return true;
    }

    $token = bin2hex(random_bytes(32));
    $pdo->prepare('DELETE FROM admin_password_resets WHERE admin_id = :id')->execute(['id' => $admin['id']]);
    $pdo->prepare(
        'INSERT INTO admin_password_resets (admin_id, token_hash, expires_at, created_at)
         VALUES (:id, :hash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ' . ADMIN_RESET_TOKEN_TTL_MINUTES . ' MINUTE), UTC_TIMESTAMP())'
    )->execute(['id' => $admin['id'], 'hash' => reset_token_hash($token)]);

    $config = app_config();
    $base = rtrim((string) ($config['site_url'] ?? ''), '/');
    if ($base === '') {
        $base = 'https://' . preg_replace('/[^A-Za-z0-9.\-:]/', '', (string) ($_SERVER['HTTP_HOST'] ?? ''));
    }
    $link = $base . '/admin/reset-password.php?token=' . $token;

    $body = "A password reset was requested for the admin dashboard.\r\n\r\n"
        . "Open this link to choose a new password (valid for " . ADMIN_RESET_TOKEN_TTL_MINUTES . " minutes, single use):\r\n"
        . $link . "\r\n\r\nIf you did not request this, ignore this email; your password is unchanged.\r\n";
    $from = (string) $config['mail_from'];
    $headers = "From: Admin Dashboard <{$from}>\r\nContent-Type: text/plain; charset=UTF-8\r\n";

    $sent = mail(ADMIN_FIXED_USERNAME, 'Reset your admin password', $body, $headers);
    if (!$sent) {
        $pdo->prepare('DELETE FROM admin_password_resets WHERE admin_id = :id')->execute(['id' => $admin['id']]);
        error_log('Admin password reset email could not be sent.');
    }
    return $sent;
}

function find_valid_reset(PDO $pdo, string $token): ?array
{
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
        return null;
    }
    $statement = $pdo->prepare(
        'SELECT r.id, r.admin_id FROM admin_password_resets r
         JOIN admins a ON a.id = r.admin_id
         WHERE r.token_hash = :hash AND r.expires_at > UTC_TIMESTAMP() AND a.username = :username LIMIT 1'
    );
    $statement->execute(['hash' => reset_token_hash($token), 'username' => ADMIN_FIXED_USERNAME]);
    $row = $statement->fetch();
    return $row ?: null;
}

function reset_password_validation_error(string $password, string $confirm): ?string
{
    if ($password === '' || $confirm === '') {
        return 'Both password fields are required.';
    }
    if (strlen($password) < ADMIN_RESET_MIN_LENGTH) {
        return 'Use a password with at least ' . ADMIN_RESET_MIN_LENGTH . ' characters.';
    }
    if (strlen($password) > 200) {
        return 'The password is too long.';
    }
    if (!hash_equals($password, $confirm)) {
        return 'The new password and confirmation do not match.';
    }
    return null;
}
