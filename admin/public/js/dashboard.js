// Global state
let currentSection = 'dashboard';
let articles = [];
let media = [];
let pageEditor = null;
let articleEditor = null;

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
        'work-experience': 'Work Experience',
        education: 'Education',
        certifications: 'Certifications',
        'contact-submissions': 'Contact Messages',
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
    } else if (section === 'work-experience') {
        loadWorkExperience();
    } else if (section === 'education') {
        loadEducation();
    } else if (section === 'certifications') {
        loadCertifications();
    } else if (section === 'contact-submissions') {
        loadContactSubmissions();
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
                        <th>Status</th>
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
                                <span style="padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.85rem; background: ${article.published === 1 ? 'var(--primary-color)' : '#666'}; color: white;">
                                    ${article.published === 1 ? 'Published' : 'Draft'}
                                </span>
                            </td>
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
    
    // Initialize Quill editor for article content if not already initialized
    const editorContainer = document.getElementById('articleContentEditor');
    if (editorContainer && !articleEditor) {
        articleEditor = new Quill('#articleContentEditor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['link', 'image'],
                    ['clean']
                ]
            }
        });
    }
    
    if (articleId) {
        const article = articles.find(a => a.id === articleId);
        if (article) {
            title.textContent = 'Edit Article';
            document.getElementById('articleId').value = article.id;
            document.getElementById('articleTitle').value = article.title;
            document.getElementById('articleCategory').value = article.category;
            document.getElementById('articleDate').value = article.date;
            document.getElementById('articleImage').value = article.image || article.featured_image || '';
            document.getElementById('articleExcerpt').value = article.excerpt || '';
            if (articleEditor) {
                articleEditor.root.innerHTML = article.content || '';
            }
            document.getElementById('articlePublished').checked = article.published !== 0;
            
            // Show preview if image exists
            updateArticleImagePreview(article.image || article.featured_image || '');
        }
    } else {
        title.textContent = 'New Article';
        form.reset();
        document.getElementById('articleId').value = '';
        document.getElementById('articlePublished').checked = true;
        document.getElementById('articleImagePreview').style.display = 'none';
        if (articleEditor) {
            articleEditor.root.innerHTML = '';
        }
    }
    
    modal.style.display = 'flex';
}

function updateArticleImagePreview(url) {
    const preview = document.getElementById('articleImagePreview');
    const img = document.getElementById('articleImagePreviewImg');
    
    if (url) {
        // Handle both relative and absolute URLs
        if (url.startsWith('http') || url.startsWith('//')) {
            img.src = url;
        } else if (url.startsWith('/')) {
            img.src = url;
        } else {
            img.src = url.startsWith('assets/') ? url : `assets/${url}`;
        }
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
}

async function handleArticleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showAlert('Please upload an image file', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            const imageUrl = `/uploads/${data.filename}`;
            document.getElementById('articleImage').value = imageUrl;
            updateArticleImagePreview(imageUrl);
            showAlert('Image uploaded successfully', 'success');
        }
    } catch (error) {
        showAlert('Error uploading image', 'error');
    }
}

// Update preview when image URL changes
document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('articleImage');
    if (imageInput) {
        imageInput.addEventListener('input', (e) => {
            updateArticleImagePreview(e.target.value);
        });
    }
});

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
        featured_image: document.getElementById('articleImage').value, // Also set featured_image
        excerpt: document.getElementById('articleExcerpt').value,
        content: articleEditor ? articleEditor.root.innerHTML : '',
        published: document.getElementById('articlePublished').checked ? 1 : 0
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
    // Initialize Quill editor for page content
    const editorContainer = document.getElementById('pageContentEditor');
    if (editorContainer && !pageEditor) {
        pageEditor = new Quill('#pageContentEditor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['link', 'image'],
                    ['clean']
                ]
            }
        });
    }
    
    const selector = document.getElementById('pageSelector');
    if (selector && !selector.hasAttribute('data-listener')) {
        selector.setAttribute('data-listener', 'true');
        selector.addEventListener('change', async (e) => {
            const pageName = e.target.value;
            if (pageName) {
                try {
                    const response = await fetch(`/api/pages/${pageName}`);
                    const page = await response.json();
                    if (pageEditor) {
                        pageEditor.root.innerHTML = page.content || '';
                    }
                    document.getElementById('pageEditor').style.display = 'block';
                } catch (error) {
                    showAlert('Error loading page', 'error');
                }
            } else {
                document.getElementById('pageEditor').style.display = 'none';
            }
        });
    }
}

