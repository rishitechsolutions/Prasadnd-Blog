<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/admin.php';
require_once __DIR__ . '/_layout.php';

start_secure_session();
try {
    if (current_admin() !== null) {
        redirect_to('/admin/index.php');
    }
    $pdo = db();
} catch (Throwable $error) {
    error_log('Article admin login unavailable: ' . $error->getMessage());
    http_response_code(503);
    admin_header('Admin unavailable');
    echo '<main class="admin-login"><h1>Admin unavailable</h1><p>The admin panel is temporarily unavailable.</p></main>';
    admin_footer();
    exit;
}

$flash = take_flash();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_valid_csrf();
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');

    try {
        if (login_is_rate_limited($pdo, $username, $ip)) {
            $flash = ['type' => 'error', 'message' => 'Too many login attempts. Wait 15 minutes and try again.'];
        } else {
            $statement = $pdo->prepare('SELECT id, username, password_hash FROM admins WHERE username = :username LIMIT 1');
            $statement->execute(['username' => $username]);
            $admin = $statement->fetch();

            if ($admin && password_verify($password, $admin['password_hash'])) {
                clear_login_failures($pdo, $username, $ip);
                session_regenerate_id(true);
                $_SESSION = ['admin_id' => (int) $admin['id'], 'csrf_token' => bin2hex(random_bytes(32))];
                redirect_to('/admin/index.php');
            }

            record_login_failure($pdo, $username, $ip);
            $flash = ['type' => 'error', 'message' => 'The username or password is incorrect.' ];
        }
    } catch (Throwable $error) {
        error_log('Article admin authentication failed: ' . $error->getMessage());
        $flash = ['type' => 'error', 'message' => 'Sign-in is temporarily unavailable. Please try again later.'];
    }
}

admin_header('Sign in');
?>
<main class="admin-login">
    <p class="admin-eyebrow">PRIVATE ACCESS</p>
    <h1>Welcome back</h1>
    <p class="admin-login-copy">Sign in to manage your articles.</p>
    <?php admin_flash($flash); ?>
    <form action="/admin/login.php" method="post">
        <?= csrf_input() ?>
        <div class="admin-field">
            <label for="username">Username</label>
            <input id="username" name="username" type="text" maxlength="80" autocomplete="username" required autofocus>
        </div>
        <div class="admin-field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required>
        </div>
        <p class="admin-auth-links admin-forgot-link"><a href="/admin/forgot-password.php">Forgot Password?</a></p>
        <button class="admin-button admin-button-primary" type="submit">Sign in to dashboard</button>
    </form>
</main>
<?php admin_footer(); ?>