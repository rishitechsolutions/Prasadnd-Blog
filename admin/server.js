const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { dbHelpers } = require('./database');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve assets from root directory
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

// Session configuration
app.use(session({
    secret: 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Serve admin dashboard
app.get('/admin', (req, res) => {
    if (req.session && req.session.user) {
        res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
    } else {
        res.sendFile(path.join(__dirname, 'views', 'login.html'));
    }
});

// Authentication routes
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await dbHelpers.getUserByUsername(username);
        
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.user = { id: user.id, username: user.username };
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
});

// Content management routes
app.get('/api/pages', requireAuth, async (req, res) => {
    try {
        const pages = await dbHelpers.getAllPages();
        res.json(pages);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching pages' });
    }
});

app.get('/api/pages/:pageName', requireAuth, async (req, res) => {
    try {
        const page = await dbHelpers.getPage(req.params.pageName);
        res.json(page || {});
    } catch (error) {
        res.status(500).json({ error: 'Error fetching page' });
    }
});

app.post('/api/pages/:pageName', requireAuth, async (req, res) => {
    try {
        const { content } = req.body;
        await dbHelpers.updatePage(req.params.pageName, content);
        res.json({ success: true, message: 'Page updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating page' });
    }
});

// Articles routes
app.get('/api/articles', requireAuth, async (req, res) => {
    try {
        const articles = await dbHelpers.getAllArticles();
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching articles' });
    }
});

app.get('/api/articles/:id', requireAuth, async (req, res) => {
    try {
        const article = await dbHelpers.getArticle(req.params.id);
        res.json(article || {});
    } catch (error) {
        res.status(500).json({ error: 'Error fetching article' });
    }
});

app.post('/api/articles', requireAuth, async (req, res) => {
    try {
        const result = await dbHelpers.createArticle(req.body);
        res.json({ success: true, id: result.id, message: 'Article created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error creating article' });
    }
});

app.put('/api/articles/:id', requireAuth, async (req, res) => {
    try {
        await dbHelpers.updateArticle(req.params.id, req.body);
        res.json({ success: true, message: 'Article updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating article' });
    }
});

app.delete('/api/articles/:id', requireAuth, async (req, res) => {
    try {
        await dbHelpers.deleteArticle(req.params.id);
        res.json({ success: true, message: 'Article deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting article' });
    }
});

// Media routes
app.get('/api/media', requireAuth, async (req, res) => {
    try {
        const media = await dbHelpers.getAllMedia();
        res.json(media);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching media' });
    }
});

app.post('/api/media/upload', requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const mediaData = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            mimeType: req.file.mimetype
        };
        
        const result = await dbHelpers.addMedia(mediaData);
        res.json({ success: true, id: result.id, filename: mediaData.filename, message: 'File uploaded successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Error uploading file' });
    }
});

app.delete('/api/media/:id', requireAuth, async (req, res) => {
    try {
        const result = await dbHelpers.deleteMedia(req.params.id);
        if (result.changes > 0) {
            // Delete the actual file
            const filePath = path.join(__dirname, result.filePath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        res.json({ success: true, message: 'Media deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting media' });
    }
});

// Settings routes
app.get('/api/settings', requireAuth, async (req, res) => {
    try {
        const settings = await dbHelpers.getAllSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching settings' });
    }
});

app.post('/api/settings/:key', requireAuth, async (req, res) => {
    try {
        const { value } = req.body;
        await dbHelpers.setSetting(req.params.key, value);
        res.json({ success: true, message: 'Setting updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating setting' });
    }
});

// Social Links routes
app.get('/api/social-links', requireAuth, async (req, res) => {
    try {
        const links = await dbHelpers.getAllSocialLinks();
        res.json(links);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching social links' });
    }
});

app.post('/api/social-links', requireAuth, async (req, res) => {
    try {
        const result = await dbHelpers.createSocialLink(req.body);
        res.json({ success: true, id: result.id, message: 'Social link created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error creating social link' });
    }
});

app.put('/api/social-links/:id', requireAuth, async (req, res) => {
    try {
        await dbHelpers.updateSocialLink(req.params.id, req.body);
        res.json({ success: true, message: 'Social link updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating social link' });
    }
});

app.delete('/api/social-links/:id', requireAuth, async (req, res) => {
    try {
        await dbHelpers.deleteSocialLink(req.params.id);
        res.json({ success: true, message: 'Social link deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting social link' });
    }
});

// Initialize settings endpoint (auto-called, no auth needed for internal use)
app.post('/api/settings/init', async (req, res) => {
    try {
        const { initSettings } = require('./init-settings');
        const result = await initSettings();
        res.json({ success: true, message: 'Settings initialized from website files', data: result });
    } catch (error) {
        // Don't fail - just return success with defaults
        res.json({ success: true, message: 'Using default settings', error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Admin Dashboard running on http://localhost:${PORT}/admin`);
    console.log(`📝 Default login: admin / admin123\n`);
});

