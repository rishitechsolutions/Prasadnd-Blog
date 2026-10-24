<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/admin.php';
require_once __DIR__ . '/_layout.php';

$admin = require_admin();
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT) ?: null;
$article = null;
if ($id !== null) {
    $statement = db()->prepare('SELECT * FROM articles WHERE id = :id LIMIT 1');
    $statement->execute(['id' => $id]);
    $article = $statement->fetch();
    if (!$article) {
        http_response_code(404);
        admin_header('Article not found', $admin);
        echo '<main class="admin-main"><h1>Article not found</h1><p><a href="/admin/index.php">Return to dashboard</a></p></main>';
        admin_footer();
        exit;
    }
}

$oldValues = $_SESSION['old_article'] ?? null;
unset($_SESSION['old_article']);
$galleryPaths = article_gallery_paths($article['gallery_images'] ?? null);
$values = $oldValues ?? [
    'title' => $article['title'] ?? '',
    'slug' => $article['slug'] ?? '',
    'category' => $article['category'] ?? '',
    'excerpt' => $article['excerpt'] ?? '',
    'content' => $article['content'] ?? '',
    'published_at' => article_datetime_for_input($article['published_at'] ?? null),
    'status' => $article['status'] ?? 'draft',
];
$values['category'] = canonical_article_category((string) ($values['category'] ?? '')) ?? '';
$flash = take_flash();

admin_header($id ? 'Edit article' : 'Add article', $admin);
?>
<main class="admin-main">
    <?php admin_flash($flash); ?>
    <div class="admin-heading">
        <div><h1><?= $id ? 'Edit article' : 'Add article' ?></h1><p>Drafts remain private until published.</p></div>
        <a class="admin-button" href="/admin/index.php">Back to dashboard</a>
    </div>
    <form class="admin-panel admin-form" action="/admin/save-article.php" method="post" enctype="multipart/form-data" data-article-form>
        <?= csrf_input() ?>
        <input type="hidden" name="id" value="<?= (int) ($id ?? 0) ?>">
        <input type="hidden" name="content" value="" data-article-content>
        <div class="admin-field">
            <label for="title">Title</label>
            <input id="title" name="title" type="text" maxlength="255" value="<?= h($values['title']) ?>" required>
        </div>
        <div class="admin-field">
            <label for="slug">URL slug</label>
            <input id="slug" name="slug" type="text" maxlength="255" value="<?= h($values['slug']) ?>" autocomplete="off">
            <span class="admin-hint">Generated from the title. You can edit it; it must be unique.</span>
        </div>
        <div class="admin-field">
            <label for="category">Category</label>
            <select id="category" name="category" required>
                <option value="" disabled<?= $values['category'] === '' ? ' selected' : '' ?>>Choose a category</option>
                <?php foreach (article_categories() as $category): ?>
                    <option value="<?= h($category) ?>"<?= $values['category'] === $category ? ' selected' : '' ?>><?= h($category) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="admin-field">
            <label for="excerpt">Short description</label>
            <textarea id="excerpt" name="excerpt" maxlength="500" rows="3" required><?= h($values['excerpt']) ?></textarea>
            <span class="admin-hint">Up to 500 characters. This appears on the Beyond Work card.</span>
        </div>
        <div class="admin-field">
            <label for="image">Cover image</label>
            <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp">
            <span class="admin-hint">JPEG, PNG, or WebP; maximum 5 MB.</span>
            <?php $imageUrl = article_image_url($article['image_path'] ?? null); ?>
            <img data-image-preview class="admin-preview-image" src="<?= h($imageUrl ?? '') ?>" alt="Current cover image"<?= $imageUrl ? '' : ' hidden' ?>>
            <?php if ($imageUrl): ?>
                <label class="admin-checkbox"><input type="checkbox" name="remove_image" value="1"> Remove current cover image</label>
            <?php endif; ?>
        </div>
        <div class="admin-field">
            <label for="gallery_images">Photo gallery</label>
            <input id="gallery_images" name="gallery_images[]" type="file" accept="image/jpeg,image/png,image/webp" multiple data-gallery-input data-gallery-limit="8">
            <span class="admin-hint">Add up to 8 gallery photos total. JPEG, PNG, or WebP; maximum 5 MB each.</span>
            <?php if ($galleryPaths): ?>
                <div class="admin-gallery-current" data-gallery-current>
                    <?php foreach ($galleryPaths as $index => $galleryPath): ?>
                        <figure class="admin-gallery-item" data-gallery-current-item>
                            <img src="<?= h(article_image_url($galleryPath)) ?>" alt="Gallery image <?= $index + 1 ?>">
                            <figcaption><label class="admin-checkbox"><input type="checkbox" name="remove_gallery_images[]" value="<?= h($galleryPath) ?>"> Remove image</label></figcaption>
                        </figure>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
            <div class="admin-gallery-preview" data-gallery-preview aria-live="polite"></div>
        </div>
        <div class="admin-field">
            <label>Article content</label>
            <div class="admin-editor-toolbar" role="toolbar" aria-label="Content formatting">
                <button type="button" data-editor-command="formatBlock" data-editor-value="p" aria-label="Paragraph">P</button>
                <button type="button" data-editor-command="formatBlock" data-editor-value="h2" aria-label="Heading">H2</button>
                <button type="button" data-editor-command="formatBlock" data-editor-value="h3" aria-label="Subheading">H3</button>
                <button type="button" data-editor-command="bold" aria-label="Bold"><strong>B</strong></button>
                <button type="button" data-editor-command="italic" aria-label="Italic"><em>I</em></button>
                <button type="button" data-editor-command="insertUnorderedList" aria-label="Bulleted list">&#8226;</button>
                <button type="button" data-editor-command="insertOrderedList" aria-label="Numbered list">1.</button>
                <button type="button" data-editor-command="link" aria-label="Add link">Link</button>
            </div>
            <div class="admin-editor" data-article-editor contenteditable="true" role="textbox" aria-multiline="true" aria-label="Article content"><?= clean_article_content((string) $values['content']) ?></div>
        </div>
        <div class="admin-field">
            <label for="published_at">Publication date and time (optional)</label>
            <input id="published_at" name="published_at" type="datetime-local" value="<?= h($values['published_at']) ?>">
            <span class="admin-hint">Uses <?= h((string) (app_config()['site_timezone'] ?? 'Asia/Kolkata')) ?> time. This date is for display and sorting only; a future date does not schedule publishing.</span>
        </div>
        <div class="admin-actions">
            <button class="admin-button" type="submit" name="status" value="draft">Save draft</button>
            <button class="admin-button admin-button-primary" type="submit" name="status" value="published">Publish</button>
            <?php if ($id): ?><a href="/article.php?preview=<?= (int) $id ?>" target="_blank" rel="noopener noreferrer">Preview</a><?php endif; ?>
        </div>
    </form>
</main>
<?php admin_footer(true); ?>