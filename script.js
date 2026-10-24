// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Close menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Set active nav link based on current page
const setActiveNavLink = () => {
    const pathname = window.location.pathname || '';
    let currentPage = pathname.split('/').pop() || '';
    const isInArticles = pathname.includes('/articles/');
    // Handle root path or empty path (home page)
    if (currentPage === '' || currentPage === '/' || currentPage === 'index.html') {
        currentPage = 'index.html';
    }
    
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkHref = link.getAttribute('href');
        const linkPage = linkHref.split('/').pop();
        
        // Article pages count as Beyond Work
        const matchesBeyondWork = linkPage === 'beyond-work.html' && (currentPage === 'beyond-work.html' || isInArticles);
        const matchesCurrent = linkPage === currentPage || 
            ((currentPage === 'index.html' || currentPage === '') && linkPage === 'index.html');
        
        if (matchesCurrent || matchesBeyondWork) {
            link.classList.add('active');
        }
    });
};

// Set active nav link on page load
document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();
});

// Page Loader - hide when page is fully loaded
window.addEventListener('load', () => {
    const pageLoader = document.getElementById('pageLoader');
    if (pageLoader) {
        pageLoader.classList.add('loaded');
    }
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Back to Top Button
const backToTopBtn = document.querySelector('.back-to-top');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Animate Circular Skill Bars on Scroll
const animateSkills = () => {
    const skillCircleItems = document.querySelectorAll('.skill-circle-item');
    if (skillCircleItems.length === 0) return; // Exit if no skill items found
    
    const circumference = 2 * Math.PI * 40; // radius is 40
    
    // Detect mobile device
    const isMobile = window.innerWidth <= 768;
    
    // Get the correct root element for scrolling
    const leftContent = document.querySelector('.left-content');
    const scrollRoot = (leftContent && !isMobile) ? leftContent : null;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skillItem = entry.target;
                const percentage = parseInt(skillItem.getAttribute('data-percentage'));
                const progressCircle = skillItem.querySelector('.progress-ring-circle');
                const percentageText = skillItem.querySelector('.circular-percentage');
                
                // Get Speaking, Writing, Reading percentages
                const speaking = parseInt(skillItem.getAttribute('data-speaking')) || 0;
                const writing = parseInt(skillItem.getAttribute('data-writing')) || 0;
                const reading = parseInt(skillItem.getAttribute('data-reading')) || 0;
                
                // Calculate the stroke-dashoffset (full circle minus percentage)
                const offset = circumference - (percentage / 100) * circumference;
                
                setTimeout(() => {
                    // Animate the circle
                    progressCircle.style.strokeDashoffset = offset;
                    
                    // Animate the percentage text
                    let current = 0;
                    const increment = percentage / 60; // 60 frames for smooth animation
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= percentage) {
                            current = percentage;
                            clearInterval(timer);
                        }
                        percentageText.textContent = Math.round(current) + '%';
                    }, 25);
                    
                    // Animate horizontal progress bars
                    const skillBars = skillItem.querySelectorAll('.skill-bar-fill');
                    
                    skillBars.forEach((bar) => {
                        let targetValue = 0;
                        const skillType = bar.getAttribute('data-skill');
                        
                        if (skillType === 'speaking') {
                            targetValue = speaking;
                        } else if (skillType === 'writing') {
                            targetValue = writing;
                        } else if (skillType === 'reading') {
                            targetValue = reading;
                        }
                        
                        // Find the corresponding percentage element
                        const skillBarItem = bar.closest('.language-skill-bar');
                        const percentageElement = skillBarItem.querySelector('.skill-bar-percentage');
                        
                        // Animate the bar width
                        bar.style.width = targetValue + '%';
                        
                        // Animate the percentage text
                        let currentBar = 0;
                        const incrementBar = targetValue / 50;
                        const timerBar = setInterval(() => {
                            currentBar += incrementBar;
                            if (currentBar >= targetValue) {
                                currentBar = targetValue;
                                clearInterval(timerBar);
                            }
                            if (percentageElement) {
                                percentageElement.textContent = Math.round(currentBar) + '%';
                            }
                        }, 20);
                    });
                }, 200);
                
                observer.unobserve(entry.target);
            }
        });
    }, { 
        root: scrollRoot,
        threshold: isMobile ? 0.1 : 0.5,
        rootMargin: isMobile ? '0px 0px -20% 0px' : '0px 0px -30% 0px'
    });

    skillCircleItems.forEach(item => {
        observer.observe(item);
    });
};

// Scroll Animation Observer - only animate when element scrolls into view (not on page load)
const initScrollAnimations = () => {
    const animatedElements = document.querySelectorAll('.scroll-animate');
    
    const isMobile = window.innerWidth <= 768;
    
    // Always use viewport (null) - page scrolls via window, not left-content
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null, // viewport
        threshold: 0.1, // element must be at least 10% visible
        rootMargin: '0px 0px -25% 0px' // trigger only when element has scrolled into view (top 75% of viewport)
    });

    animatedElements.forEach(element => {
        observer.observe(element);
    });
};

