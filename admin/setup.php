<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/admin.php';
require_once __DIR__ . '/_layout.php';

start_secure_session();
try {
    $pdo = db();
    $adminCount = (int) $pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn();
    $config = app_config();
} catch (Throwable $error) {
    error_log('Initial admin setup unavailable: ' . $error->getMessage());
    http_response_code(503);
    admin_header('Setup unavailable');
    echo '<main class="admin-login"><h1>Setup unavailable</h1><p>Initial setup is temporarily unavailable.</p></main>';
    admin_footer();
    exit;
}

if ($adminCount > 0 || !isset($config['admin_setup_token']) || strlen((string) $config['admin_setup_token']) < 32) {
    http_response_code(404);
    admin_header('Not found');
    echo '<main class="admin-login"><h1>Not found</h1><p>This setup page is disabled.</p></main>';
    admin_footer();
    exit;
}

$flash = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_valid_csrf();
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $setupToken = (string) ($_POST['setup_token'] ?? '');
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');

    if (login_is_rate_limited($pdo, '__initial_admin_setup__', $ip)) {
        $flash = ['type' => 'error', 'message' => 'Too many setup attempts. Wait 15 minutes and try again.'];
    } elseif (!hash_equals((string) $config['admin_setup_token'], $setupToken)) {
        record_login_failure($pdo, '__initial_admin_setup__', $ip);
        $flash = ['type' => 'error', 'message' => 'Setup token is not valid.'];
    } elseif (!preg_match('/^[A-Za-z0-9_.-]{3,80}$/', $username)) {
        $flash = ['type' => 'error', 'message' => 'Use 3 to 80 letters, numbers, dots, underscores, or hyphens for the username.'];
    } elseif (strlen($password) < 12) {
        $flash = ['type' => 'error', 'message' => 'Use a password with at least 12 characters.'];
    } else {
        try {
            $statement = $pdo->prepare('INSERT INTO admins (username, password_hash) VALUES (:username, :password_hash)');
            $statement->execute(['username' => $username, 'password_hash' => password_hash($password, PASSWORD_DEFAULT)]);
            clear_login_failures($pdo, '__initial_admin_setup__', $ip);
            session_regenerate_id(true);
            $_SESSION = ['admin_id' => (int) $pdo->lastInsertId(), 'csrf_token' => bin2hex(random_bytes(32))];
            redirect_to('/admin/index.php');
        } catch (Throwable $error) {
            error_log('Initial admin creation failed: ' . $error->getMessage());
            $flash = ['type' => 'error', 'message' => 'The account could not be created. Check that the username is unique and try again.'];
        }
    }
}

admin_header('Create first administrator');
?>
<main class="admin-login">
    <h1>Create first administrator</h1>
    <p>This one-time setup is available only while no administrator account exists.</p>
    <?php admin_flash($flash); ?>
    <form action="/admin/setup.php" method="post">
        <?= csrf_input() ?>
        <div class="admin-field">
            <label for="setup_token">One-time setup token</label>
            <input id="setup_token" name="setup_token" type="password" autocomplete="off" required>
        </div>
        <div class="admin-field">
            <label for="username">Username</label>
            <input id="username" name="username" type="text" minlength="3" maxlength="80" autocomplete="username" required>
        </div>
        <div class="admin-field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" minlength="12" autocomplete="new-password" required>
        </div>
        <button class="admin-button admin-button-primary" type="submit">Create administrator</button>
    </form>
</main>
<?php admin_footer(); ?>