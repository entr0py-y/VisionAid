/**
 * SPA-like Navigation System
 * Intercepts internal links and loads content dynamically
 * without full page reloads
 */

(function() {
  'use strict';

  const SpaRouter = {
    mainContainer: null,
    currentPage: null,
    cache: {},
    
    init() {
      this.mainContainer = document.getElementById('main-content');
      if (!this.mainContainer) {
        console.warn('SpaRouter: #main-content not found');
        return;
      }
      
      // Get current page from URL
      this.currentPage = this.getPageFromPath(window.location.pathname);
      
      // Cache current page content
      this.cache[this.currentPage] = {
        html: this.mainContainer.innerHTML,
        title: document.title
      };
      
      // Intercept navigation
      this.bindNavigation();
      
      // Handle browser back/forward
      window.addEventListener('popstate', (e) => {
        if (e.state && e.state.page) {
          this.loadPage(e.state.page, false);
        }
      });
      
      // Push initial state
      history.replaceState({ page: this.currentPage }, document.title, window.location.href);
      
      // Initialize scripts for the current page (Next buttons, animations, etc.)
      this.reinitializeScripts();
    },
    
    getPageFromPath(path) {
      const fileName = path.split('/').pop() || 'index.html';
      if (fileName === '' || fileName === 'index') return 'index.html';
      return fileName.includes('.') ? fileName : fileName + '.html';
    },
    
    bindNavigation() {
      document.addEventListener('click', (e) => {
        // Find closest anchor tag
        const link = e.target.closest('a');
        
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Skip external links, anchors, and special links
        if (!href || 
            href.startsWith('http') || 
            href.startsWith('#') || 
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            link.hasAttribute('target')) {
          return;
        }
        
        // Check if it's an internal HTML page
        if (href.endsWith('.html') || href === '/' || !href.includes('.')) {
          e.preventDefault();
          
          const pageName = href === '/' ? 'index.html' : 
                          href.endsWith('.html') ? href : href + '.html';
          
          if (pageName !== this.currentPage) {
            this.loadPage(pageName, true);
          }
        }
      });
    },
    
    async loadPage(pageName, pushState = true) {
      // Explicitly get the button wrapper immediately
      const nextBtn = document.querySelector('.next-btn-wrapper');

      // Start button transition immediately
      if (nextBtn) {
          // 1. Lock current state to prevent jumping when animation is removed
          const currentOpacity = window.getComputedStyle(nextBtn).opacity;
          nextBtn.style.opacity = currentOpacity;
          
          // 2. Clear animation and set setup for transition
          nextBtn.style.animation = 'none';
          nextBtn.style.pointerEvents = 'none';
          nextBtn.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
          
          // 3. Force reflow to ensure the browser processes the 'none' animation and start opacity
          void nextBtn.offsetWidth; 
          
          // 4. Trigger the fade out in the next frame
          requestAnimationFrame(() => {
              nextBtn.style.opacity = '0';
              nextBtn.style.transform = 'translateX(-50%) translateY(10px)'; // Slight slide down
          });
      }

      // Show loading state
      document.body.classList.add('page-loading');
      
      try {
        let content;
        
        // Check cache first
        if (this.cache[pageName]) {
          content = this.cache[pageName];
        } else {
          // Fetch page content
          const response = await fetch(pageName);
          
          if (!response.ok) {
            throw new Error(`Failed to load ${pageName}`);
          }
          
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          const mainContent = doc.getElementById('main-content');
          const pageTitle = doc.querySelector('title')?.textContent || 'Smart Vision Aid';
          
          if (!mainContent) {
            throw new Error('Page structure not compatible');
          }
          
          content = {
            html: mainContent.innerHTML,
            title: pageTitle
          };
          
          // Cache for future use
          this.cache[pageName] = content;
        }
        
        // Start transitions for main container
        this.mainContainer.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        this.mainContainer.style.opacity = '0';
        this.mainContainer.style.transform = 'translateY(-20px)';

        // Wait for page transition (600ms)
        await this.sleep(600);
        
        // Remove button from DOM completely
        if (nextBtn && nextBtn.parentNode) {
            nextBtn.parentNode.removeChild(nextBtn);
        }
        
        // Update content
        this.mainContainer.innerHTML = content.html;
        document.title = content.title;
        this.currentPage = pageName;
        
        // Update active nav link
        this.updateActiveNav(pageName);
        
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'instant' });
        
        // Prepare for transition in
        this.mainContainer.style.transition = 'none'; // Disable transition for setup
        this.mainContainer.style.opacity = '0';
        this.mainContainer.style.transform = 'translateY(20px)'; // Start from BELOW
        
        // Force reflow
        void this.mainContainer.offsetWidth;
        
        // Transition in
        this.mainContainer.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        this.mainContainer.style.opacity = '1';
        this.mainContainer.style.transform = 'translateY(0)';
        
        // Push to history
        if (pushState) {
          history.pushState({ page: pageName }, content.title, pageName);
        }
        
        // Re-run any necessary scripts
        this.reinitializeScripts();
        
      } catch (error) {
        console.error('SPA Navigation Error:', error);
        // Fallback to regular navigation
        window.location.href = pageName;
      } finally {
        document.body.classList.remove('page-loading');
      }
    },
    
    updateActiveNav(pageName) {
      // Remove active class from all nav links
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        
        const href = link.getAttribute('href');
        if (href === pageName || 
            (pageName === 'index.html' && (href === '/' || href === 'index.html'))) {
          link.classList.add('active');
        }
      });
    },
    
    reinitializeScripts() {
      // Re-run reveal animations
      const revealTargets = document.querySelectorAll(
        '.section, .problem-card, .feature-card, .hardware-card, .software-item, ' +
        '.limitation-item, .feature-highlight, .layer, .step, .advantage-item, ' +
        '.application-card, .enhancement-item, .impact-area, .impact-statement, ' +
        '.overview-card, .team-card, .page-slide, .reveal-up, .minimal-card, .display-title'
      );
      
      revealTargets.forEach(element => {
        element.classList.add('reveal', 'visible');
        
        // Handle standard reveal-up animations
        if (element.classList.contains('reveal-up')) {
          element.classList.remove('active');
          // Force a reflow to restart animation if needed
          void element.offsetWidth;
          element.classList.add('active');
        }

        // Handle new system safely
        if (element.classList.contains('animate-in')) {
             requestAnimationFrame(() => {
                 element.classList.remove('animate-in');
             });
        }
      });
      
      // Reinitialize Eye Animation for home page
      if (this.currentPage === 'index.html') {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
          const eyeCanvas = document.getElementById('eye-canvas');
          if (eyeCanvas && window.EyeController) {
            // Clear any existing animation frame
            if (window.currentEyeController) {
              if (window.currentEyeController.rafId) {
                cancelAnimationFrame(window.currentEyeController.rafId);
              }
              window.currentEyeController = null;
            }
            // Create new controller
            window.currentEyeController = new window.EyeController();
          }
        }, 100);
      }
      
      // Re-apply tilt effects
      if (window.addTiltEffect) {
        document.querySelectorAll('.overview-card, .problem-card').forEach(window.addTiltEffect);
      }
      
      // Initialize Next Section Indicator immediately
      this.initNextIndicator();
      
      // Dispatch custom event for other scripts to listen to
      document.dispatchEvent(new CustomEvent('spa-page-loaded', { 
        detail: { page: this.currentPage } 
      }));
    },
    
    // Sequence Map: Current -> { label (button text), file (target) }
    nextMap: {
        // 'problem.html': has inline button, skip auto-generation
        'solution.html': { label: 'Discover the Features', file: 'features.html' },
        'features.html': { label: 'See the Impact', file: 'impact.html' },
        'impact.html': { label: 'Meet the Team', file: 'team.html' }
    },
    
    initNextIndicator() {
        // Cleanup existing
        const existing = document.querySelector('.next-btn-wrapper');
        if (existing) existing.remove();
        
        if (this._scrollNavHandler) {
            window.removeEventListener('scroll', this._scrollNavHandler);
            this._scrollNavHandler = null;
        }

        const nextData = this.nextMap[this.currentPage];
        
        // Only show on Problem, Solution, Features, Impact
        if (!nextData) return;
        
        // Check reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Create Button Container
        const wrapper = document.createElement('div');
        wrapper.className = 'next-btn-wrapper';
        
        // Create Link (minimal text with arrow)
        const btn = document.createElement('a');
        btn.href = nextData.file;
        btn.className = 'next-link';
        btn.innerHTML = `${nextData.label} <span class="arrow">→</span>`;
        btn.setAttribute('aria-label', nextData.label);
        
        // Click Handler (SPA intercept will handle, but we add for safety)
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.loadPage(nextData.file, true);
        });
        
        wrapper.appendChild(btn);
        document.body.appendChild(wrapper);
        
        // Cache references for scroll handler
        const docEl = document.documentElement;
        let hasTriggered = false;
        
        // Safety check: only add listener if we're not already at bottom
        // (Removing the short-page restriction that caused buttons to disappear)
        
        this._scrollNavHandler = () => {
            if (hasTriggered) return;
            
            const scrollY = window.scrollY;
            const innerHeight = window.innerHeight;
            const docHeight = docEl.scrollHeight;
            
            // Trigger at 90% of page height, but only if user has actually scrolled
            if (scrollY > 30 && (scrollY + innerHeight) >= docHeight * 0.90) {
                hasTriggered = true;
                
                // Remove listener immediately (one-time trigger)
                window.removeEventListener('scroll', this._scrollNavHandler);
                this._scrollNavHandler = null;
                
                // Fade out button
                wrapper.style.animation = 'none';
                wrapper.style.transition = 'opacity 0.3s ease-out';
                wrapper.style.opacity = '0';
                wrapper.style.pointerEvents = 'none';
                
                // Navigate after short delay
                const delay = prefersReducedMotion ? 0 : 300;
                setTimeout(() => {
                    this.loadPage(nextData.file, true);
                }, delay);
            }
        };
        
        window.addEventListener('scroll', this._scrollNavHandler, { passive: true });
    },

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SpaRouter.init());
  } else {
    SpaRouter.init();
  }
  
  // Expose globally if needed
  window.SpaRouter = SpaRouter;
  
})();
