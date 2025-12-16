// Global state
let currentSection = 'dashboard';
let articles = [];
let media = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initLogout();
    loadDashboard();
    initMediaUpload();
});

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            showSection(section);
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function showSection(section) {
    currentSection = section;
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Show selected section
    const sectionEl = document.getElementById(`${section}-section`);
    if (sectionEl) {
        sectionEl.style.display = 'block';
    }
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        pages: 'Pages',
        articles: 'Articles',
        media: 'Media Library',
        settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
    
    // Load section data
    if (section === 'articles') {
        loadArticles();
    } else if (section === 'media') {
        loadMedia();
    } else if (section === 'pages') {
        initPageEditor();
    } else if (section === 'settings') {
        loadSettings();
    }
}

// Logout
function initLogout() {
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/admin';
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
}

// Dashboard stats
async function loadDashboard() {
    try {
        const [articlesRes, mediaRes] = await Promise.all([
            fetch('/api/articles'),
            fetch('/api/media')
        ]);
        
        const articlesData = await articlesRes.json();
        const mediaData = await mediaRes.json();
        
        document.getElementById('articlesCount').textContent = articlesData.length || 0;
        document.getElementById('mediaCount').textContent = mediaData.length || 0;
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Articles Management
async function loadArticles() {
    try {
        const response = await fetch('/api/articles');
        articles = await response.json();
        renderArticles();
    } catch (error) {
        showAlert('Error loading articles', 'error');
    }
}

function renderArticles() {
    const container = document.getElementById('articlesList');
    
    if (articles.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">No articles yet. Create your first article!</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${articles.map(article => `
                        <tr>
                            <td><strong>${article.title}</strong></td>
                            <td>${article.category}</td>
                            <td>${article.date}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary" onclick="editArticle(${article.id})">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteArticle(${article.id})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showArticleForm(articleId = null) {
    const modal = document.getElementById('articleModal');
    const form = document.getElementById('articleForm');
    const title = document.getElementById('articleModalTitle');
    
    if (articleId) {
        const article = articles.find(a => a.id === articleId);
        if (article) {
            title.textContent = 'Edit Article';
            document.getElementById('articleId').value = article.id;
            document.getElementById('articleTitle').value = article.title;
            document.getElementById('articleCategory').value = article.category;
            document.getElementById('articleDate').value = article.date;
            document.getElementById('articleImage').value = article.image || '';
            document.getElementById('articleExcerpt').value = article.excerpt || '';
            document.getElementById('articleContent').value = article.content || '';
        }
    } else {
        title.textContent = 'New Article';
        form.reset();
        document.getElementById('articleId').value = '';
    }
    
    modal.style.display = 'flex';
}

function closeArticleForm() {
    document.getElementById('articleModal').style.display = 'none';
    document.getElementById('articleForm').reset();
}

async function editArticle(id) {
    showArticleForm(id);
}

async function deleteArticle(id) {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
        const response = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            showAlert('Article deleted successfully', 'success');
            loadArticles();
            loadDashboard();
        }
    } catch (error) {
        showAlert('Error deleting article', 'error');
    }
}

document.getElementById('articleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const articleId = document.getElementById('articleId').value;
    const articleData = {
        title: document.getElementById('articleTitle').value,
        category: document.getElementById('articleCategory').value,
        date: document.getElementById('articleDate').value,
        image: document.getElementById('articleImage').value,
        excerpt: document.getElementById('articleExcerpt').value,
        content: document.getElementById('articleContent').value
    };
    
    try {
        const url = articleId ? `/api/articles/${articleId}` : '/api/articles';
        const method = articleId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(articleData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(articleId ? 'Article updated successfully' : 'Article created successfully', 'success');
            closeArticleForm();
            loadArticles();
            loadDashboard();
        }
    } catch (error) {
        showAlert('Error saving article', 'error');
    }
});

// Media Management
function initMediaUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
}

