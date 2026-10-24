<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    ini_set('display_errors', '0');
    set_exception_handler(static function (Throwable $error): void {
        error_log('Portfolio request failed: ' . $error->getMessage());
        if (!headers_sent()) {
            http_response_code(503);
            header('Content-Type: text/plain; charset=UTF-8');
        }
        echo 'Service temporarily unavailable.';
    });
}

function app_config(): array
{
    static $config;
    if (is_array($config ?? null)) {
        return $config;
    }

    $configPath = getenv('PORTFOLIO_CONFIG_PATH') ?: dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'portfolio-config.php';
    if (!is_file($configPath)) {
        throw new RuntimeException('Portfolio configuration is unavailable.');
    }

    $loaded = require $configPath;
    if (!is_array($loaded)) {
        throw new RuntimeException('Portfolio configuration is invalid.');
    }

    $required = ['db_host', 'db_name', 'db_user', 'db_password'];
    foreach ($required as $key) {
        if (!array_key_exists($key, $loaded) || !is_string($loaded[$key])) {
            throw new RuntimeException('Portfolio configuration is incomplete.');
        }
    }

    $config = $loaded;
    return $config;
}

function db(): PDO
{
    static $connection;
    if ($connection instanceof PDO) {
        return $connection;
    }

    $config = app_config();
    $charset = $config['db_charset'] ?? 'utf8mb4';
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $config['db_host'], $config['db_name'], $charset);

    $connection = new PDO($dsn, $config['db_user'], $config['db_password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $connection;
}