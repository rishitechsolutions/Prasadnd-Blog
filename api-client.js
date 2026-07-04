// API Client for fetching dynamic content from admin dashboard
// This file loads content from the admin API and updates the website dynamically

(async function() {
    'use strict';

    // Get API base URL from config
    const API_BASE_URL = window.API_BASE_URL || 'https://portfolio-website-ynx2.onrender.com';

    // Cache for API responses
    let settingsCache = null;
    let socialLinksCache = null;
    let articlesCache = null;

    /**
     * Fetch data from API with error handling
     */
    async function fetchAPI(endpoint) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn(`Failed to fetch ${endpoint}:`, error);
            return null;
        }
    }

    /**
     * Update logo in navigation
     */
    function updateLogo(logoUrl) {
        if (!logoUrl) return;
        
        const logoElements = document.querySelectorAll('.nav-logo, img[alt="Logo"]');
        logoElements.forEach(img => {
            // Handle both relative and absolute URLs
            if (logoUrl.startsWith('http') || logoUrl.startsWith('//')) {
                img.src = logoUrl;
            } else if (logoUrl.startsWith('/')) {
                img.src = logoUrl;
            } else {
                img.src = logoUrl.startsWith('assets/') ? logoUrl : `assets/${logoUrl}`;
            }
        });
    }

    /**
     * Update profile picture (does not change the hero scroll-reveal image; that stays as casual.jpg)
     */
    function updateProfilePicture(profileUrl) {
        if (!profileUrl) return;
        // Only update profile images that are NOT inside .hero-profile-reveal (body scroll image stays casual.jpg)
        const profileElements = document.querySelectorAll('.hero-profile-image, img[alt="Profile"]');
        profileElements.forEach(img => {
            if (img.closest('.hero-profile-reveal')) return; // keep static casual.jpg in body
            if (profileUrl.startsWith('http') || profileUrl.startsWith('//')) {
                img.src = profileUrl;
            } else if (profileUrl.startsWith('/')) {
                img.src = profileUrl;
            } else {
                img.src = profileUrl.startsWith('assets/') ? profileUrl : `assets/${profileUrl}`;
            }
        });
    }

    /**
     * Update social links in sidebar (only replace if API has valid links; otherwise keep static HTML icons)
     */
    function updateSocialLinks(socialLinks) {
        if (!socialLinks || socialLinks.length === 0) return;

        const socialIconsContainer = document.querySelector('.social-icons');
        if (!socialIconsContainer) return;

        // Only use API links if at least one has a valid URL (not empty and not '#')
        const validLinks = socialLinks.filter(link => link.url && link.url.trim() !== '' && link.url !== '#');
        if (validLinks.length === 0) return; // keep default static icons

        socialIconsContainer.innerHTML = '';

        validLinks.forEach(link => {
            const iconElement = document.createElement('a');
            iconElement.href = link.url;
            iconElement.className = 'social-icon';
            iconElement.setAttribute('aria-label', link.platform || 'Social');
            iconElement.target = '_blank';
            iconElement.rel = 'noopener noreferrer';

            if (link.icon) {
                iconElement.innerHTML = link.icon;
            } else {
                const svg = getDefaultSocialIcon(link.platform);
                iconElement.innerHTML = svg;
            }

            socialIconsContainer.appendChild(iconElement);
        });
    }

    /**
     * Get default SVG icon for social platform
     */
    function getDefaultSocialIcon(platform) {
        const platformLower = (platform || '').toLowerCase();
        const icons = {
            facebook: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>',
            instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>',
            linkedin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>',
            twitter: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>',
            youtube: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.58 29 29 0 0 0-.46-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg>'
        };
        
        return icons[platformLower] || icons.facebook; // Default to Facebook if unknown
    }

    /**
     * Load and apply settings (logo, profile picture)
     */
    async function loadSettings() {
        if (settingsCache) {
            applySettings(settingsCache);
            return;
        }

        const settings = await fetchAPI('/api/public/settings');
        if (settings) {
            settingsCache = settings;
            applySettings(settings);
        }
    }

    /**
     * Apply settings to the page
     */
    function applySettings(settings) {
        if (settings.logo_url) {
            updateLogo(settings.logo_url);
        }
        if (settings.profile_picture_url) {
            updateProfilePicture(settings.profile_picture_url);
        }
    }

    /**
     * Load and apply social links
     */
    async function loadSocialLinks() {
        if (socialLinksCache) {
            updateSocialLinks(socialLinksCache);
            return;
        }

        const links = await fetchAPI('/api/public/social-links');
        if (links && links.length > 0) {
            socialLinksCache = links;
            updateSocialLinks(links);
        }
    }

    /**
     * Load articles for Beyond Work page
     */
    async function loadArticles() {
        // Only load on beyond-work.html page
        if (!window.location.pathname.includes('beyond-work')) {
            return;
        }

        if (articlesCache) {
            renderArticles(articlesCache);
            return;
        }

        const articles = await fetchAPI('/api/public/articles');
        if (articles) {
            articlesCache = articles;
            renderArticles(articles);
        } else {
            // If API call failed, show empty state
            renderArticles([]);
        }
    }

    /**
     * Render articles dynamically
     */
    function renderArticles(articles) {
        const articlesGrid = document.querySelector('.beyond-articles-grid');
        if (!articlesGrid) return;

        // Clear existing articles
        articlesGrid.innerHTML = '';

        if (!articles || articles.length === 0) {
            // Show a message if no articles
            articlesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 2rem;">No articles available yet. Check that articles are marked as "Published" in the admin dashboard.</p>';
            return;
        }

        articles.forEach((article, index) => {
            const articleElement = createArticleElement(article, index);
            articlesGrid.appendChild(articleElement);
        });
        // Observe new elements for scroll animation
        if (typeof window.initScrollAnimations === 'function') {
            window.initScrollAnimations();
        }
    }

    /**
     * Create article element from data
     */
    function createArticleElement(article, index) {
        const articleItem = document.createElement('article');
        articleItem.className = 'beyond-article-item';

        // Format date - use article.date if available, otherwise use created_at
        let formattedDate;
        if (article.date) {
            // If date is already formatted (e.g., "Dec 16, 2025"), use it directly
            formattedDate = article.date;
        } else if (article.created_at) {
            const date = new Date(article.created_at);
            formattedDate = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } else {
            formattedDate = new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        }

        // Get category (default to article category or "Article")
        const category = article.category || 'Article';

        // Get image URL - check multiple possible field names
        // Handle both relative paths and absolute URLs
        let imageUrl = article.image || article.featured_image || article.image_url || 'assets/education.jpg';
        
        // If it's a relative path starting with /uploads, make sure it's accessible
        if (imageUrl.startsWith('/uploads/')) {
            // Keep as is - it's already an absolute path from server root
        } else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/') && !imageUrl.startsWith('assets/')) {
            // If it doesn't start with http, /, or assets/, assume it's in assets/
            imageUrl = `assets/${imageUrl}`;
        }

        articleItem.innerHTML = `
            <div class="beyond-article-image scroll-animate">
                <img src="${imageUrl}" alt="${article.title || 'Article'}">
                <div class="article-image-overlay">
                    <span class="article-meta">${category} • ${formattedDate}</span>
                </div>
                <div class="article-hover-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 8l4 4-4 4M8 12h8"></path>
                    </svg>
                </div>
            </div>
            <div class="beyond-article-content">
                <h4 class="scroll-animate scroll-animate-delay-1">${article.title || 'Article Title'}</h4>
                <p class="beyond-article-excerpt scroll-animate scroll-animate-delay-2">${article.excerpt || article.content?.substring(0, 150) || 'Brief description or excerpt of the article goes here...'}</p>
            </div>
        `;

        return articleItem;
    }

    /**
     * Initialize - Load all dynamic content
     */
    async function init() {
        // Skip API calls when admin panel is disconnected
        if (window.API_DISABLED) {
            return;
        }

        // Load settings and social links on all pages
        await Promise.all([
            loadSettings(),
            loadSocialLinks()
        ]);

        // Load articles only on beyond-work page
        await loadArticles();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose API for manual refresh if needed
    window.portfolioAPI = {
        refresh: init,
        loadSettings,
        loadSocialLinks,
        loadArticles
    };

})();

