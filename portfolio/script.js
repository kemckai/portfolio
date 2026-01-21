// Language Management
class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('portfolioLang') || 'en';
        this.init();
    }

    init() {
        // Set initial language
        this.setLanguage(this.currentLang);
        
        // Setup language toggle button
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                this.toggleLanguage();
            });
        }
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('portfolioLang', lang);
        
        // Update all elements with data-lang attribute
        const allElements = document.querySelectorAll('[data-lang]');
        allElements.forEach(element => {
            const elementLang = element.getAttribute('data-lang');
            if (elementLang === lang) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        });

        // Update HTML lang attribute
        document.documentElement.setAttribute('lang', lang);

        // Update language toggle button text
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            const spans = langToggle.querySelectorAll('span');
            spans.forEach(span => {
                const spanLang = span.getAttribute('data-lang');
                if (spanLang === lang) {
                    span.classList.remove('hidden');
                } else {
                    span.classList.add('hidden');
                }
            });
        }
    }

    toggleLanguage() {
        const newLang = this.currentLang === 'en' ? 'de' : 'en';
        this.setLanguage(newLang);
    }

    getCurrentLanguage() {
        return this.currentLang;
    }
}

// Smooth Scrolling
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        // Handle all anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Close mobile menu if open
                    const navMenu = document.getElementById('navMenu');
                    if (navMenu && navMenu.classList.contains('active')) {
                        navMenu.classList.remove('active');
                        const toggle = document.getElementById('mobileMenuToggle');
                        if (toggle) toggle.classList.remove('active');
                    }
                }
            });
        });
    }
}

// Mobile Menu
class MobileMenu {
    constructor() {
        this.init();
    }

    init() {
        const toggle = document.getElementById('mobileMenuToggle');
        const menu = document.getElementById('navMenu');

        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                menu.classList.toggle('active');
                toggle.classList.toggle('active');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!toggle.contains(e.target) && !menu.contains(e.target)) {
                    menu.classList.remove('active');
                    toggle.classList.remove('active');
                }
            });

            // Close menu on window resize (if switching to desktop)
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    menu.classList.remove('active');
                    toggle.classList.remove('active');
                }
            });
        }
    }
}

// Audio Player Enhancements
class AudioPlayerManager {
    constructor() {
        this.init();
    }

    init() {
        // Add custom styling and controls to audio players if needed
        const audioPlayers = document.querySelectorAll('audio');
        audioPlayers.forEach(audio => {
            // Ensure audio players are accessible
            audio.setAttribute('preload', 'metadata');
            
            // Add error handling
            audio.addEventListener('error', (e) => {
                console.warn('Audio file could not be loaded:', audio.src);
            });
        });
    }
}

// Scroll Animation (optional enhancement)
class ScrollAnimation {
    constructor() {
        this.init();
    }

    init() {
        // Simple fade-in on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(section);
        });
    }
}

// Image Lightbox Modal
class ImageLightbox {
    constructor() {
        this.init();
    }

    init() {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        const portraitImg = document.getElementById('portraitImage');
        const closeBtn = document.querySelector('.modal-close');

        if (portraitImg && modal && modalImg) {
            portraitImg.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Try to use full-size version if available, otherwise use current
                const fullSizeSrc = portraitImg.src.replace('portrait.png', 'portrait-full.png');
                modalImg.src = fullSizeSrc;
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden'; // Prevent background scrolling
                
                // Fallback if full-size doesn't exist
                modalImg.onerror = function() {
                    this.src = portraitImg.src;
                };
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = ''; // Restore scrolling
                }
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target === modalImg) {
                    modal.style.display = 'none';
                    document.body.style.overflow = ''; // Restore scrolling
                }
            });

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.style.display === 'block') {
                    modal.style.display = 'none';
                    document.body.style.overflow = ''; // Restore scrolling
                }
            });
        }
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize language manager
    const languageManager = new LanguageManager();

    // Initialize smooth scrolling
    const smoothScroll = new SmoothScroll();

    // Initialize mobile menu
    const mobileMenu = new MobileMenu();

    // Initialize audio player manager
    const audioPlayerManager = new AudioPlayerManager();

    // Initialize image lightbox
    const imageLightbox = new ImageLightbox();

    // Initialize scroll animations (optional - can be disabled if not desired)
    // const scrollAnimation = new ScrollAnimation();

    // Expose language manager globally for potential external use
    window.languageManager = languageManager;
});

// Handle page load with hash (scroll to section after language is set)
window.addEventListener('load', () => {
    if (window.location.hash) {
        setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }
});
