<?php
declare(strict_types=1);

require_once __DIR__ . '/security.php';
require_once __DIR__ . '/content.php';

function article_slug(string $value): string
{
    $value = trim($value);
    $value = strtr($value, [
        "\u{00C0}" => 'A', "\u{00C1}" => 'A', "\u{00C2}" => 'A', "\u{00C3}" => 'A', "\u{00C4}" => 'A', "\u{00C5}" => 'A', "\u{00C6}" => 'AE',
        "\u{00C7}" => 'C', "\u{00C8}" => 'E', "\u{00C9}" => 'E', "\u{00CA}" => 'E', "\u{00CB}" => 'E', "\u{00CC}" => 'I', "\u{00CD}" => 'I', "\u{00CE}" => 'I', "\u{00CF}" => 'I',
        "\u{00D0}" => 'D', "\u{00D1}" => 'N', "\u{00D2}" => 'O', "\u{00D3}" => 'O', "\u{00D4}" => 'O', "\u{00D5}" => 'O', "\u{00D6}" => 'O', "\u{00D8}" => 'O',
        "\u{00D9}" => 'U', "\u{00DA}" => 'U', "\u{00DB}" => 'U', "\u{00DC}" => 'U', "\u{00DD}" => 'Y', "\u{00DE}" => 'TH', "\u{00DF}" => 'ss',
        "\u{00E0}" => 'a', "\u{00E1}" => 'a', "\u{00E2}" => 'a', "\u{00E3}" => 'a', "\u{00E4}" => 'a', "\u{00E5}" => 'a', "\u{00E6}" => 'ae',
        "\u{00E7}" => 'c', "\u{00E8}" => 'e', "\u{00E9}" => 'e', "\u{00EA}" => 'e', "\u{00EB}" => 'e', "\u{00EC}" => 'i', "\u{00ED}" => 'i', "\u{00EE}" => 'i', "\u{00EF}" => 'i',
        "\u{00F0}" => 'd', "\u{00F1}" => 'n', "\u{00F2}" => 'o', "\u{00F3}" => 'o', "\u{00F4}" => 'o', "\u{00F5}" => 'o', "\u{00F6}" => 'o', "\u{00F8}" => 'o',
        "\u{00F9}" => 'u', "\u{00FA}" => 'u', "\u{00FB}" => 'u', "\u{00FC}" => 'u', "\u{00FD}" => 'y', "\u{00FE}" => 'th', "\u{00FF}" => 'y',
    ]);
    if (function_exists('iconv')) {
        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if (is_string($ascii) && !str_contains($ascii, '?')) {
            $value = $ascii;
        }
    }

    $slug = strtolower($value);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    return trim(substr($slug, 0, 255), '-');
}

function article_slug_is_available(PDO $pdo, string $slug, ?int $articleId = null): bool
{
    $sql = 'SELECT id FROM articles WHERE slug = :slug';
    $params = ['slug' => $slug];
    if ($articleId !== null) {
        $sql .= ' AND id <> :id';
        $params['id'] = $articleId;
    }
    $sql .= ' LIMIT 1';

    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    return $statement->fetch() === false;
}

function login_rate_keys(string $username, string $ip): array
{
    $key = (string) (app_config()['app_key'] ?? '');
    if (strlen($key) < 32) {
        throw new RuntimeException('Application security configuration is incomplete.');
    }

    return [
        hash_hmac('sha256', strtolower(trim($username)), $key),
        hash_hmac('sha256', $ip, $key),
    ];
}

function login_is_rate_limited(PDO $pdo, string $username, string $ip): bool
{
    [$usernameKey, $ipKey] = login_rate_keys($username, $ip);
    $statement = $pdo->prepare('SELECT locked_until > UTC_TIMESTAMP() AS locked FROM admin_login_attempts WHERE username_key = :username_key AND ip_key = :ip_key LIMIT 1');
    $statement->execute(['username_key' => $usernameKey, 'ip_key' => $ipKey]);
    return (int) ($statement->fetchColumn() ?: 0) === 1;
}

