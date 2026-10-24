# Deploying the Portfolio + Admin to Hostinger (Business Plan)

This guide takes the site from this repository to a live Hostinger website, including the PHP article admin and the Forgot Password feature.

**What gets deployed:** static pages (HTML/CSS/JS) + the standalone PHP admin (`admin/`, `api/`, `includes/`, `article.php`) + a MySQL database.
**What does NOT get deployed:** `backend/` (unused Laravel app), `php82/`, `php82.zip`, `composer*`, `database/` (import it, don't upload it), `*.md` docs.

---

## 0. Before you start

- [ ] A Hostinger Business plan with your domain connected (example below: `prasadnd.com`).
- [ ] The code on your computer (clone it, or download the ZIP from GitHub: `https://github.com/rishitechsolutions/Prasadnd-Blog`).
- [ ] An email mailbox you can receive mail on: **`prasad@prasadnd.com`**. It is the only address password-reset links are sent to.

## 1. Back up the current live site (if one exists)

hPanel → **Websites → Manage → Files → Backups** (or File Manager → right-click `public_html` → Compress → download). Keep it until the new site is verified.

## 2. Choose PHP version and extensions

hPanel → **Websites → Manage → Advanced → PHP Configuration**.

1. **PHP version:** select **8.2** or newer.
2. **Extensions:** make sure these are ticked: `pdo_mysql`, `mysqli`, `fileinfo`, `mbstring`, `dom`, `openssl`.
3. **PHP Options** tab, set:
   - `upload_max_filesize` = `5M` or more
   - `post_max_size` = `64M`
   - `max_file_uploads` = `9` or more
4. Save.

## 3. Turn on HTTPS (required)

hPanel → **Security → SSL**. Install the free SSL for the domain, then enable **Force HTTPS**.
The admin session cookie is `Secure`-only, so **login will not work over plain http**.

## 4. Create the MySQL database

hPanel → **Databases → Management → Create new MySQL database**.

1. Enter a database name, a username and a **strong password**. Save them somewhere private.
2. Hostinger prefixes names, e.g. `u123456789_portfolio` and `u123456789_admin`. Use the full prefixed names.
3. Click **Create**.

## 5. Import the schema

1. In **Databases → Management**, click **Enter phpMyAdmin** next to your new database.
2. Select the database on the left → **Import** tab.
3. Choose `database/schema.sql` from this repo → **Import**.
   This creates `admins`, `articles`, `admin_login_attempts`, and `admin_password_resets`.
4. Check the left list shows those 4 tables.

> Only for an **existing, already-populated** install: do NOT re-import schema.sql. Instead run `database/upgrade-article-gallery.sql` (once) and `database/upgrade-admin-password-reset.sql` (once).

## 6. Create the private config (OUTSIDE public_html)

The app looks for `portfolio-config.php` in the **parent folder of `public_html`** (e.g. `/home/u123456789/domains/prasadnd.com/portfolio-config.php`, one level above `public_html`).

1. hPanel → **Files → File Manager**. Go **up one level** from `public_html`.
2. Create a file named `portfolio-config.php` with this content (replace every value):

```php
<?php
declare(strict_types=1);

return [
    'db_host' => 'localhost',
    'db_name' => 'u123456789_portfolio',
    'db_user' => 'u123456789_admin',
    'db_password' => 'YOUR_DATABASE_PASSWORD',
    'db_charset' => 'utf8mb4',
    'site_timezone' => 'Asia/Kolkata',
    'app_key' => 'PASTE_64_HEX_CHARS_1',
    'admin_setup_token' => 'PASTE_64_HEX_CHARS_2',
    'site_url' => 'https://prasadnd.com',
    'mail_from' => 'no-reply@prasadnd.com',
];
```

3. Generate the two random 64-character values. Easiest options:
   - Any terminal with PHP: `php -r "echo bin2hex(random_bytes(32));"` (run it twice, one value for each).
   - Or use a password manager to generate 64 hex characters. The two values must be different.
4. Set the file permission to `600` (right-click → Permissions).

> Never put this file inside `public_html` and never commit it to GitHub.
> If your folder layout differs, you can instead set the `PORTFOLIO_CONFIG_PATH` environment variable to the absolute path of the file.

## 7. Create the email mailbox (for Forgot Password)

hPanel → **Emails → Email Accounts → Create**.

1. Create **`prasad@prasadnd.com`** (this is also the admin username).
2. Create **`no-reply@prasadnd.com`** (or use any address on your domain) and make sure it matches `mail_from` in the config. The sender must be an address on your own domain or mail may be rejected or sent to spam.
3. Make sure your domain's **SPF/DKIM** DNS records are enabled (hPanel → Emails → the domain → DNS check). Hostinger sets them automatically when its nameservers are used.

## 8. Upload the website files

hPanel → **Files → File Manager → `public_html`** (or use Git / FTP).

**Option A – File Manager upload (simplest)**
1. On your computer, put these in a ZIP (keep folder structure): `index.html`, `beyond-work.html`, `contact.html`, `education.html`, `profession.html`, `article.html`, `article.php`, `articles.js`, `script.js`, `styles.css`, and the folders `admin/`, `api/`, `includes/`, `articles/`, `assets/`, `uploads/`.
2. Upload the ZIP to `public_html` and **Extract**.
3. Delete the ZIP.

**Option B – Git deploy**
hPanel → **Advanced → Git**: add `https://github.com/rishitechsolutions/Prasadnd-Blog.git`, branch `main`, install path `public_html`. Then click **Deploy**. Afterwards delete from the server anything not needed: `database/` (or keep its `.htaccess`), `backend/` if present, and the `.md` files.

**Check these hidden files exist after upload** (File Manager → Settings → show hidden files):
- `public_html/admin/.htaccess`
- `public_html/includes/.htaccess`
- `public_html/uploads/articles/.htaccess`

## 9. Set permissions

| Item | Permission |
|---|---|
| Folders | `755` |
| PHP/HTML files | `644` |
| `uploads/articles/` | `755` (must be writable by PHP; never `777`) |
| `portfolio-config.php` | `600` |

## 10. Create the admin account (one time)

1. Open `https://prasadnd.com/admin/setup.php`.
2. Enter the **setup token** (the `admin_setup_token` from your config).
3. **Username: `prasad@prasadnd.com`** (must be exactly this, the reset feature only works for this username).
4. Choose a password of 12+ characters. You are logged in automatically.

## 11. Disable setup (important)

1. Delete `public_html/admin/setup.php`.
2. Edit `portfolio-config.php` and delete the `admin_setup_token` line.

## 12. Test everything

**Admin and articles**
- [ ] `https://prasadnd.com/admin/` while logged out redirects to login.
- [ ] Log in with `prasad@prasadnd.com` and your password.
- [ ] Create a draft article: it must NOT show on Beyond Work or `/api/articles.php`.
- [ ] Publish it: it appears after refresh. Edit it, then delete it.
- [ ] Upload a cover + gallery image (JPEG/PNG/WebP up to 5 MB). SVG and renamed `.php` files must be rejected.

**Forgot Password**
- [ ] Login page shows **Forgot Password?** → click it.
- [ ] Click **Email me a reset link**. The email arrives at `prasad@prasadnd.com` (check spam the first time).
- [ ] Open the link → **Reset Admin Password** page appears. Try mismatched passwords and a password under 8 characters: both rejected.
- [ ] Set a valid new password → redirected to login with "Password changed successfully…".
- [ ] The old password fails; the new one works; the username is still `prasad@prasadnd.com`.
- [ ] Re-opening the same link says it is invalid/expired (single use).
- [ ] Opening `/admin/reset-password.php?token=abc` shows an error and no form.

**Existing site**
- [ ] Home, Education, Profession, Beyond Work and Contact pages load with images.
- [ ] Each old `/articles/*.html` link opens.

## 13. Security checklist

- [ ] `portfolio-config.php` is outside `public_html`.
- [ ] `https://prasadnd.com/includes/db.php` and `/database/schema.sql` return 403/404.
- [ ] `/admin/setup.php` returns 404 (deleted).
- [ ] Uploaded files cannot execute PHP: `https://prasadnd.com/uploads/articles/` shows no listing.
- [ ] Use a strong, unique admin password and keep the `prasad@prasadnd.com` mailbox protected (it controls password recovery).

## Visit counter (footer "Total Visits")

The footer shows a global, database-backed count of website **sessions** (one per PHP session; refreshes and page-to-page navigation in the same session do not add). Admin, login, password-reset, setup, API, static assets and bots are not counted.

1. **Create the table (once).** phpMyAdmin → your database → **SQL** → run `database/upgrade-visit-counter.sql`. It is safe to re-run and never resets an existing count. (A fresh install already gets it from `schema.sql`.)
2. **Deploy the files:** `includes/visit-counter.php`, `public-page.php`, `article.php`, and the `deploy/` folder (reference only).
3. **Add the rewrite rules.** In File Manager open `public_html/.htaccess` (show hidden files), and **append** the contents of `deploy/visit-counter.htaccess` at the end, after any HTTPS-redirect rules. Do not replace the file. Without these rules the site works but the counter and footer total do not appear on the static pages.
4. **Verify:** open `https://prasadnd.com/` in a private window; the footer should show `| Total Visits: N`. Reload and open other pages: N stays the same. Open a new private window: N increases by 1. Check in phpMyAdmin: `SELECT total FROM site_visit_counter;` matches the footer.
5. Google Analytics is unchanged and independent; the two numbers will not match exactly.

## Updating the site later

- **File Manager / Git:** upload or **Deploy** the changed files only. Never overwrite `uploads/articles/` (your uploaded images live there) and never overwrite `portfolio-config.php`.
- Back up the database first: phpMyAdmin → **Export**.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Admin unavailable" / "Service temporarily unavailable" | Wrong DB values in `portfolio-config.php`, config in the wrong folder, or `pdo_mysql` not enabled. Check the error log: hPanel → **Advanced → Error logs**. |
| Login form reloads without signing in | Not on HTTPS. Enable SSL + Force HTTPS. |
| "Your session expired" | Reload the page; make sure cookies are allowed and you use https. |
| Reset says "email is not configured" | `mail_from` missing/invalid in the config. |
| Reset email never arrives | Check spam; make sure `mail_from` is on your domain and the mailbox exists; confirm SPF/DKIM; wait 2 minutes between requests (rate limit). |
| Reset says "link invalid or expired" | Links last 30 minutes and work once. Request a new one. |
| Can't create `prasad@prasadnd.com` at setup | Use the latest code (setup now allows `@`). |
| Image upload fails | Raise `upload_max_filesize`, `post_max_size`, `max_file_uploads` (step 2); make `uploads/articles/` writable. |
| Locked out after failed logins | Wait 15 minutes, or clear rows in `admin_login_attempts` via phpMyAdmin. |
| Forgot the admin password and email isn't working | In phpMyAdmin run `UPDATE admins SET password_hash='<hash>' WHERE username='prasad@prasadnd.com';` with a bcrypt hash generated by `php -r "echo password_hash('NewPassword', PASSWORD_DEFAULT);"`. |
