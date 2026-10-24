<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/password-reset.php';
require_once __DIR__ . '/_layout.php';

start_secure_session();
$flash = null;
$sent = false;
$mailReady = false;

try {
    $pdo = db();
    $mailReady = reset_mail_is_configured();
} catch (Throwable $error) {
    error_log('Admin password reset unavailable: ' . $error->getMessage());
    http_response_code(503);
    admin_header('Admin unavailable');
    echo '<main class="admin-login"><h1>Admin unavailable</h1><p>The admin panel is temporarily unavailable.</p></main>';
    admin_footer();
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $submittedCsrf = $_POST['csrf_token'] ?? '';
    if (!is_string($submittedCsrf) || !hash_equals(csrf_token(), $submittedCsrf)) {
        reset_diag('password_reset_stopped_csrf_failed');
    }
    require_valid_csrf();
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $limitKey = '__admin_reset_request__';

    try {
        if (!$mailReady) {
            reset_diag('password_reset_stopped_mail_not_configured');
            $flash = ['type' => 'error', 'message' => 'Password reset email is not configured on this server. Contact the site owner.'];
        } elseif (login_is_rate_limited($pdo, $limitKey, $ip)) {
            reset_diag('password_reset_stopped_rate_limited');
            $flash = ['type' => 'error', 'message' => 'Too many reset requests. Wait 15 minutes and try again.'];
        } else {
            record_login_failure($pdo, $limitKey, $ip);
            $admin = fixed_admin($pdo);
            if ($admin) {
                send_admin_reset_email($pdo, $admin);
            } else {
                reset_diag('password_reset_stopped_admin_not_found', ['expected_username_configured' => 'yes']);
            }
            $sent = true;
        }
    } catch (Throwable $error) {
        reset_diag('password_reset_stopped_exception', ['exception' => get_class($error), 'message' => $error->getMessage()]);
        error_log('Admin password reset request failed: ' . $error->getMessage());
        $flash = ['type' => 'error', 'message' => 'Password reset is temporarily unavailable. Please try again later.'];
    }
}

admin_header('Forgot password');
?>
<main class="admin-login">
    <p class="admin-eyebrow">ACCOUNT RECOVERY</p>
    <h1>Forgot password?</h1>
    <p class="admin-login-copy">For security, a one-time reset link is emailed to the registered admin address. It expires in <?= ADMIN_RESET_TOKEN_TTL_MINUTES ?> minutes.</p>
    <?php admin_flash($flash); ?>
    <?php if ($sent): ?>
        <?php admin_flash(['type' => 'success', 'message' => 'If the admin account is set up for email recovery, a reset link has been sent to its registered address.']); ?>
    <?php endif; ?>
    <form action="/admin/forgot-password.php" method="post" data-loading-form>
        <?= csrf_input() ?>
        <button class="admin-button admin-button-primary" type="submit" <?= $mailReady ? '' : 'disabled' ?>>Email me a reset link</button>
    </form>
    <p class="admin-auth-links"><a href="/admin/login.php">Back to Login</a></p>
</main>
<script>
document.querySelectorAll('[data-loading-form]').forEach(function (form) {
    form.addEventListener('submit', function () {
        var button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = 'Sending…';
    });
});
</script>
<?php admin_footer(); ?>