function record_login_failure(PDO $pdo, string $username, string $ip): void
{
    [$usernameKey, $ipKey] = login_rate_keys($username, $ip);
    $statement = $pdo->prepare(
        'INSERT INTO admin_login_attempts (username_key, ip_key, attempts, window_started_at) VALUES (:username_key, :ip_key, 1, UTC_TIMESTAMP())
        ON DUPLICATE KEY UPDATE
            locked_until = CASE WHEN window_started_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE) THEN NULL WHEN attempts >= 4 THEN DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE) ELSE locked_until END,
            attempts = CASE WHEN window_started_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE) THEN 1 ELSE LEAST(attempts + 1, 255) END,
            window_started_at = CASE WHEN window_started_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE) THEN UTC_TIMESTAMP() ELSE window_started_at END'
    );
    $statement->execute(['username_key' => $usernameKey, 'ip_key' => $ipKey]);
}

function clear_login_failures(PDO $pdo, string $username, string $ip): void
{
    [$usernameKey, $ipKey] = login_rate_keys($username, $ip);
    $statement = $pdo->prepare('DELETE FROM admin_login_attempts WHERE username_key = :username_key AND ip_key = :ip_key');
    $statement->execute(['username_key' => $usernameKey, 'ip_key' => $ipKey]);
}

function article_upload_error_message(int $error): string
{
    return match ($error) {
        UPLOAD_ERR_INI_SIZE => 'The image exceeds the PHP upload_max_filesize limit. Choose a smaller image.',
        UPLOAD_ERR_FORM_SIZE => 'The image exceeds the form upload size limit.',
        UPLOAD_ERR_PARTIAL => 'The image upload was interrupted. Please try again.',
        UPLOAD_ERR_NO_TMP_DIR => 'PHP has no upload temporary directory configured. Check upload_tmp_dir in php.ini.',
        UPLOAD_ERR_CANT_WRITE => 'PHP could not write the uploaded image to its temporary directory. Check the directory permissions and free space.',
        UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the image upload.',
        default => 'The image upload could not be read. Please choose it again and retry.',
    };
}

function save_uploaded_article_image(array $file): ?string
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    $uploadError = $file['error'] ?? UPLOAD_ERR_OK;
    if (!is_int($uploadError)) {
        throw new InvalidArgumentException('The image upload could not be read. Please choose it again and retry.');
    }
    if ($uploadError !== UPLOAD_ERR_OK) {
        throw new InvalidArgumentException(article_upload_error_message($uploadError));
    }
    if (!isset($file['tmp_name'], $file['size']) || !is_string($file['tmp_name']) || $file['tmp_name'] === '') {
        throw new InvalidArgumentException('PHP did not provide a temporary image file. Check the upload_tmp_dir setting and try again.');
    }
    $actualSize = filesize($file['tmp_name']);
    if (!is_int($actualSize) || $actualSize < 1 || $actualSize > 5 * 1024 * 1024 || !is_uploaded_file($file['tmp_name'])) {
        throw new InvalidArgumentException('Images must be smaller than 5 MB.');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    $image = getimagesize($file['tmp_name']);
    $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    if (!is_string($mime) || !isset($extensions[$mime]) || $image === false || ($image['mime'] ?? '') !== $mime) {
        throw new InvalidArgumentException('Choose a valid JPEG, PNG, or WebP image.');
    }

    $directory = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'articles';
    if (!is_dir($directory) || !is_writable($directory)) {
        throw new RuntimeException('The article image directory is not writable.');
    }

    $filename = bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
    if (!move_uploaded_file($file['tmp_name'], $directory . DIRECTORY_SEPARATOR . $filename)) {
        throw new RuntimeException('The image could not be saved.');
    }

    return 'uploads/articles/' . $filename;
}

