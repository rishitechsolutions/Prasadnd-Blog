<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/admin.php';

$isPreview = isset($_GET['preview']);
$article = null;
try {
    $pdo = db();
    if ($isPreview) {
        require_admin();
        $id = filter_var($_GET['preview'], FILTER_VALIDATE_INT);
        if ($id) {
            $statement = $pdo->prepare('SELECT * FROM articles WHERE id = :id LIMIT 1');
            $statement->execute(['id' => $id]);
            $article = $statement->fetch();
        }
    } else {
        $slug = trim((string) ($_GET['slug'] ?? ''));
        if (strlen($slug) <= 255 && preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
            $statement = $pdo->prepare("SELECT * FROM articles WHERE slug = :slug AND status = 'published' LIMIT 1");
            $statement->execute(['slug' => $slug]);
            $article = $statement->fetch();
        }
    }
} catch (Throwable $error) {
    error_log('Article page unavailable: ' . $error->getMessage());
    http_response_code(503);
}

if (!$article && http_response_code() !== 503) {
    http_response_code(404);
}

$title = $article ? (string) $article['title'] : (http_response_code() === 503 ? 'Article unavailable' : 'Article not found');
$category = $article ? (string) $article['category'] : '';
$publishedDate = '';
if ($article && !empty($article['published_at'])) {
    try {
        $publishedDate = (new DateTimeImmutable((string) $article['published_at'], new DateTimeZone('UTC')))
            ->setTimezone(article_site_timezone())
            ->format('M j, Y');
    } catch (Throwable) {
        $publishedDate = '';
    }
}
$imageUrl = article_image_url($article['image_path'] ?? null);
$galleryUrls = $article
    ? array_values(array_filter(array_map('article_image_url', article_gallery_paths($article['gallery_images'] ?? null))))
    : [];
$content = $article ? clean_article_content((string) $article['content']) : '';
$statusCode = http_response_code();
?>
<!DOCTYPE html>
<html lang="en">
<head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-G2XLKRXKPQ"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-G2XLKRXKPQ');
        </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= h($title) ?> | Beyond Work</title>
    <meta name="robots" content="<?= $isPreview ? 'noindex,nofollow' : 'index,follow' ?>">
    <link rel="icon" type="image/jpeg" href="assets/newlogo.JPEG">
    <link rel="stylesheet" href="styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700;800&family=Lexend+Giga:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
</head>
<body>
    <div class="page-loader" id="pageLoader">
        <div class="page-loader-line"></div>
        <div class="page-loader-content"><div class="page-loader-dots"><span class="page-loader-dot"></span><span class="page-loader-dot"></span><span class="page-loader-dot"></span><span class="page-loader-dot"></span></div></div>
    </div>
    <nav class="navbar">
        <div class="nav-container">
            <a href="index.html" class="nav-icon-box nav-logo-box" aria-label="Home"><img src="assets/newlogo.JPEG" alt="Logo" class="nav-logo"></a>
            <ul class="nav-menu">
                <li><a href="index.html" class="nav-link">WHO I AM</a></li>
                <li><a href="education.html" class="nav-link">EDUCATION</a></li>
                <li><a href="profession.html" class="nav-link">PROFESSION</a></li>
                <li><a href="beyond-work.html" class="nav-link active">BEYOND WORK</a></li>
                <li><a href="https://www.youtube.com/@learnwithprasadnd" class="nav-link" target="_blank" rel="noopener noreferrer">LEARN WITH PRASAD</a></li>
                <li><a href="contact.html" class="nav-link">CONTACT</a></li>
            </ul>
            <a href="mailto:Prasad.nd.2026@gmail.com" class="nav-icon-box" aria-label="Email">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </a>
            <button class="menu-toggle" aria-label="Toggle menu"><span></span><span></span><span></span></button>
        </div>
    </nav>
    <div class="scroll-progress-line"><div class="scroll-progress-fill"></div></div>
    <div class="main-container">
        <div class="left-sidebar"><div class="sidebar-content"><div class="current-page"><span class="page-indicator-dot"></span><span class="page-indicator">BEYOND WORK</span></div></div></div>
        <main class="left-content">
            <div class="header-indicator-line"><div class="indicator-line"></div><div class="indicator-circle"></div></div>
            <?php if ($article): ?>
                <article class="article-detail">
                    <p class="article-breadcrumb"><a href="beyond-work.html">Beyond Work</a><?php if ($category !== ''): ?> / <a href="beyond-work.html?category=<?= rawurlencode($category) ?>"><?= h($category) ?></a><?php endif; ?></p>
                    <?php if ($isPreview): ?><p class="admin-flash">Administrator preview · <?= h((string) $article['status']) ?></p><?php endif; ?>
                    <?php if ($category !== ''): ?><span class="article-meta-badge"><?= h($category) ?></span><?php endif; ?>
                    <?php if ($publishedDate !== ''): ?><span class="article-date"><?= h($publishedDate) ?></span><?php endif; ?>
                    <h1 class="article-title"><?= h($title) ?></h1>
                    <?php if ($imageUrl): ?><div class="article-featured-image"><img src="<?= h($imageUrl) ?>" alt="<?= h($title) ?>"></div><?php endif; ?>
                    <div class="article-body"><?= $content ?></div>
                    <?php if ($galleryUrls): ?>
                        <section class="article-gallery" aria-label="Article photo gallery">
                            <h2 class="article-gallery-title">Gallery</h2>
                            <div class="article-gallery-grid">
                                <?php foreach ($galleryUrls as $index => $galleryUrl): ?>
                                    <img src="<?= h($galleryUrl) ?>" alt="<?= h($title) ?> gallery image <?= $index + 1 ?>" loading="lazy">
                                <?php endforeach; ?>
                            </div>
                        </section>
                    <?php endif; ?>
                    <a href="beyond-work.html" class="article-back-link">← Back to Beyond Work</a>
                </article>
            <?php else: ?>
                <section class="article-detail">
                    <h1 class="article-title"><?= h($statusCode === 503 ? 'Article unavailable' : 'Article not found') ?></h1>
                    <p><?= $statusCode === 503 ? 'Please try again later.' : 'This article may have been removed or is not published.' ?></p>
                    <a href="beyond-work.html" class="article-back-link">← Back to Beyond Work</a>
                </section>
            <?php endif; ?>
            <footer class="footer"><div class="footer-content"><p class="footer-left">© Prasad ND 2026. All rights reserved.</p><p class="footer-right">Developed by: <a href="https://rishitechsolutions.in" rel="noopener noreferrer">Rishi Tech Solutions</a></p></div></footer>
        </main>
        <div class="right-image"><div class="image-placeholder" style="background-image: url('assets/beyond work.jpg');"></div></div>
    </div>
    <button class="back-to-top" aria-label="Back to top"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
    <div class="cert-lightbox" id="articleLightbox" aria-hidden="true"><div class="cert-lightbox-backdrop"></div><div class="cert-lightbox-content"><button type="button" class="cert-lightbox-close" aria-label="Close">&times;</button><img src="" alt="" class="cert-lightbox-image"><h4 class="cert-lightbox-title"></h4></div></div>
    <script src="script.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const beyondWorkLink = document.querySelector('.nav-link[href="beyond-work.html"]');
            if (beyondWorkLink) beyondWorkLink.classList.add('active');
        });
    </script>
</body>
</html>