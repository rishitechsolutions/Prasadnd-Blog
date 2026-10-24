CREATE TABLE IF NOT EXISTS site_visit_counter (
    id TINYINT UNSIGNED NOT NULL,
    total BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Safe to re-run: never resets an existing count.
INSERT IGNORE INTO site_visit_counter (id, total) VALUES (1, 0);
