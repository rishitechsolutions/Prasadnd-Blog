const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
    // Users table for authentication
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Pages content table
    db.run(`CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_name TEXT UNIQUE NOT NULL,
        content TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Articles table for Beyond Work section
    db.run(`CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        image TEXT,
        excerpt TEXT,
        content TEXT,
        published INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Add published column if it doesn't exist (for existing databases)
    db.run(`ALTER TABLE articles ADD COLUMN published INTEGER DEFAULT 1`);

    // Media table for uploaded images
    db.run(`CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Settings table for website configuration
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Social links table
    db.run(`CREATE TABLE IF NOT EXISTS social_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        url TEXT NOT NULL,
        icon TEXT,
        display_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Work Experience table
    db.run(`CREATE TABLE IF NOT EXISTS work_experience (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        period TEXT NOT NULL,
        description TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Education table
    db.run(`CREATE TABLE IF NOT EXISTS education (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        degree TEXT NOT NULL,
        institution TEXT NOT NULL,
        period TEXT NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Certifications table
    db.run(`CREATE TABLE IF NOT EXISTS certifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT,
        info TEXT,
        display_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Contact submissions table
    db.run(`CREATE TABLE IF NOT EXISTS contact_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        read_status INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create default admin user if not exists
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
        if (!row) {
            const defaultPassword = bcrypt.hashSync('admin123', 10);
            db.run('INSERT INTO users (username, password) VALUES (?, ?)', 
                ['admin', defaultPassword], (err) => {
                    if (err) {
                        console.error('Error creating default admin:', err);
                    } else {
                        console.log('Default admin user created: admin / admin123');
                    }
                });
        }
    });
});

// Database helper functions
const dbHelpers = {
    // User authentication
    getUserByUsername: (username) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    // Pages
    getPage: (pageName) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM pages WHERE page_name = ?', [pageName], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    updatePage: (pageName, content) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT OR REPLACE INTO pages (page_name, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                [pageName, content], function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                });
        });
    },

    getAllPages: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM pages ORDER BY page_name', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // Articles
    getAllArticles: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM articles ORDER BY created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getArticle: (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM articles WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    createArticle: (article) => {
        return new Promise((resolve, reject) => {
            const imageUrl = article.featured_image || article.image || '';
            const published = article.published !== undefined ? article.published : 1;
            db.run('INSERT INTO articles (title, category, date, image, excerpt, content, published) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [article.title, article.category, article.date, imageUrl, article.excerpt || '', article.content || '', published],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                });
        });
    },

    updateArticle: (id, article) => {
        return new Promise((resolve, reject) => {
            const imageUrl = article.featured_image || article.image || '';
            const published = article.published !== undefined ? article.published : 1;
            db.run('UPDATE articles SET title = ?, category = ?, date = ?, image = ?, excerpt = ?, content = ?, published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [article.title, article.category, article.date, imageUrl, article.excerpt || '', article.content || '', published, id],
                function(err) {
                    if (err) reject(err);
                    else resolve({ changes: this.changes });
                });
        });
    },

    deleteArticle: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM articles WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    // Media
    getAllMedia: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM media ORDER BY uploaded_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    addMedia: (media) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO media (filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
                [media.filename, media.originalName, media.filePath, media.fileSize, media.mimeType],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                });
        });
    },

    deleteMedia: (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM media WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (row) {
                    db.run('DELETE FROM media WHERE id = ?', [id], function(err) {
                        if (err) reject(err);
                        else resolve({ filePath: row.file_path, changes: this.changes });
                    });
                } else {
                    resolve({ changes: 0 });
                }
            });
        });
    },

    // Settings
    getSetting: (key) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM settings WHERE setting_key = ?', [key], (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.setting_value : null);
            });
        });
    },

    setSetting: (key, value) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT OR REPLACE INTO settings (setting_key, setting_value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                [key, value], function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                });
        });
    },

    getAllSettings: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM settings', (err, rows) => {
                if (err) reject(err);
                else {
                    const settings = {};
                    rows.forEach(row => {
                        settings[row.setting_key] = row.setting_value;
                    });
                    resolve(settings);
                }
            });
        });
    },

    // Social Links
    getAllSocialLinks: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM social_links ORDER BY display_order ASC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    createSocialLink: (link) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO social_links (platform, url, icon, display_order) VALUES (?, ?, ?, ?)',
                [link.platform, link.url, link.icon, link.display_order || 0], function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                });
        });
    },

    updateSocialLink: (id, link) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE social_links SET platform = ?, url = ?, icon = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [link.platform, link.url, link.icon, link.display_order || 0, id], function(err) {
                    if (err) reject(err);
                    else resolve({ changes: this.changes });
                });
        });
    },

    deleteSocialLink: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM social_links WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    // Work Experience
    getAllWorkExperience: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM work_experience ORDER BY display_order ASC, created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getWorkExperience: (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM work_experience WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    createWorkExperience: (work) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO work_experience (company, role, period, description, display_order) VALUES (?, ?, ?, ?, ?)',
                [work.company, work.role, work.period, work.description, work.display_order || 0], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    },

    updateWorkExperience: (id, work) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE work_experience SET company = ?, role = ?, period = ?, description = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [work.company, work.role, work.period, work.description, work.display_order || 0, id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    deleteWorkExperience: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM work_experience WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    // Education
    getAllEducation: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM education ORDER BY display_order ASC, created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getEducation: (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM education WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    createEducation: (edu) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO education (degree, institution, period, description, display_order) VALUES (?, ?, ?, ?, ?)',
                [edu.degree, edu.institution, edu.period, edu.description || '', edu.display_order || 0], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    },

    updateEducation: (id, edu) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE education SET degree = ?, institution = ?, period = ?, description = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [edu.degree, edu.institution, edu.period, edu.description || '', edu.display_order || 0, id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    deleteEducation: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM education WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    // Certifications
    getAllCertifications: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM certifications ORDER BY display_order ASC, created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getCertification: (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM certifications WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    createCertification: (cert) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO certifications (name, icon, info, display_order) VALUES (?, ?, ?, ?)',
                [cert.name, cert.icon || '', cert.info || '', cert.display_order || 0], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    },

    updateCertification: (id, cert) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE certifications SET name = ?, icon = ?, info = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [cert.name, cert.icon || '', cert.info || '', cert.display_order || 0, id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    deleteCertification: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM certifications WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    // Contact Submissions
    getAllContactSubmissions: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM contact_submissions ORDER BY created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getContactSubmission: (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM contact_submissions WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    createContactSubmission: (submission) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO contact_submissions (name, email, message) VALUES (?, ?, ?)',
                [submission.name, submission.email, submission.message], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    },

    markAsRead: (id) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE contact_submissions SET read_status = 1 WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    deleteContactSubmission: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM contact_submissions WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }
};

module.exports = { db, dbHelpers };