async function handleFiles(files) {
    const formData = new FormData();
    
    for (let file of files) {
        formData.append('file', file);
    }
    
    try {
        showAlert('Uploading files...', 'info');
        
        // Upload files one by one
        for (let file of files) {
            const fileFormData = new FormData();
            fileFormData.append('file', file);
            
            const response = await fetch('/api/media/upload', {
                method: 'POST',
                body: fileFormData
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Upload failed');
            }
        }
        
        showAlert('Files uploaded successfully', 'success');
        loadMedia();
        loadDashboard();
    } catch (error) {
        showAlert('Error uploading files: ' + error.message, 'error');
    }
}

async function loadMedia() {
    try {
        const response = await fetch('/api/media');
        media = await response.json();
        renderMedia();
    } catch (error) {
        showAlert('Error loading media', 'error');
    }
}

function renderMedia() {
    const container = document.getElementById('mediaGrid');
    
    if (media.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary); grid-column: 1/-1;">No media files yet. Upload your first image!</p>';
        return;
    }
    
    container.innerHTML = media.map(item => `
        <div class="media-item">
            <img src="/uploads/${item.filename}" alt="${item.original_name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23ddd\' width=\'200\' height=\'200\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'14\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\'%3EImage%3C/text%3E%3C/svg%3E'">
            <div class="media-item-info">
                <div class="media-item-name">${item.original_name}</div>
                <div class="media-item-size">${formatFileSize(item.file_size)}</div>
            </div>
            <div class="media-item-actions">
                <button class="btn btn-sm btn-danger" onclick="deleteMedia(${item.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

async function deleteMedia(id) {
    if (!confirm('Are you sure you want to delete this media file?')) return;
    
    try {
        const response = await fetch(`/api/media/${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            showAlert('Media deleted successfully', 'success');
            loadMedia();
            loadDashboard();
        }
    } catch (error) {
        showAlert('Error deleting media', 'error');
    }
}

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Page Editor
function initPageEditor() {
    const selector = document.getElementById('pageSelector');
    selector.addEventListener('change', async (e) => {
        const pageName = e.target.value;
        if (pageName) {
            try {
                const response = await fetch(`/api/pages/${pageName}`);
                const page = await response.json();
                document.getElementById('pageContent').value = page.content || '';
                document.getElementById('pageEditor').style.display = 'block';
            } catch (error) {
                showAlert('Error loading page', 'error');
            }
        } else {
            document.getElementById('pageEditor').style.display = 'none';
        }
    });
}