async function savePage() {
    const pageName = document.getElementById('pageSelector').value;
    const content = pageEditor ? pageEditor.root.innerHTML : '';
    
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
        
        // Load resume URL
        const resumeUrl = settings.resume_url || 'assets/Resume - Prasad ND.pdf';
        document.getElementById('resumeUrl').value = resumeUrl;
        document.getElementById('currentResumeUrl').textContent = resumeUrl || 'Not set';
        
        // Load video URL
        const videoUrl = settings.video_url || '';
        document.getElementById('videoUrl').value = videoUrl;
        document.getElementById('currentVideoUrl').textContent = videoUrl || 'Not set';
        
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

// Resume & Video Management
async function handleResumeUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
        showAlert('Please upload a PDF file', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            const resumeUrl = `/uploads/${data.filename}`;
            document.getElementById('resumeUrl').value = resumeUrl;
            document.getElementById('currentResumeUrl').textContent = resumeUrl;
            showAlert('Resume uploaded successfully', 'success');
        }
    } catch (error) {
        showAlert('Error uploading resume', 'error');
    }
}

async function saveResume() {
    let url = document.getElementById('resumeUrl').value.trim();
    
    if (!url) {
        showAlert('Please enter a resume URL', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/settings/resume_url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: url })
        });
        
        const data = await response.json();
        if (data.success) {
            document.getElementById('currentResumeUrl').textContent = url;
            showAlert('Resume URL saved successfully', 'success');
        }
    } catch (error) {
        showAlert('Error saving resume URL', 'error');
    }
}

async function saveVideo() {
    let url = document.getElementById('videoUrl').value.trim();
    
    if (!url) {
        showAlert('Please enter a video URL', 'error');
        return;
    }
    
    // Convert YouTube URL to embed format if needed
    if (url.includes('youtube.com/watch')) {
        const videoId = url.match(/[?&]v=([^&]+)/);
        if (videoId) {
            url = `https://www.youtube.com/embed/${videoId[1]}`;
        }
    } else if (url.includes('youtu.be/')) {
        const videoId = url.match(/youtu.be\/([^?]+)/);
        if (videoId) {
            url = `https://www.youtube.com/embed/${videoId[1]}`;
        }
    }
    
    try {
        const response = await fetch('/api/settings/video_url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: url })
        });
        
        const data = await response.json();
        if (data.success) {
            document.getElementById('currentVideoUrl').textContent = url;
            showAlert('Video URL saved successfully', 'success');
        }
    } catch (error) {
        showAlert('Error saving video URL', 'error');
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

// ============================================
// WORK EXPERIENCE MANAGEMENT
// ============================================
let workExperience = [];

async function loadWorkExperience() {
    try {
        const response = await fetch('/api/work-experience');
        workExperience = await response.json();
        renderWorkExperience();
    } catch (error) {
        showAlert('Error loading work experience', 'error');
    }
}

function renderWorkExperience() {
    const container = document.getElementById('workExperienceList');
    if (!container) return;

    if (workExperience.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); padding: 2rem; text-align: center;">No work experience entries yet. Click "Add Work Experience" to get started.</p>';
        return;
    }

    container.innerHTML = workExperience.map(work => `
        <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                    <h3 style="margin: 0 0 0.5rem 0; color: var(--primary-color);">${work.company}</h3>
                    <p style="margin: 0 0 0.5rem 0; font-weight: 600;">${work.role}</p>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${work.period}</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-sm btn-secondary" onclick="editWorkExperience(${work.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteWorkExperience(${work.id})">Delete</button>
                </div>
            </div>
            <div style="margin-top: 1rem;">
                <p style="color: var(--text-secondary); font-size: 0.9rem; white-space: pre-line;">${work.description.split('\n').slice(0, 3).join('\n')}${work.description.split('\n').length > 3 ? '...' : ''}</p>
            </div>
        </div>
    `).join('');
}

