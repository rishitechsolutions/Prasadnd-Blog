<?php
declare(strict_types=1);

require_once __DIR__ . '/security.php';

const VISIT_COUNTER_SESSION_KEY = 'visit_counted';

function visit_counter_is_bot(): bool
{
    $agent = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
    return $agent === '' || preg_match('/bot|crawl|spider|slurp|preview|monitor|uptime|curl|wget|python-requests|headless/i', $agent) === 1;
}

/**
 * Counts one visit per PHP session. Call only for eligible public HTML GET requests,
 * before any output. Never throws: failures leave the page working.
 */
function visit_counter_record(): void
{
    try {
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET' || visit_counter_is_bot()) {
            return;
        }

        // Keep static pages cacheable by the browser's rules rather than PHP's default no-store.
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_cache_limiter('');
        }
        start_secure_session();

        if (!empty($_SESSION[VISIT_COUNTER_SESSION_KEY])) {
            return;
        }

        $pdo = db();
        $update = $pdo->prepare('UPDATE site_visit_counter SET total = total + 1 WHERE id = 1');
        $update->execute();
        if ($update->rowCount() === 0) {
            // Row missing (migration seed not run): create it atomically, no DDL on page requests.
            $pdo->prepare('INSERT INTO site_visit_counter (id, total) VALUES (1, 1) ON DUPLICATE KEY UPDATE total = total + 1')->execute();
        }
        $_SESSION[VISIT_COUNTER_SESSION_KEY] = true;
    } catch (Throwable $error) {
        error_log('Visit counter increment failed: ' . get_class($error));
    }
}

function visit_counter_total(): ?int
{
    try {
        $value = db()->query('SELECT total FROM site_visit_counter WHERE id = 1')->fetchColumn();
        return $value === false ? null : (int) $value;
    } catch (Throwable $error) {
        error_log('Visit counter read failed: ' . get_class($error));
        return null;
    }
}

// Text appended right after the copyright text; empty when the count is unavailable.
function visit_counter_footer_text(): string
{
    $total = visit_counter_total();
    return $total === null ? '' : ' | Total Visits: ' . h(number_format($total));
}

function visit_counter_inject_footer(string $html): string
{
    $suffix = visit_counter_footer_text();
    if ($suffix === '') {
        return $html;
    }

    return preg_replace_callback(
        '#(<p class="footer-left">)(.*?)(</p>)#s',
        static fn (array $m): string => $m[1] . $m[2] . $suffix . $m[3],
        $html,
        1
    ) ?? $html;
}
