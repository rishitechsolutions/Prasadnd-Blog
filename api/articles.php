<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/db.php';
require_once dirname(__DIR__) . '/includes/content.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function json_response(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    json_response(405, ['error' => 'Method not allowed.']);
}

try {
    $pdo = db();
    $slug = trim((string) ($_GET['slug'] ?? ''));
    if ($slug !== '') {
        if (strlen($slug) > 255 || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
            json_response(404, ['error' => 'Article not found.']);
        }
        $statement = $pdo->prepare("SELECT id, title, slug, category, excerpt, content, image_path, gallery_images, published_at FROM articles WHERE slug = :slug AND status = 'published' LIMIT 1");
        $statement->execute(['slug' => $slug]);
        $article = $statement->fetch();
        if (!$article) {
            json_response(404, ['error' => 'Article not found.']);
        }
        $article['category'] = canonical_article_category((string) $article['category']) ?? $article['category'];
        $article['content'] = clean_article_content((string) $article['content']);
        $article['image_path'] = article_image_url($article['image_path']);
        $article['gallery_images'] = array_values(array_filter(array_map('article_image_url', article_gallery_paths($article['gallery_images'] ?? null))));
        json_response(200, ['article' => $article]);
    }

    $statement = $pdo->query("SELECT id, title, slug, category, excerpt, image_path, published_at FROM articles WHERE status = 'published' ORDER BY published_at DESC, id DESC LIMIT 100");
    $articles = $statement->fetchAll();
    $categories = article_categories();
    foreach ($articles as &$article) {
        $article['category'] = canonical_article_category((string) $article['category']) ?? $article['category'];
        $article['image_path'] = article_image_url($article['image_path']);
    }
    unset($article);

    json_response(200, ['articles' => $articles, 'categories' => $categories]);
} catch (Throwable $error) {
    error_log('Public article API unavailable: ' . $error->getMessage());
    json_response(503, ['error' => 'Articles are temporarily unavailable.']);
}