function showWorkExperienceForm(id = null) {
    const modal = document.getElementById('workExperienceModal');
    const form = document.getElementById('workExperienceForm');
    const title = document.getElementById('workExperienceModalTitle');
    
    if (id) {
        const work = workExperience.find(w => w.id === id);
        if (work) {
            title.textContent = 'Edit Work Experience';
            document.getElementById('workExperienceId').value = work.id;
            document.getElementById('workCompany').value = work.company;
            document.getElementById('workRole').value = work.role;
            document.getElementById('workPeriod').value = work.period;
            document.getElementById('workDescription').value = work.description;
            document.getElementById('workOrder').value = work.display_order || 0;
        }
    } else {
        title.textContent = 'Add Work Experience';
        form.reset();
        document.getElementById('workExperienceId').value = '';
        document.getElementById('workOrder').value = 0;
    }
    
    modal.style.display = 'flex';
}

function closeWorkExperienceForm() {
    document.getElementById('workExperienceModal').style.display = 'none';
    document.getElementById('workExperienceForm').reset();
}

function editWorkExperience(id) {
    showWorkExperienceForm(id);
}

async function deleteWorkExperience(id) {
    if (!confirm('Are you sure you want to delete this work experience entry?')) return;
    
    try {
        const response = await fetch(`/api/work-experience/${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            showAlert('Work experience deleted successfully', 'success');
            loadWorkExperience();
        }
    } catch (error) {
        showAlert('Error deleting work experience', 'error');
    }
}

document.getElementById('workExperienceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const workId = document.getElementById('workExperienceId').value;
    const workData = {
        company: document.getElementById('workCompany').value,
        role: document.getElementById('workRole').value,
        period: document.getElementById('workPeriod').value,
        description: document.getElementById('workDescription').value,
        display_order: parseInt(document.getElementById('workOrder').value) || 0
    };
    
    try {
        const url = workId ? `/api/work-experience/${workId}` : '/api/work-experience';
        const method = workId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(workId ? 'Work experience updated successfully' : 'Work experience created successfully', 'success');
            closeWorkExperienceForm();
            loadWorkExperience();
        }
    } catch (error) {
        showAlert('Error saving work experience', 'error');
    }
});

// ============================================
// EDUCATION MANAGEMENT
// ============================================
let education = [];

async function loadEducation() {
    try {
        const response = await fetch('/api/education');
        education = await response.json();
        renderEducation();
    } catch (error) {
        showAlert('Error loading education', 'error');
    }
}

function renderEducation() {
    const container = document.getElementById('educationList');
    if (!container) return;

    if (education.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); padding: 2rem; text-align: center;">No education entries yet. Click "Add Education" to get started.</p>';
        return;
    }

    container.innerHTML = education.map(edu => `
        <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3 style="margin: 0 0 0.5rem 0; color: var(--primary-color);">${edu.degree}</h3>
                    <p style="margin: 0 0 0.5rem 0; font-weight: 600;">${edu.institution}</p>
                    <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary); font-size: 0.9rem;">${edu.period}</p>
                    ${edu.description ? `<p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${edu.description}</p>` : ''}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-sm btn-secondary" onclick="editEducation(${edu.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEducation(${edu.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function showEducationForm(id = null) {
    const modal = document.getElementById('educationModal');
    const form = document.getElementById('educationForm');
    const title = document.getElementById('educationModalTitle');
    
    if (id) {
        const edu = education.find(e => e.id === id);
        if (edu) {
            title.textContent = 'Edit Education';
            document.getElementById('educationId').value = edu.id;
            document.getElementById('eduDegree').value = edu.degree;
            document.getElementById('eduInstitution').value = edu.institution;
            document.getElementById('eduPeriod').value = edu.period;
            document.getElementById('eduDescription').value = edu.description || '';
            document.getElementById('eduOrder').value = edu.display_order || 0;
        }
    } else {
        title.textContent = 'Add Education';
        form.reset();
        document.getElementById('educationId').value = '';
        document.getElementById('eduOrder').value = 0;
    }
    
    modal.style.display = 'flex';
}

function closeEducationForm() {
    document.getElementById('educationModal').style.display = 'none';
    document.getElementById('educationForm').reset();
}

function editEducation(id) {
    showEducationForm(id);
}

async function deleteEducation(id) {
    if (!confirm('Are you sure you want to delete this education entry?')) return;
    
    try {
        const response = await fetch(`/api/education/${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            showAlert('Education deleted successfully', 'success');
            loadEducation();
        }
    } catch (error) {
        showAlert('Error deleting education', 'error');
    }
}

document.getElementById('educationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const eduId = document.getElementById('educationId').value;
    const eduData = {
        degree: document.getElementById('eduDegree').value,
        institution: document.getElementById('eduInstitution').value,
        period: document.getElementById('eduPeriod').value,
        description: document.getElementById('eduDescription').value,
        display_order: parseInt(document.getElementById('eduOrder').value) || 0
    };
    
    try {
        const url = eduId ? `/api/education/${eduId}` : '/api/education';
        const method = eduId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eduData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(eduId ? 'Education updated successfully' : 'Education created successfully', 'success');
            closeEducationForm();
            loadEducation();
        }
    } catch (error) {
        showAlert('Error saving education', 'error');
    }
});

// ============================================
// CERTIFICATIONS MANAGEMENT
// ============================================
let certifications = [];

async function loadCertifications() {
    try {
        const response = await fetch('/api/certifications');
        certifications = await response.json();
        renderCertifications();
    } catch (error) {
        showAlert('Error loading certifications', 'error');
    }
}

function renderCertifications() {
    const container = document.getElementById('certificationsList');
    if (!container) return;

    if (certifications.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); padding: 2rem; text-align: center;">No certifications yet. Click "Add Certification" to get started.</p>';
        return;
    }

    container.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
        ${certifications.map(cert => `
            <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <h3 style="margin: 0; color: var(--primary-color);">${cert.name}</h3>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm btn-secondary" onclick="editCertification(${cert.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCertification(${cert.id})">Delete</button>
                    </div>
                </div>
                ${cert.info ? `<p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${cert.info}</p>` : ''}
            </div>
        `).join('')}
    </div>`;
}

function showCertificationForm(id = null) {
    const modal = document.getElementById('certificationModal');
    const form = document.getElementById('certificationForm');
    const title = document.getElementById('certificationModalTitle');
    
    if (id) {
        const cert = certifications.find(c => c.id === id);
        if (cert) {
            title.textContent = 'Edit Certification';
            document.getElementById('certificationId').value = cert.id;
            document.getElementById('certName').value = cert.name;
            document.getElementById('certIcon').value = cert.icon || '';
            document.getElementById('certInfo').value = cert.info || '';
            document.getElementById('certOrder').value = cert.display_order || 0;
        }
    } else {
        title.textContent = 'Add Certification';
        form.reset();
        document.getElementById('certificationId').value = '';
        document.getElementById('certOrder').value = 0;
    }
    
    modal.style.display = 'flex';
}

function closeCertificationForm() {
    document.getElementById('certificationModal').style.display = 'none';
    document.getElementById('certificationForm').reset();
}

function editCertification(id) {
    showCertificationForm(id);
}

async function deleteCertification(id) {
    if (!confirm('Are you sure you want to delete this certification?')) return;
    
    try {
        const response = await fetch(`/api/certifications/${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            showAlert('Certification deleted successfully', 'success');
            loadCertifications();
        }
    } catch (error) {
        showAlert('Error deleting certification', 'error');
    }
}

document.getElementById('certificationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const certId = document.getElementById('certificationId').value;
    const certData = {
        name: document.getElementById('certName').value,
        icon: document.getElementById('certIcon').value,
        info: document.getElementById('certInfo').value,
        display_order: parseInt(document.getElementById('certOrder').value) || 0
    };
    
    try {
        const url = certId ? `/api/certifications/${certId}` : '/api/certifications';
        const method = certId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(certData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(certId ? 'Certification updated successfully' : 'Certification created successfully', 'success');
            closeCertificationForm();
            loadCertifications();
        }
    } catch (error) {
        showAlert('Error saving certification', 'error');
    }
});

// ============================================
// CONTACT SUBMISSIONS MANAGEMENT
// ============================================
let contactSubmissions = [];

async function loadContactSubmissions() {
    try {
        const response = await fetch('/api/contact-submissions');
        contactSubmissions = await response.json();
        renderContactSubmissions();
    } catch (error) {
        showAlert('Error loading contact submissions', 'error');
    }
}

function renderContactSubmissions() {
    const container = document.getElementById('contactSubmissionsList');
    if (!container) return;

    if (contactSubmissions.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); padding: 2rem; text-align: center;">No contact form submissions yet.</p>';
        return;
    }

    const unreadCount = contactSubmissions.filter(s => s.read_status === 0).length;

    container.innerHTML = `
        ${unreadCount > 0 ? `<div style="padding: 1rem; background: var(--primary-color); color: white; border-radius: 8px; margin-bottom: 1.5rem;">
            <strong>${unreadCount} unread message${unreadCount > 1 ? 's' : ''}</strong>
        </div>` : ''}
        <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${contactSubmissions.map(submission => `
                <div style="padding: 1.5rem; background: ${submission.read_status === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)'}; border-radius: 8px; border: 1px solid var(--border-color); ${submission.read_status === 0 ? 'border-left: 4px solid var(--primary-color);' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                                <h3 style="margin: 0; color: var(--primary-color);">${submission.name}</h3>
                                ${submission.read_status === 0 ? '<span style="padding: 0.25rem 0.75rem; background: var(--primary-color); color: white; border-radius: 4px; font-size: 0.85rem;">New</span>' : ''}
                            </div>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                                <a href="mailto:${submission.email}" style="color: var(--primary-color); text-decoration: none;">${submission.email}</a>
                            </p>
                            <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.85rem;">
                                ${new Date(submission.created_at).toLocaleString()}
                            </p>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            ${submission.read_status === 0 ? `<button class="btn btn-sm btn-secondary" onclick="markAsRead(${submission.id})">Mark as Read</button>` : ''}
                            <button class="btn btn-sm btn-danger" onclick="deleteContactSubmission(${submission.id})">Delete</button>
                        </div>
                    </div>
                    <div style="padding: 1rem; background: ${submission.read_status === 0 ? 'rgba(0, 57, 102, 0.1)' : 'transparent'}; border-radius: 4px; margin-top: 1rem;">
                        <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${submission.message}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function markAsRead(id) {
    try {
        const response = await fetch(`/api/contact-submissions/${id}/read`, { method: 'PUT' });
        const data = await response.json();
        
        if (data.success) {
            showAlert('Message marked as read', 'success');
            loadContactSubmissions();
        }
    } catch (error) {
        showAlert('Error updating message', 'error');
    }
}

async function deleteContactSubmission(id) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
        const response = await fetch(`/api/contact-submissions/${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            showAlert('Message deleted successfully', 'success');
            loadContactSubmissions();
        }
    } catch (error) {
        showAlert('Error deleting message', 'error');
    }
}

