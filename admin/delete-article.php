<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/admin.php';

require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Method not allowed.');
}
require_valid_csrf();

$id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
if (!$id) {
    http_response_code(400);
    exit('Invalid article.');
}

try {
    $pdo = db();
    $pdo->beginTransaction();
    $statement = $pdo->prepare('SELECT image_path, gallery_images FROM articles WHERE id = :id FOR UPDATE');
    $statement->execute(['id' => $id]);
    $article = $statement->fetch();
    if (!$article) {
        $pdo->rollBack();
        http_response_code(404);
        exit('Article not found.');
    }

    $statement = $pdo->prepare('DELETE FROM articles WHERE id = :id');
    $statement->execute(['id' => $id]);
    $pdo->commit();
    delete_article_image_if_unused($pdo, $article['image_path']);
    foreach (article_gallery_paths($article['gallery_images'] ?? null) as $galleryPath) {
        delete_article_image_if_unused($pdo, $galleryPath);
    }
    set_flash('success', 'Article deleted.');
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Deleting article failed: ' . $error->getMessage());
    set_flash('error', 'The article could not be deleted. Please try again.');
}

redirect_to('/admin/index.php');