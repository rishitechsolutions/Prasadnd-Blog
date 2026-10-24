# Article API Connection

The portfolio pages remain static HTML/CSS/JavaScript. The Beyond Work page loads published article cards from the standalone PHP/PDO endpoint at `/api/articles.php`; the existing static cards and individual files under `articles/` remain unchanged.

The article admin implementation is documented in `HOSTINGER_ARTICLE_ADMIN_SETUP.md`. It uses the private MySQL configuration file outside the web root and does not use the Laravel project under `backend/`.

The Laravel API and admin routes under `backend/` are separate legacy code and are not called by this integration. The root `article.html` is also an older Laravel API-driven page; new database-managed article links use `/article.php?slug=...` instead.