async function savePage() {
    const pageName = document.getElementById('pageSelector').value;
    const content = document.getElementById('pageContent').value;
    
    if (!pageName) {
        showAlert('Please select a page', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/pages/${pageName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Page saved successfully', 'success');
        }
    } catch (error) {
        showAlert('Error saving page', 'error');
    }
}

// Alert system
function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; cursor: pointer; font-size: 1.2rem;">×</button>
    `;
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Settings Management
let settings = {};
let socialLinks = [];

async function loadSettings() {
    try {
        // First, automatically initialize from website files (silently)
        try {
            await fetch('/api/settings/init', { method: 'POST' });
        } catch (e) {
            // Silent fail - will use defaults
        }
        
        // Then load from database
        const [settingsRes, socialRes] = await Promise.all([
            fetch('/api/settings'),
            fetch('/api/social-links')
        ]);
        
        settings = await settingsRes.json();
        socialLinks = await socialRes.json();
        
        // Load logo - use database value or default
        const logoUrl = settings.logo_url || 'assets/logo.jpg';
        document.getElementById('logoUrl').value = logoUrl;
        updateLogoPreview(logoUrl);
        
        // Load profile picture - use database value or default
        const profileUrl = settings.profile_picture_url || 'assets/profile pic.jpg';
        document.getElementById('profileUrl').value = profileUrl;
        updateProfilePreview(profileUrl);
        
        // If no social links, they should have been loaded by init, but if still empty, use defaults
        if (socialLinks.length === 0) {
            const defaultLinks = [
                { platform: 'Facebook', url: '#', icon: '', display_order: 0 },
                { platform: 'Instagram', url: '#', icon: '', display_order: 1 },
                { platform: 'LinkedIn', url: '#', icon: '', display_order: 2 },
                { platform: 'Twitter', url: '#', icon: '', display_order: 3 }
            ];
            
            for (const link of defaultLinks) {
                try {
                    await fetch('/api/social-links', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(link)
                    });
                } catch (e) {}
            }
            
            const socialRes2 = await fetch('/api/social-links');
            socialLinks = await socialRes2.json();
        }
        
        // Load social links
        renderSocialLinks();
    } catch (error) {
        console.error('Error loading settings:', error);
        // Show defaults even if there's an error
        const logoUrl = 'assets/logo.jpg';
        const profileUrl = 'assets/profile pic.jpg';
        if (document.getElementById('logoUrl')) {
            document.getElementById('logoUrl').value = logoUrl;
            updateLogoPreview(logoUrl);
        }
        if (document.getElementById('profileUrl')) {
            document.getElementById('profileUrl').value = profileUrl;
            updateProfilePreview(profileUrl);
        }
    }
}

function updateLogoPreview(url) {
    const preview = document.getElementById('logoPreview');
    const img = document.getElementById('logoPreviewImg');
    const placeholder = preview.querySelector('span');
    
    if (url) {
        // Handle different path formats - convert to absolute paths
        let imgSrc = url;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            // Full URL - use as is
            imgSrc = url;
        } else if (url.startsWith('/uploads/')) {
            // Admin uploads - use as is
            imgSrc = url;
        } else if (url.startsWith('/')) {
            // Already absolute path
            imgSrc = url;
        } else {
            // Relative path - convert to absolute
            // If it starts with assets/, use /assets/, otherwise prepend /
            if (url.startsWith('assets/')) {
                imgSrc = `/${url}`;
            } else {
                imgSrc = `/${url}`;
            }
        }
        
        img.src = imgSrc;
        img.style.display = 'block';
        placeholder.style.display = 'none';
        
        img.onerror = () => {
            console.log('Failed to load image from:', imgSrc);
            img.style.display = 'none';
            placeholder.style.display = 'block';
        };
        
        img.onload = () => {
            console.log('Image loaded successfully from:', imgSrc);
        };
    } else {
        img.style.display = 'none';
        placeholder.style.display = 'block';
    }
}

function updateProfilePreview(url) {
    const preview = document.getElementById('profilePreview');
    const img = document.getElementById('profilePreviewImg');
    const placeholder = preview.querySelector('span');
    
    if (url) {
        // Handle different path formats
        let imgSrc = url;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            // Full URL - use as is
            imgSrc = url;
        } else if (url.startsWith('/uploads/')) {
            // Admin uploads - use as is (served from /uploads)
            imgSrc = url;
        } else if (url.startsWith('/')) {
            // Absolute path from root
            imgSrc = url;
        } else if (url.startsWith('assets/')) {
            // Relative path from root - need to go up from admin folder
            imgSrc = `../../${url}`;
        } else {
            // Try as relative path
            imgSrc = `../../${url}`;
        }
        
        img.src = imgSrc;
        img.style.display = 'block';
        placeholder.style.display = 'none';
        
        img.onerror = () => {
            console.log('Failed to load profile from:', imgSrc, 'trying alternative path');
            // Try alternative path
            if (!url.startsWith('/') && !url.startsWith('http')) {
                img.src = `/${url}`;
                img.onerror = () => {
                    img.style.display = 'none';
                    placeholder.style.display = 'block';
                };
            } else {
                img.style.display = 'none';
                placeholder.style.display = 'block';
            }
        };
    } else {
        img.style.display = 'none';
        placeholder.style.display = 'block';
    }
}

async function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            const url = `/uploads/${data.filename}`;
            document.getElementById('logoUrl').value = url;
            updateLogoPreview(url);
            showAlert('Logo uploaded successfully', 'success');
        }
    } catch (error) {
        showAlert('Error uploading logo', 'error');
    }
}

async function handleProfileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            const url = `/uploads/${data.filename}`;
            document.getElementById('profileUrl').value = url;
            updateProfilePreview(url);
            showAlert('Profile picture uploaded successfully', 'success');
        }
    } catch (error) {
        showAlert('Error uploading profile picture', 'error');
    }
}

async function saveLogo() {
    const url = document.getElementById('logoUrl').value;
    
    try {
        const response = await fetch('/api/settings/logo_url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: url })
        });
        
        const data = await response.json();
        if (data.success) {
            showAlert('Logo saved successfully', 'success');
            updateLogoPreview(url);
        }
    } catch (error) {
        showAlert('Error saving logo', 'error');
    }
}

async function saveProfile() {
    const url = document.getElementById('profileUrl').value;
    
    try {
        const response = await fetch('/api/settings/profile_picture_url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: url })
        });
        
        const data = await response.json();
        if (data.success) {
            showAlert('Profile picture saved successfully', 'success');
            updateProfilePreview(url);
        }
    } catch (error) {
        showAlert('Error saving profile picture', 'error');
    }
}

// Initialize settings from website
async function initSettingsFromWebsite() {
    if (!confirm('This will load the current logo, profile picture, and social links from your website files. Continue?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/settings/init', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            showAlert('Settings loaded from website successfully!', 'success');
            loadSettings();
        } else {
            showAlert('Error loading settings from website', 'error');
        }
    } catch (error) {
        showAlert('Error loading settings from website', 'error');
    }
}

// Social Links Management
function renderSocialLinks() {
    const container = document.getElementById('socialLinksList');
    
    if (socialLinks.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">No social links yet. Add your first social link!</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-container" style="margin-top: 1.5rem;">
            <table>
                <thead>
                    <tr>
                        <th>Platform</th>
                        <th>URL</th>
                        <th>Order</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${socialLinks.map(link => `
                        <tr>
                            <td><strong>${link.platform}</strong></td>
                            <td><a href="${link.url}" target="_blank" style="color: var(--primary-color);">${link.url}</a></td>
                            <td>${link.display_order}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary" onclick="editSocialLink(${link.id})">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteSocialLink(${link.id})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showSocialLinkForm(linkId = null) {
    const modal = document.getElementById('socialLinkModal');
    const form = document.getElementById('socialLinkForm');
    const title = document.getElementById('socialLinkModalTitle');
    
    if (linkId) {
        const link = socialLinks.find(l => l.id === linkId);
        if (link) {
            title.textContent = 'Edit Social Link';
            document.getElementById('socialLinkId').value = link.id;
            document.getElementById('socialPlatform').value = link.platform;
            document.getElementById('socialUrl').value = link.url;
            document.getElementById('socialIcon').value = link.icon || '';
            document.getElementById('socialOrder').value = link.display_order || 0;
        }
    } else {
        title.textContent = 'Add Social Link';
        form.reset();
        document.getElementById('socialLinkId').value = '';
        document.getElementById('socialOrder').value = 0;
    }
    
    modal.style.display = 'flex';
}

function closeSocialLinkForm() {
    document.getElementById('socialLinkModal').style.display = 'none';
    document.getElementById('socialLinkForm').reset();
}

async function editSocialLink(id) {
    showSocialLinkForm(id);
}

async function deleteSocialLink(id) {
    if (!confirm('Are you sure you want to delete this social link?')) return;
    
    try {
        const response = await fetch(`/api/social-links/${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            showAlert('Social link deleted successfully', 'success');
            loadSettings();
        }
    } catch (error) {
        showAlert('Error deleting social link', 'error');
    }
}

document.getElementById('socialLinkForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const linkId = document.getElementById('socialLinkId').value;
    const linkData = {
        platform: document.getElementById('socialPlatform').value,
        url: document.getElementById('socialUrl').value,
        icon: document.getElementById('socialIcon').value,
        display_order: parseInt(document.getElementById('socialOrder').value) || 0
    };
    
    try {
        const url = linkId ? `/api/social-links/${linkId}` : '/api/social-links';
        const method = linkId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(linkData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(linkId ? 'Social link updated successfully' : 'Social link created successfully', 'success');
            closeSocialLinkForm();
            loadSettings();
        }
    } catch (error) {
        showAlert('Error saving social link', 'error');
    }
});