// Expose for dynamic content (e.g. api-client loaded articles)
window.initScrollAnimations = initScrollAnimations;

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    animateSkills();
    initReviewsSlider();
    initScrollAnimations();
});

// Re-initialize animations on window resize (for mobile orientation changes)
let resizeTimer;
let animationInitialized = false;

// Function to initialize all animations
const initializeAllAnimations = () => {
    animateSkills();
    initReviewsSlider();
    initScrollAnimations();
    animationInitialized = true;
};

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeAllAnimations();
});

// Re-initialize on resize (for orientation changes)
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Re-initialize to adjust thresholds for mobile/desktop
        if (animationInitialized) {
            initializeAllAnimations();
        }
    }, 250);
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Active nav link highlighting and page indicator update
const sections = document.querySelectorAll('section[id]');
const pageIndicator = document.querySelector('.page-indicator');

// Check if we're on the home page (index.html)
const isHomePage = pageIndicator && pageIndicator.textContent.trim() === 'WHO I AM';

const pageNames = {
    'home': 'HOME',
    'projects': 'PROJECTS',
    'pages': 'PAGES',
    'blog': 'BLOG',
    'contact': 'CONTACT'
};

window.addEventListener('scroll', () => {
    let current = '';
    const leftContent = document.querySelector('.left-content');
    const scrollPosition = leftContent.scrollTop;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollPosition >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });

    // Update page indicator only if not on home page
    if (pageIndicator && current && !isHomePage) {
        const pageName = pageNames[current] || 'HOME';
        pageIndicator.textContent = pageName;
    }
});

// Scroll progress line between body and image (moves down on scroll down, up on scroll up)
const leftContent = document.querySelector('.left-content');
const scrollProgressFill = document.querySelector('.scroll-progress-fill');

const updateScrollProgress = () => {
    if (!scrollProgressFill) return;
    const leftContent = document.querySelector('.left-content');
    let scrollPercentage = 0;
    // Prefer left-content scroll if it's the scroll container
    if (leftContent) {
        const scrollHeight = leftContent.scrollHeight - leftContent.clientHeight;
        if (scrollHeight > 0) {
            scrollPercentage = (leftContent.scrollTop / scrollHeight) * 100;
        }
    }
    // Otherwise use window/document scroll (e.g. when left-content has overflow: visible)
    if (scrollPercentage === 0) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
            scrollPercentage = (window.scrollY / docHeight) * 100;
        }
    }
    scrollProgressFill.style.height = Math.min(100, Math.max(0, scrollPercentage)) + '%';
};

if (leftContent) {
    leftContent.addEventListener('scroll', () => {
        let current = '';
        const scrollPosition = leftContent.scrollTop;
        updateScrollProgress();
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollPosition >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        if (pageIndicator && current && !isHomePage) {
            const pageName = pageNames[current] || 'HOME';
            pageIndicator.textContent = pageName;
        }
    });
}

// Also update progress on window scroll (for pages where body scrolls)
window.addEventListener('scroll', updateScrollProgress);

// Initialize scroll progress on load and when DOM ready
if (scrollProgressFill) {
    updateScrollProgress();
    document.addEventListener('DOMContentLoaded', updateScrollProgress);
}

// Reviews Slider
const initReviewsSlider = () => {
    const slider = document.querySelector('.reviews-slider');
    const slides = document.querySelectorAll('.review-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.slider-arrow-left');
    const nextBtn = document.querySelector('.slider-arrow-right');
    
    if (!slider || slides.length === 0) return;
    
    let currentSlide = 0;
    
    const showSlide = (index) => {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) {
                slide.classList.add('active');
            }
        });
        
        dots.forEach((dot, i) => {
            dot.classList.remove('active');
            if (i === index) {
                dot.classList.add('active');
            }
        });
        
        currentSlide = index;
    };
    
    const nextSlide = () => {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    };
    
    const prevSlide = () => {
        const prev = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prev);
    };
    
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
        });
    });
    
    // Auto-play slider (optional - can be removed if not needed)
    // setInterval(nextSlide, 5000);
};

// Contact Form Handler - Web3Forms (no backend, emails go to your inbox)
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        
        try {
            const formData = new FormData(contactForm);
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            });
            
            const data = await response.json().catch(() => ({}));
            
            if (response.ok && data.success) {
                alert('Thank you for your message! We will get back to you soon.');
                contactForm.reset();
            } else {
                const errMsg = data.body?.message || data.message || data.error || 'There was an error sending your message. Please try again.';
                alert(errMsg);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('There was an error sending your message. Please try again or email directly at Prasad.nd.2026@gmail.com');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

// Certificate Lightbox - open image inside website with close option
const certLightbox = document.getElementById('certLightbox');
const certImageLinks = document.querySelectorAll('.certification-image-link');

if (certLightbox && certImageLinks.length > 0) {
    const lightboxImage = certLightbox.querySelector('.cert-lightbox-image');
    const lightboxTitle = certLightbox.querySelector('.cert-lightbox-title');
    const lightboxClose = certLightbox.querySelector('.cert-lightbox-close');
    const lightboxBackdrop = certLightbox.querySelector('.cert-lightbox-backdrop');

    const openLightbox = (src, title) => {
        lightboxImage.src = src;
        lightboxImage.alt = title;
        lightboxTitle.textContent = title;
        certLightbox.classList.add('active');
        certLightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        certLightbox.classList.remove('active');
        certLightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    certImageLinks.forEach(btn => {
        btn.addEventListener('click', () => {
            const src = btn.getAttribute('data-cert-src');
            const title = btn.getAttribute('data-cert-title');
            if (src && title) openLightbox(src, title);
        });
    });

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

    certLightbox.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });
}

