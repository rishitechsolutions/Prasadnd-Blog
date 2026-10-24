# Hostinger Article Admin Setup

The portfolio remains static HTML/CSS/JavaScript. The standalone PHP admin uses a separate MySQL database and does not use the unused Laravel app in `backend/`.

## Deployment

1. **Back up the live site.** Download or duplicate `public_html`, including the existing `articles/` and `assets/` directories. Do not replace the site with a generated copy.
2. **Create a dedicated MySQL database and user** in hPanel. Grant that user privileges only on the new article-admin database. Do not reuse a Laravel database with an existing `articles` table.
3. **Import the schema.** Use phpMyAdmin to select the new database and import `database/schema.sql`. It creates `admins`, `articles`, and `admin_login_attempts`.
	For an existing installation, run `database/upgrade-article-gallery.sql` once to add the nullable `gallery_images` column. It preserves existing rows and image paths; do not re-import the full schema into a populated database.
4. **Configure credentials outside `public_html`.** Copy `database/portfolio-config.example.php` to `portfolio-config.php` in the parent directory of `public_html`. Fill in the hPanel database values. Generate separate random values for `app_key` and `admin_setup_token`; a local PHP CLI can generate each with `php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"`. Never upload a real config file into the public site or commit it. Alternatively set `PORTFOLIO_CONFIG_PATH` to an absolute path outside the web root.
5. **Upload only the application files** while preserving current site files: `admin/`, `api/`, `includes/`, `article.php`, `articles.js`, and `uploads/articles/.htaccess`. Upload the updated `beyond-work.html` and `script.js`. Import `database/schema.sql` locally in phpMyAdmin, then do not upload the `database/` directory. If you leave it on the server, include `database/.htaccess`. Do not upload the example config in place of the private config. `includes/` is denied by Apache rules; keep the live config outside the web root regardless.
6. **Set permissions.** Keep PHP files and the private config non-world-writable (commonly `644` for site PHP and `600` or `640` for the config, depending on the PHP process owner). The `uploads/articles/` directory must be writable by the site’s PHP process; use the narrowest working permission, typically `755` or `750`, never `777`.
7. **Select PHP 8.2 or later** in hPanel and confirm the `pdo_mysql`, `fileinfo`, `mbstring`, and `dom` extensions are enabled. Allow `upload_max_filesize` of at least `5M`, `max_file_uploads` of at least `9`, and `post_max_size` of at least `64M` for one cover image plus eight gallery photos. This project workspace’s PHP CLI has PDO but lacks `pdo_mysql`, so a local database connection cannot be verified here.
8. **Enable HTTPS** for the domain before creating the account. Visit `https://YOUR-DOMAIN/admin/setup.php`, enter the setup token from the private config, and create the administrator username/password. Passwords must be at least 12 characters and are stored using `password_hash()`. Publication date input uses `site_timezone` (defaults to `Asia/Kolkata`); it controls display and ordering only and does not schedule publishing.
9. **Disable initial setup.** After successful creation, remove `admin/setup.php` from the server and remove the `admin_setup_token` entry from the private config. The setup page also refuses to create another administrator once one exists, but removing it is required.
10. **Test authentication and article states.** Confirm a logged-out request to `/admin/` redirects to login, invalid logins are throttled, and a draft does not appear at `/api/articles.php` or on Beyond Work. Publish one article and verify it appears after a refresh. Try editing, previewing, publishing, saving as draft, and deleting it.
11. **Test image/content security.** Upload a valid cover and up to eight JPEG/PNG/WebP gallery photos (maximum 5 MB each); reject SVG, a renamed PHP file, and oversized files. Confirm uploaded PHP-like files cannot execute. Try script markup and a `javascript:` link in article content and verify neither is active in public output.
12. **Check existing pages and clean up.** Open the home, education, profession, Beyond Work, and contact pages; open each existing static article link. Confirm navigation, images, and contact form still work. Check that no config/credentials are in `public_html`, remove setup code/token, and verify `/uploads/articles/` does not execute scripts.

## Admin URLs

- Sign in: `/admin/login.php`
- Dashboard: `/admin/`
- Public article API: `/api/articles.php`
- Article detail: `/article.php?slug=article-slug`

The API is read-only and returns published articles only. It sends `Cache-Control: no-store` so newly published posts are visible on the next page load. Existing static cards and `articles/*.html` pages remain separate and are not migrated.

## Local verification limits

The local XAMPP setup has been verified against its MySQL-compatible server: the app connects through PDO, the gallery migration is applied, and public article/API routes respond. Both local PHP configurations use `upload_max_filesize=5M` and `post_max_size=64M`. The actual multi-image browser upload has not yet been exercised on Hostinger; verify PHP extensions, effective upload limits, HTTPS/session behavior, Apache `.htaccess`, and upload/admin flows on a staging domain before production. Do not use production data while testing.