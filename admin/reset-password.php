<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/password-reset.php';
require_once __DIR__ . '/_layout.php';

header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');
start_secure_session();

try {
    $pdo = db();
} catch (Throwable $error) {
    error_log('Admin password reset unavailable: ' . $error->getMessage());
    http_response_code(503);
    admin_header('Admin unavailable');
    echo '<main class="admin-login"><h1>Admin unavailable</h1><p>The admin panel is temporarily unavailable.</p></main>';
    admin_footer();
    exit;
}

$token = (string) ($_POST['token'] ?? $_GET['token'] ?? '');
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$limitKey = '__admin_reset_verify__';
$flash = null;
$valid = false;

try {
    if (login_is_rate_limited($pdo, $limitKey, $ip)) {
        $flash = ['type' => 'error', 'message' => 'Too many attempts. Wait 15 minutes and try again.'];
    } else {
        $reset = find_valid_reset($pdo, $token);
        if ($reset === null) {
            record_login_failure($pdo, $limitKey, $ip);
            $flash = ['type' => 'error', 'message' => 'This reset link is invalid or has expired. Request a new one.'];
        } else {
            $valid = true;
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                require_valid_csrf();
                $password = (string) ($_POST['password'] ?? '');
                $confirm = (string) ($_POST['confirm_password'] ?? '');
                $problem = reset_password_validation_error($password, $confirm);

                if ($problem !== null) {
                    $flash = ['type' => 'error', 'message' => $problem];
                } else {
                    $pdo->beginTransaction();
                    // Consuming the token first makes it single-use even under concurrent requests.
                    $consume = $pdo->prepare('DELETE FROM admin_password_resets WHERE id = :id');
                    $consume->execute(['id' => $reset['id']]);
                    if ($consume->rowCount() !== 1) {
                        $pdo->rollBack();
                        $valid = false;
                        $flash = ['type' => 'error', 'message' => 'This reset link is invalid or has expired. Request a new one.'];
                    } else {
                        $update = $pdo->prepare('UPDATE admins SET password_hash = :hash WHERE id = :id AND username = :username');
                        $update->execute([
                            'hash' => password_hash($password, PASSWORD_DEFAULT),
                            'id' => $reset['admin_id'],
                            'username' => ADMIN_FIXED_USERNAME,
                        ]);
                        $pdo->prepare('DELETE FROM admin_password_resets WHERE admin_id = :id')->execute(['id' => $reset['admin_id']]);
                        $pdo->commit();

                        clear_login_failures($pdo, ADMIN_FIXED_USERNAME, $ip);
                        session_regenerate_id(true);
                        $_SESSION = ['csrf_token' => bin2hex(random_bytes(32))];
                        set_flash('success', 'Password changed successfully. Please log in with your new password.');
                        redirect_to('/admin/login.php');
                    }
                }
            }
        }
    }
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Admin password reset failed: ' . $error->getMessage());
    $valid = false;
    $flash = ['type' => 'error', 'message' => 'Password reset is temporarily unavailable. Please try again later.'];
}

admin_header('Reset Admin Password');
?>
<main class="admin-login">
    <p class="admin-eyebrow">ACCOUNT RECOVERY</p>
    <h1>Reset Admin Password</h1>
    <?php admin_flash($flash); ?>
    <?php if ($valid): ?>
    <form action="/admin/reset-password.php" method="post" id="reset-form" data-loading-form>
        <?= csrf_input() ?>
        <input type="hidden" name="token" value="<?= h($token) ?>">
        <div class="admin-field">
            <label for="password">New Password</label>
            <div class="admin-password-wrap">
                <input id="password" name="password" type="password" minlength="<?= ADMIN_RESET_MIN_LENGTH ?>" maxlength="200" autocomplete="new-password" required autofocus>
                <button class="admin-password-toggle" type="button" data-toggle="password" aria-label="Show password">Show</button>
            </div>
            <span class="admin-hint">At least <?= ADMIN_RESET_MIN_LENGTH ?> characters.</span>
        </div>
        <div class="admin-field">
            <label for="confirm_password">Confirm New Password</label>
            <div class="admin-password-wrap">
                <input id="confirm_password" name="confirm_password" type="password" minlength="<?= ADMIN_RESET_MIN_LENGTH ?>" maxlength="200" autocomplete="new-password" required>
                <button class="admin-password-toggle" type="button" data-toggle="confirm_password" aria-label="Show password">Show</button>
            </div>
        </div>
        <p class="admin-hint" id="reset-client-error" role="alert" style="color:#8e2118"></p>
        <button class="admin-button admin-button-primary" type="submit">Reset Password</button>
    </form>
    <?php else: ?>
        <p class="admin-auth-links"><a href="/admin/forgot-password.php">Request a new reset link</a></p>
    <?php endif; ?>
    <p class="admin-auth-links"><a href="/admin/login.php">Back to Login</a></p>
</main>
<script>
document.querySelectorAll('.admin-password-toggle').forEach(function (button) {
    button.addEventListener('click', function () {
        var input = document.getElementById(button.dataset.toggle);
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        button.textContent = show ? 'Hide' : 'Show';
        button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
});
var resetForm = document.getElementById('reset-form');
if (resetForm) {
    resetForm.addEventListener('submit', function (event) {
        var message = document.getElementById('reset-client-error');
        var password = document.getElementById('password').value;
        message.textContent = '';
        if (password.length < <?= ADMIN_RESET_MIN_LENGTH ?>) {
            message.textContent = 'Use a password with at least <?= ADMIN_RESET_MIN_LENGTH ?> characters.';
            event.preventDefault();
        } else if (password !== document.getElementById('confirm_password').value) {
            message.textContent = 'The new password and confirmation do not match.';
            event.preventDefault();
        } else {
            var submit = resetForm.querySelector('button[type="submit"]');
            submit.disabled = true;
            submit.textContent = 'Resetting…';
        }
    });
}
</script>
<?php admin_footer(); ?>