function save_uploaded_article_gallery(array $files): array
{
    $names = $files['name'] ?? [];
    if (!is_array($names) || count($names) > 8) {
        throw new InvalidArgumentException('Choose no more than 8 gallery photos.');
    }
    if ($names === []) {
        return [];
    }

    foreach (['tmp_name', 'error', 'size'] as $key) {
        if (!isset($files[$key]) || !is_array($files[$key])) {
            throw new InvalidArgumentException('The gallery upload could not be read.');
        }
    }

    $paths = [];
    try {
        foreach (array_keys($names) as $index) {
            $error = $files['error'][$index] ?? UPLOAD_ERR_NO_FILE;
            if ($error === UPLOAD_ERR_NO_FILE) {
                continue;
            }

            $path = save_uploaded_article_image([
                'name' => $names[$index] ?? '',
                'tmp_name' => $files['tmp_name'][$index] ?? '',
                'error' => $error,
                'size' => $files['size'][$index] ?? 0,
            ]);
            if ($path !== null) {
                $paths[] = $path;
            }
        }
    } catch (Throwable $error) {
        foreach ($paths as $path) {
            $file = dirname(__DIR__) . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $path);
            if (is_file($file)) {
                unlink($file);
            }
        }
        throw $error;
    }

    return $paths;
}

function delete_article_image_if_unused(PDO $pdo, ?string $path): void
{
    if (!$path || !preg_match('~^uploads/articles/[a-f0-9]{32}\.(jpg|png|webp)$~', $path)) {
        return;
    }

    $articles = $pdo->query('SELECT image_path, gallery_images FROM articles');
    foreach ($articles as $article) {
        if ($article['image_path'] === $path || in_array($path, article_gallery_paths($article['gallery_images'] ?? null), true)) {
            return;
        }
    }

    $file = dirname(__DIR__) . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $path);
    if (is_file($file)) {
        unlink($file);
    }
}

function article_datetime_value(?string $value): ?string
{
    $value = trim((string) $value);
    if ($value === '') {
        return null;
    }

    $date = DateTimeImmutable::createFromFormat('!Y-m-d\TH:i', $value, article_site_timezone());
    $errors = DateTimeImmutable::getLastErrors();
    if (!$date || ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0))) {
        throw new InvalidArgumentException('Enter a valid publication date and time.');
    }

    return $date->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
}

function article_site_timezone(): DateTimeZone
{
    $timezone = (string) (app_config()['site_timezone'] ?? 'Asia/Kolkata');
    try {
        return new DateTimeZone($timezone);
    } catch (Throwable $error) {
        throw new RuntimeException('The configured site timezone is invalid.', 0, $error);
    }
}

function article_datetime_for_input(?string $value): string
{
    if (!$value) {
        return '';
    }

    try {
        return (new DateTimeImmutable($value, new DateTimeZone('UTC')))
            ->setTimezone(article_site_timezone())
            ->format('Y-m-d\TH:i');
    } catch (Throwable) {
        return '';
    }
}

function article_form_values(array $source): array
{
    return [
        'title' => trim((string) ($source['title'] ?? '')),
        'slug' => article_slug((string) ($source['slug'] ?? '')),
        'category' => canonical_article_category(trim((string) ($source['category'] ?? ''))) ?? trim((string) ($source['category'] ?? '')),
        'excerpt' => trim((string) ($source['excerpt'] ?? '')),
        'content' => (string) ($source['content'] ?? ''),
        'published_at' => trim((string) ($source['published_at'] ?? '')),
        'status' => (string) ($source['status'] ?? 'draft'),
    ];
}

function validate_article_values(PDO $pdo, array $values, ?int $articleId = null): array
{
    $errors = [];
    if ($values['title'] === '' || mb_strlen($values['title']) > 255) {
        $errors[] = 'Title is required and must be 255 characters or fewer.';
    }
    if ($values['slug'] === '') {
        $values['slug'] = article_slug($values['title']);
    }
    if ($values['slug'] === '') {
        $errors[] = 'The title must include letters or numbers to make a URL slug.';
    } elseif (!article_slug_is_available($pdo, $values['slug'], $articleId)) {
        $errors[] = 'That URL slug is already in use. Choose a different slug.';
    }
    if (!in_array($values['category'], article_categories(), true)) {
        $errors[] = 'Choose one of the available article categories.';
    }
    if ($values['excerpt'] === '' || mb_strlen($values['excerpt']) > 500) {
        $errors[] = 'Description is required and must be 500 characters or fewer.';
    }
    if (trim(strip_tags($values['content'])) === '') {
        $errors[] = 'Article content is required.';
    }
    if (!in_array($values['status'], ['draft', 'published'], true)) {
        $errors[] = 'Choose Draft or Published.';
    }

    return [$values, $errors];
}