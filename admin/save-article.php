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

$id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT) ?: null;
$back = $id ? '/admin/article-form.php?id=' . $id : '/admin/article-form.php';
$newImagePath = null;
$newGalleryPaths = [];
$oldGalleryPaths = [];
$pdo = db();
$oldArticle = null;
if ($id !== null) {
    $statement = $pdo->prepare('SELECT * FROM articles WHERE id = :id LIMIT 1');
    $statement->execute(['id' => $id]);
    $oldArticle = $statement->fetch();
    if (!$oldArticle) {
        http_response_code(404);
        exit('Article not found.');
    }
    $oldGalleryPaths = article_gallery_paths($oldArticle['gallery_images'] ?? null);
}

$values = article_form_values($_POST);
[$values, $errors] = validate_article_values($pdo, $values, $id);
try {
    $publishedAt = article_datetime_value($values['published_at']);
} catch (InvalidArgumentException $error) {
    $errors[] = $error->getMessage();
    $publishedAt = null;
}

if ($errors) {
    $_SESSION['old_article'] = $values;
    set_flash('error', implode(' ', $errors));
    redirect_to($back);
}

try {
    $safeContent = clean_article_content($values['content']);
    if (trim(strip_tags($safeContent)) === '') {
        throw new InvalidArgumentException('Article content must include readable text.');
    }

    $newImagePath = save_uploaded_article_image($_FILES['image'] ?? []);
    $newGalleryPaths = save_uploaded_article_gallery($_FILES['gallery_images'] ?? []);
    $removeGalleryPaths = $_POST['remove_gallery_images'] ?? [];
    if (!is_array($removeGalleryPaths)) {
        throw new InvalidArgumentException('Invalid gallery removal selection.');
    }
    $removeGalleryPaths = array_intersect($removeGalleryPaths, $oldGalleryPaths);
    $galleryPaths = array_values(array_diff($oldGalleryPaths, $removeGalleryPaths));
    if (count($galleryPaths) + count($newGalleryPaths) > 8) {
        throw new InvalidArgumentException('An article can have no more than 8 gallery photos. Remove a photo or select fewer images.');
    }
    $galleryPaths = array_merge($galleryPaths, $newGalleryPaths);
    $encodedGalleryPaths = json_encode($galleryPaths, JSON_THROW_ON_ERROR);
    $imagePath = $newImagePath ?? ($oldArticle['image_path'] ?? null);
    if (!$newImagePath && !empty($_POST['remove_image'])) {
        $imagePath = null;
    }

    if ($values['status'] === 'published') {
        $publishedAt = $publishedAt ?? (($oldArticle['status'] ?? '') === 'published' ? $oldArticle['published_at'] : null) ?? gmdate('Y-m-d H:i:s');
    } else {
        $publishedAt = null;
    }

    $params = [
        'title' => $values['title'],
        'slug' => $values['slug'],
        'category' => $values['category'],
        'excerpt' => $values['excerpt'],
        'content' => $safeContent,
        'image_path' => $imagePath,
        'gallery_images' => $encodedGalleryPaths,
        'status' => $values['status'],
        'published_at' => $publishedAt,
    ];

    if ($id !== null) {
        $params['id'] = $id;
        $statement = $pdo->prepare('UPDATE articles SET title = :title, slug = :slug, category = :category, excerpt = :excerpt, content = :content, image_path = :image_path, gallery_images = :gallery_images, status = :status, published_at = :published_at WHERE id = :id');
        $statement->execute($params);
    } else {
        $statement = $pdo->prepare('INSERT INTO articles (title, slug, category, excerpt, content, image_path, gallery_images, status, published_at) VALUES (:title, :slug, :category, :excerpt, :content, :image_path, :gallery_images, :status, :published_at)');
        $statement->execute($params);
        $id = (int) $pdo->lastInsertId();
    }

    if ($oldArticle && $oldArticle['image_path'] !== $imagePath) {
        delete_article_image_if_unused($pdo, $oldArticle['image_path']);
    }
    foreach (array_diff($oldGalleryPaths, $galleryPaths) as $removedGalleryPath) {
        delete_article_image_if_unused($pdo, $removedGalleryPath);
    }
    set_flash('success', $values['status'] === 'published' ? 'Article published.' : 'Draft saved.');
    redirect_to('/admin/index.php');
} catch (InvalidArgumentException $error) {
    if ($newImagePath) {
        delete_article_image_if_unused($pdo, $newImagePath);
    }
    foreach ($newGalleryPaths as $galleryPath) {
        delete_article_image_if_unused($pdo, $galleryPath);
    }
    $_SESSION['old_article'] = $values;
    set_flash('error', $error->getMessage());
    redirect_to($back);
} catch (Throwable $error) {
    if ($newImagePath) {
        delete_article_image_if_unused($pdo, $newImagePath);
    }
    foreach ($newGalleryPaths as $galleryPath) {
        delete_article_image_if_unused($pdo, $galleryPath);
    }
    error_log('Saving article failed: ' . $error->getMessage());
    $_SESSION['old_article'] = $values;
    set_flash('error', 'The article could not be saved. Check the database and try again.');
    redirect_to($back);
}