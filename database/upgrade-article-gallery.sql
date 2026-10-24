ALTER TABLE articles
    ADD COLUMN gallery_images LONGTEXT DEFAULT NULL AFTER image_path;