// Article Image Lightbox - clickable images in articles (like certifications)
const articleLightbox = document.getElementById('articleLightbox');
const articleImages = document.querySelectorAll('.article-featured-image img, .article-gallery-grid img');

if (articleLightbox && articleImages.length > 0) {
    const lightboxImage = articleLightbox.querySelector('.cert-lightbox-image');
    const lightboxTitle = articleLightbox.querySelector('.cert-lightbox-title');
    const lightboxClose = articleLightbox.querySelector('.cert-lightbox-close');
    const lightboxBackdrop = articleLightbox.querySelector('.cert-lightbox-backdrop');

    const openArticleLightbox = (src, title) => {
        lightboxImage.src = src;
        lightboxImage.alt = title;
        lightboxTitle.textContent = title || 'Image';
        articleLightbox.classList.add('active');
        articleLightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const closeArticleLightbox = () => {
        articleLightbox.classList.remove('active');
        articleLightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeArticleLightbox();
            document.removeEventListener('keydown', handleEscape);
        }
    };

    const openWithEscape = (src, title) => {
        openArticleLightbox(src, title);
        document.addEventListener('keydown', handleEscape);
    };

    const closeAndCleanup = () => {
        closeArticleLightbox();
        document.removeEventListener('keydown', handleEscape);
    };

    articleImages.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
            const src = img.src || img.getAttribute('src');
            const title = img.alt || 'Image';
            if (src) openWithEscape(src, title);
        });
    });

    if (lightboxClose) lightboxClose.addEventListener('click', closeAndCleanup);
    if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeAndCleanup);
}

// Beyond Work: Category filter from URL
(function initBeyondCategoryFilter() {
    const path = window.location.pathname || '';
    if (!path.includes('beyond-work')) return;

    const params = new URLSearchParams(window.location.search);
    const category = params.get('category') || '';

    const items = document.querySelectorAll('.beyond-article-item[data-category]');
    const buttons = document.querySelectorAll('.beyond-category-btn');

    buttons.forEach(btn => {
        const btnCategory = btn.getAttribute('data-category') || '';
        btn.classList.toggle('active', btnCategory === category);
    });

    items.forEach(item => {
        const itemCategory = item.getAttribute('data-category') || '';
        const match = !category || itemCategory === category;
        item.classList.toggle('filtered-out', !match);
    });
})();

// Latest Updates: Load the latest published articles from the portfolio API.
(function loadLatestUpdates() {
    const grid = document.getElementById('latestUpdatesGrid');
    if (!grid) return;

    const renderArticles = (articles) => {
        const latest = Array.isArray(articles) ? articles.slice(0, 2) : [];
        if (latest.length === 0) {
            return;
        }

        const cards = latest.map(article => {
            const card = document.createElement('article');
            card.className = 'blog-item';
            const date = article.published_at ? new Date(`${article.published_at.replace(' ', 'T')}Z`) : null;
            const formattedDate = date && !Number.isNaN(date.valueOf())
                ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
                : '';
            const meta = document.createElement('p');
            meta.className = 'blog-meta scroll-animate';
            meta.textContent = `${article.category || 'Latest Update'}${formattedDate ? ` · ${formattedDate}` : ''}`;
            const title = document.createElement('h4');
            title.className = 'scroll-animate scroll-animate-delay-1';
            title.textContent = article.title || 'Untitled Article';
            const excerpt = document.createElement('p');
            excerpt.className = 'blog-excerpt scroll-animate scroll-animate-delay-2';
            excerpt.textContent = article.excerpt || 'Read more about this update.';
            const link = document.createElement('a');
            link.className = 'read-more scroll-animate scroll-animate-delay-3';
            link.href = `/article.php?slug=${encodeURIComponent(article.slug)}`;
            link.textContent = 'Read more';
            card.append(meta, title, excerpt, link);
            return card;
        });
        grid.replaceChildren(...cards);

        if (typeof window.initScrollAnimations === 'function') window.initScrollAnimations();
    };

    fetch('/api/articles.php', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
        .then(r => {
            if (!r.ok) throw new Error('API unavailable');
            return r.json();
        })
        .then(payload => renderArticles(payload.articles))
        .catch(error => console.error('Could not load latest updates:', error));
})();

