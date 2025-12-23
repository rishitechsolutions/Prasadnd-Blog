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
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkHref = link.getAttribute('href');
        const linkPage = linkHref.split('/').pop();
        
        // Check if this link matches the current page
        if (linkPage === currentPage || 
            (currentPage === '' && linkPage === 'index.html') ||
            (currentPage === 'index.html' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });
};

// Set active nav link on page load
document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();
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

// Scroll Animation Observer
const initScrollAnimations = () => {
    const animatedElements = document.querySelectorAll('.scroll-animate');
    
    // Detect mobile device
    const isMobile = window.innerWidth <= 768;
    
    // Get the correct root element for scrolling
    // On desktop, content scrolls in .left-content, on mobile it's window
    const leftContent = document.querySelector('.left-content');
    const scrollRoot = (leftContent && !isMobile) ? leftContent : null;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                // Optional: Unobserve after animation to improve performance
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: scrollRoot,
        threshold: isMobile ? 0.05 : 0.1,
        rootMargin: isMobile ? '0px 0px -10% 0px' : '0px 0px -50px 0px'
    });

    animatedElements.forEach(element => {
        observer.observe(element);
    });
};

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

// Also listen to scroll on left-content specifically
const leftContent = document.querySelector('.left-content');
const scrollProgressFill = document.querySelector('.scroll-progress-fill');

if (leftContent) {
    // Update scroll progress
    const updateScrollProgress = () => {
        const scrollTop = leftContent.scrollTop;
        const scrollHeight = leftContent.scrollHeight - leftContent.clientHeight;
        const scrollPercentage = (scrollTop / scrollHeight) * 100;
        
        if (scrollProgressFill) {
            scrollProgressFill.style.height = scrollPercentage + '%';
        }
    };

    leftContent.addEventListener('scroll', () => {
        let current = '';
        const scrollPosition = leftContent.scrollTop;
        
        // Update scroll progress
        updateScrollProgress();
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollPosition >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        // Update page indicator only if not on home page
        if (pageIndicator && current && !isHomePage) {
            const pageName = pageNames[current] || 'HOME';
            pageIndicator.textContent = pageName;
        }
    });

    // Initialize scroll progress on load
    updateScrollProgress();
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

// Contact Form Handler
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');
        
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        
        try {
            // Get API base URL from config
            const API_BASE_URL = window.API_BASE_URL || 'https://portfolio-website-ynx2.onrender.com';
            
            const response = await fetch(`${API_BASE_URL}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Show success message
                alert('Thank you for your message! We will get back to you soon.');
                contactForm.reset();
            } else {
                alert('There was an error sending your message. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('There was an error sending your message. Please try again.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}


