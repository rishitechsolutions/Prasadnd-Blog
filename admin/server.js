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

// CORS middleware for frontend access
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all origins (you can restrict this to your Netlify domain)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

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

// ============================================
// PUBLIC API ENDPOINTS (No authentication required)
// These are for the frontend website to fetch content
// ============================================

// Public settings endpoint
app.get('/api/public/settings', async (req, res) => {
    try {
        const settings = await dbHelpers.getAllSettings();
        // getAllSettings already returns an object, so use it directly
        res.json(settings);
    } catch (error) {
        // Return defaults if error
        res.json({
            logo_url: 'assets/logo.jpg',
            profile_picture_url: 'assets/profile pic.jpg'
        });
    }
});

// Public social links endpoint
app.get('/api/public/social-links', async (req, res) => {
    try {
        const links = await dbHelpers.getAllSocialLinks();
        // Sort by display_order
        links.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        res.json(links);
    } catch (error) {
        res.json([]);
    }
});

// Public articles endpoint (only published articles)
app.get('/api/public/articles', async (req, res) => {
    try {
        const articles = await dbHelpers.getAllArticles();
        // Filter only published articles and sort by date (newest first)
        const published = articles
            .filter(article => article.published === 1)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        res.json(published);
    } catch (error) {
        res.json([]);
    }
});

// Public work experience endpoint
app.get('/api/public/work-experience', async (req, res) => {
    try {
        const workExp = await dbHelpers.getAllWorkExperience();
        res.json(workExp);
    } catch (error) {
        res.json([]);
    }
});

// Public education endpoint
app.get('/api/public/education', async (req, res) => {
    try {
        const education = await dbHelpers.getAllEducation();
        res.json(education);
    } catch (error) {
        res.json([]);
    }
});

// Public certifications endpoint
app.get('/api/public/certifications', async (req, res) => {
    try {
        const certifications = await dbHelpers.getAllCertifications();
        res.json(certifications);
    } catch (error) {
        res.json([]);
    }
});

// ============================================
// ADMIN API ENDPOINTS (Authentication required)
// ============================================

// Work Experience routes
app.get('/api/work-experience', requireAuth, async (req, res) => {
    try {
        const workExp = await dbHelpers.getAllWorkExperience();
        res.json(workExp);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching work experience' });
    }
});

app.get('/api/work-experience/:id', requireAuth, async (req, res) => {
    try {
        const work = await dbHelpers.getWorkExperience(req.params.id);
        res.json(work || {});
    } catch (error) {
        res.status(500).json({ error: 'Error fetching work experience' });
    }
});

app.post('/api/work-experience', requireAuth, async (req, res) => {
    try {
        const result = await dbHelpers.createWorkExperience(req.body);
        res.json({ success: true, id: result.id, message: 'Work experience created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error creating work experience' });
    }
});

app.put('/api/work-experience/:id', requireAuth, async (req, res) => {
    try {
        await dbHelpers.updateWorkExperience(req.params.id, req.body);
        res.json({ success: true, message: 'Work experience updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating work experience' });
    }
});

app.delete('/api/work-experience/:id', requireAuth, async (req, res) => {
    try {
        await dbHelpers.deleteWorkExperience(req.params.id);
        res.json({ success: true, message: 'Work experience deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting work experience' });
    }
});

// Education routes
app.get('/api/education', requireAuth, async (req, res) => {
    try {
        const education = await dbHelpers.getAllEducation();
        res.json(education);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching education' });
    }
});

app.get('/api/education/:id', requireAuth, async (req, res) => {
    try {
        const edu = await dbHelpers.getEducation(req.params.id);
        res.json(edu || {});
    } catch (error) {
        res.status(500).json({ error: 'Error fetching education' });
    }
});

app.post('/api/education', requireAuth, async (req, res) => {
    try {
        const result = await dbHelpers.createEducation(req.body);
        res.json({ success: true, id: result.id, message: 'Education created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error creating education' });
    }
});

app.put('/api/education/:id', requireAuth, async (req, res) => {
    try {
        await dbHelpers.updateEducation(req.params.id, req.body);
        res.json({ success: true, message: 'Education updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating education' });
    }
});

app.delete('/api/education/:id', requireAuth, async (req, res) => {
    try {
        await dbHelpers.deleteEducation(req.params.id);
        res.json({ success: true, message: 'Education deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting education' });
    }
});

// Certifications routes
app.get('/api/certifications', requireAuth, async (req, res) => {
    try {
        const certifications = await dbHelpers.getAllCertifications();
        res.json(certifications);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching certifications' });
    }
});

app.get('/api/certifications/:id', requireAuth, async (req, res) => {
    try {
        const cert = await dbHelpers.getCertification(req.params.id);
        res.json(cert || {});
    } catch (error) {
        res.status(500).json({ error: 'Error fetching certification' });
    }
});

app.post('/api/certifications', requireAuth, async (req, res) => {
    try {
        const result = await dbHelpers.createCertification(req.body);
        res.json({ success: true, id: result.id, message: 'Certification created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error creating certification' });
    }
});

app.put('/api/certifications/:id', requireAuth, async (req, res) => {
    try {
        await dbHelpers.updateCertification(req.params.id, req.body);
        res.json({ success: true, message: 'Certification updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating certification' });
    }
});

app.delete('/api/certifications/:id', requireAuth, async (req, res) => {
    try {
        await dbHelpers.deleteCertification(req.params.id);
        res.json({ success: true, message: 'Certification deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting certification' });
    }
});

// Contact Submissions routes
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }
        const result = await dbHelpers.createContactSubmission({ name, email, message });
        res.json({ success: true, id: result.id, message: 'Thank you for your message! We will get back to you soon.' });
    } catch (error) {
        res.status(500).json({ error: 'Error submitting contact form' });
    }
});

app.get('/api/contact-submissions', requireAuth, async (req, res) => {
    try {
        const submissions = await dbHelpers.getAllContactSubmissions();
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching contact submissions' });
    }
});

app.put('/api/contact-submissions/:id/read', requireAuth, async (req, res) => {
    try {
        await dbHelpers.markAsRead(req.params.id);
        res.json({ success: true, message: 'Submission marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating submission' });
    }
});

app.delete('/api/contact-submissions/:id', requireAuth, async (req, res) => {
    try {
        await dbHelpers.deleteContactSubmission(req.params.id);
        res.json({ success: true, message: 'Submission deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting submission' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Admin Dashboard running on http://localhost:${PORT}/admin`);
    console.log(`📝 Default login: admin / admin123\n`);
});

