<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/admin.php';
require_once __DIR__ . '/_layout.php';

$admin = require_admin();
try {
    $pdo = db();
    $totalCount = (int) $pdo->query('SELECT COUNT(*) FROM articles')->fetchColumn();
    $publishedCount = (int) $pdo->query("SELECT COUNT(*) FROM articles WHERE status = 'published'")->fetchColumn();
    $draftCount = (int) $pdo->query("SELECT COUNT(*) FROM articles WHERE status = 'draft'")->fetchColumn();
    $articles = $pdo->query('SELECT id, title, slug, category, status, updated_at FROM articles ORDER BY updated_at DESC, id DESC LIMIT 200')->fetchAll();
} catch (Throwable $error) {
    error_log('Article admin dashboard unavailable: ' . $error->getMessage());
    http_response_code(503);
    admin_header('Dashboard unavailable', $admin);
    echo '<main class="admin-main"><h1>Dashboard unavailable</h1><p>Article data is temporarily unavailable.</p></main>';
    admin_footer();
    exit;
}

admin_header('Dashboard', $admin);
?>
<main class="admin-main">
    <?php admin_flash(take_flash()); ?>
    <div class="admin-heading">
        <div><h1>Content overview</h1><p>Signed in as <?= h($admin['username']) ?></p></div>
        <a class="admin-button admin-button-primary" href="/admin/article-form.php">Create article</a>
    </div>
    <section class="admin-stats" aria-label="Article counts">
        <div class="admin-stat"><strong><?= $totalCount ?></strong><span>All articles</span></div>
        <div class="admin-stat"><strong><?= $publishedCount ?></strong><span>Published</span></div>
        <div class="admin-stat"><strong><?= $draftCount ?></strong><span>Drafts</span></div>
    </section>
    <section class="admin-panel">
        <h2>Article library</h2>
        <?php if (!$articles): ?>
            <p class="admin-empty">No articles yet. Add an article to get started.</p>
        <?php else: ?>
            <div class="admin-table-wrap">
                <table class="admin-table">
                    <thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
                    <tbody>
                    <?php foreach ($articles as $article): ?>
                        <tr>
                            <td><?= h($article['title']) ?></td>
                            <td><?= h($article['category']) ?></td>
                            <td><span class="admin-status<?= $article['status'] === 'published' ? ' admin-status-published' : '' ?>"><?= h($article['status']) ?></span></td>
                            <td><?= h((string) $article['updated_at']) ?></td>
                            <td>
                                <div class="admin-actions">
                                    <a href="/admin/article-form.php?id=<?= (int) $article['id'] ?>">Edit</a>
                                    <a href="/article.php?preview=<?= (int) $article['id'] ?>" target="_blank" rel="noopener noreferrer">Preview</a>
                                    <form action="/admin/delete-article.php" method="post" data-delete-form>
                                        <?= csrf_input() ?>
                                        <input type="hidden" name="id" value="<?= (int) $article['id'] ?>">
                                        <button class="admin-button admin-button-danger" type="submit">Delete</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </section>
</main>
<script src="/admin/admin.js" defer></script>
<?php admin_footer(); ?>