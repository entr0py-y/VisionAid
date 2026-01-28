// ========================
// LIQUID GLASS PREMIUM INTERACTIONS
// Ultra-minimal Monochrome Design System
// ========================

document.addEventListener("DOMContentLoaded", () => {
  // ========================
  // INTERACTIVE EYE BACKGROUND
  // ========================
  // ========================
  // INTERACTIVE EYE BACKGROUND
  // ========================
  if (typeof EyeController !== 'undefined' && document.getElementById('eye-canvas')) {
      // Stagger initialization to reduce load lag
      setTimeout(() => {
          if (!window.currentEyeController) {
              window.currentEyeController = new EyeController();
          }
      }, 300);
  }

  // ========================
  // CURSOR LIGHT EFFECT
  // ========================
  // ========================
  // CURSOR LIGHT EFFECT
  // ========================
  const createCursorLight = () => {
    // Disable cursor light if Eye Animation is present to avoid clutter
    if (document.getElementById('eye-canvas')) return;

    const light = document.createElement("div");
    light.className = "cursor-light";
    document.body.appendChild(light);

    let mouseX = 0,
      mouseY = 0;
    let lightX = 0,
      lightY = 0;
    const ease = 0.08;

    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    const animateCursor = () => {
      lightX += (mouseX - lightX) * ease;
      lightY += (mouseY - lightY) * ease;
      light.style.left = `${lightX}px`;
      light.style.top = `${lightY}px`;
      requestAnimationFrame(animateCursor);
    };

    animateCursor();
  };

  // Only enable cursor light on non-touch devices
  if (window.matchMedia("(pointer: fine)").matches) {
    // Stagger cursor light to reduce initial load jank
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => createCursorLight());
    } else {
      setTimeout(createCursorLight, 800);
    }
  }

  // ========================
  // THEME MANAGEMENT SYSTEM
  // ========================
  const ThemeManager = {
    STORAGE_KEY: 'theme-preference',
    LIGHT_MODE_CLASS: 'light-mode',
    
    init() {
      // Load saved theme or detect system preference
      const savedTheme = localStorage.getItem(this.STORAGE_KEY);
      
      if (savedTheme) {
        this.setTheme(savedTheme, false);
      } else {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(prefersDark ? 'dark' : 'light', false);
      }
      
      // Listen for system preference changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          this.setTheme(e.matches ? 'dark' : 'light', false);
        }
      });

      // Global Theme Toggle Listener (Independent of Settings Panel)
      document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.theme-switch');
        if (toggleBtn) {
          this.toggle();
        }
      });
    },
    
    setTheme(theme, save = true) {
      const root = document.documentElement;
      
      if (theme === 'light') {
        root.classList.add(this.LIGHT_MODE_CLASS);
      } else {
        root.classList.remove(this.LIGHT_MODE_CLASS);
      }
      
      if (save) {
        localStorage.setItem(this.STORAGE_KEY, theme);
      }
      
      // Update ALL switch states in the DOM (including floating and settings switches)
      const themeSwitches = document.querySelectorAll('.theme-switch');
      themeSwitches.forEach(themeSwitch => {
        themeSwitch.classList.toggle('is-light', theme === 'light');
        themeSwitch.setAttribute('aria-pressed', theme === 'light');
      });
      
      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    },
    
    toggle() {
      const isLight = document.documentElement.classList.contains(this.LIGHT_MODE_CLASS);
      this.setTheme(isLight ? 'dark' : 'light');
    },
    
    getCurrentTheme() {
      return document.documentElement.classList.contains(this.LIGHT_MODE_CLASS) ? 'light' : 'dark';
    },
    
    reset() {
      localStorage.removeItem(this.STORAGE_KEY);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light', false);
    }
  };
  
  // Initialize theme immediately
  ThemeManager.init();

  // Fix: Re-sync theme toggle state on SPA page load
  document.addEventListener('spa-page-loaded', () => {
    // Small delay to ensure all new DOM elements are fully rendered
    setTimeout(() => {
      const currentTheme = ThemeManager.getCurrentTheme();
      ThemeManager.setTheme(currentTheme, false);
    }, 50);
  });

  // ========================
  // SETTINGS PANEL SYSTEM
  // ========================
  const SettingsPanel = {
    panel: null,
    overlay: null,
    toggleBtn: null,
    closeBtn: null,
    lastFocusedElement: null,
    
    init() {
      // Create and inject settings panel HTML
      this.createSettingsPanel();
      
      // Get elements
      this.panel = document.getElementById('settings-panel');
      this.overlay = document.getElementById('settings-overlay');
      this.toggleBtn = document.getElementById('settings-toggle');
      this.closeBtn = document.getElementById('settings-close');
      
      if (!this.panel || !this.toggleBtn) return;
      
      // Bind events
      this.toggleBtn.addEventListener('click', () => this.toggle());
      this.closeBtn?.addEventListener('click', () => this.close());
      this.overlay?.addEventListener('click', () => this.close());
      
      // Keyboard events
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });
      
      // Setup controls
      this.setupThemeToggle();
      this.setupAccessibilityControls();
      this.setupResetButton();
      this.setupLiquidGlassTracking();
    },
    
    setupLiquidGlassTracking() {
      if (!this.panel) return;
      
      this.panel.addEventListener('mousemove', (e) => {
        const rect = this.panel.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        this.panel.style.setProperty('--liquid-x', `${x}%`);
        this.panel.style.setProperty('--liquid-y', `${y}%`);
      });
    },
    
    createSettingsPanel() {
      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'settings-overlay';
      overlay.className = 'settings-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.appendChild(overlay);
      
      // Create panel
      const panel = document.createElement('aside');
      panel.id = 'settings-panel';
      panel.className = 'settings-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-labelledby', 'settings-title');
      panel.setAttribute('aria-hidden', 'true');
      
      panel.innerHTML = `
        <div class="settings-panel__header">
          <h2 id="settings-title" class="settings-panel__title">Settings</h2>
          <button type="button" id="settings-close" class="settings-panel__close" aria-label="Close settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="settings-panel__content">
          <div class="settings-group">
            <span class="settings-group__label">Appearance</span>
            <div class="theme-toggle-container">
              <div class="theme-toggle-info">
                <span class="theme-toggle-title">Theme</span>
                <span class="theme-toggle-desc">Switch between light and dark mode</span>
              </div>
              <button type="button" class="theme-switch ${ThemeManager.getCurrentTheme() === 'light' ? 'is-light' : ''}" id="theme-switch-btn" aria-label="Toggle theme">
                <span class="theme-switch-icons">
                  <svg class="icon-moon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                  <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                </span>
              </button>
            </div>
          </div>
          
          <div class="settings-group">
            <span class="settings-group__label">Accessibility</span>
            
            <!-- Language -->
            <div class="panel-control">
                <label for="language-select" class="panel-sublabel">Language</label>
                <select id="language-select" class="control-select" aria-label="Select language">
                    <option value="en" data-en="English">English</option>
                    <option value="hi" data-en="Hindi">Hindi</option>
                </select>
            </div>

            <!-- Font Size -->
            <div class="panel-control">
                <span class="panel-sublabel">Font Size</span>
                <div class="panel-actions">
                    <button type="button" id="font-decrease" class="control-btn" aria-label="Decrease font size">A-</button>
                    <button type="button" id="font-increase" class="control-btn" aria-label="Increase font size">A+</button>
                </div>
            </div>

            <!-- Toggles -->
            <button type="button" class="settings-toggle-btn" id="contrast-toggle" aria-pressed="false">
              <span>High Contrast</span>
              <span class="toggle-indicator"></span>
            </button>
            
            <button type="button" class="settings-toggle-btn" id="settings-reduce-motion" aria-pressed="false">
              <span>Reduce Motion</span>
              <span class="toggle-indicator"></span>
            </button>
            
            <button type="button" class="settings-toggle-btn" id="voice-toggle" aria-pressed="false">
              <span>Voice Assistance</span>
              <span class="toggle-indicator"></span>
            </button> <!-- Added Voice Assistance Toggle -->
          </div>

          <div class="settings-group" id="voice-settings-group" style="display: none;">
             <span class="settings-group__label">Voice Settings</span>
             <label for="voice-volume" class="sr-only">Volume</label>
             <input type="range" id="voice-volume" class="voice-slider" min="0.1" max="1" step="0.1" value="0.8" aria-label="Voice volume" />
          </div>
          
          <button type="button" class="settings-reset-btn" id="settings-reset">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            Reset All Preferences
          </button>
        </div>
      `;
      
      document.body.appendChild(panel);
    },
    
    setupThemeToggle() {
      // Create a global handler (kept for compatibility if needed elsewhere)
      window._themeToggleHandler = function() {
        ThemeManager.toggle();
      };
    },
    
    setupAccessibilityControls() {
        // --- Font Size ---
        const fontIncreaseBtn = document.getElementById("font-increase");
        const fontDecreaseBtn = document.getElementById("font-decrease");
        const FONT_STEP = 1;
        const FONT_MIN = 14;
        const FONT_MAX = 20;

        const getRootFontSize = () => parseFloat(getComputedStyle(document.documentElement).fontSize);
        const applyFontSize = (size) => {
            const clamped = Math.max(FONT_MIN, Math.min(FONT_MAX, size));
            document.documentElement.style.fontSize = `${clamped}px`;
            localStorage.setItem("fontSize", String(clamped));
        };

        if (fontIncreaseBtn && fontDecreaseBtn) {
            fontIncreaseBtn.addEventListener("click", () => applyFontSize(getRootFontSize() + FONT_STEP));
            fontDecreaseBtn.addEventListener("click", () => applyFontSize(getRootFontSize() - FONT_STEP));
        }

        const savedFontSize = localStorage.getItem("fontSize");
        if (savedFontSize) applyFontSize(parseFloat(savedFontSize));

        // --- High Contrast ---
        const contrastToggleBtn = document.getElementById("contrast-toggle");
        if (contrastToggleBtn) {
            // Apply saved state
            const savedHighContrast = sessionStorage.getItem("highContrast") === "true";
            document.body.classList.toggle("high-contrast", savedHighContrast);
            contrastToggleBtn.setAttribute("aria-pressed", String(savedHighContrast));

            contrastToggleBtn.addEventListener("click", () => {
                const isEnabled = document.body.classList.toggle("high-contrast");
                contrastToggleBtn.setAttribute("aria-pressed", String(isEnabled));
                sessionStorage.setItem("highContrast", String(isEnabled));
            });
        }

        // --- Reduce Motion ---
        const reduceMotionBtn = document.getElementById('settings-reduce-motion');
        if (reduceMotionBtn) {
            const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const savedReduceMotion = localStorage.getItem('reduceMotion');
            const isReduced = savedReduceMotion !== null ? savedReduceMotion === 'true' : prefersReduced;
            
            document.body.classList.toggle('reduce-motion', isReduced);
            reduceMotionBtn.setAttribute('aria-pressed', String(isReduced));
            
            reduceMotionBtn.addEventListener('click', () => {
                const isCurrentlyReduced = document.body.classList.contains('reduce-motion');
                document.body.classList.toggle('reduce-motion', !isCurrentlyReduced);
                reduceMotionBtn.setAttribute('aria-pressed', String(!isCurrentlyReduced));
                localStorage.setItem('reduceMotion', String(!isCurrentlyReduced));
            });
        }

         // --- Voice Assistance ---
        const voiceToggleBtn = document.getElementById("voice-toggle");
        const voiceSettingsGroup = document.getElementById("voice-settings-group");
        
        // Use the global vars from script.js scope if possible, or re-implement here.
        // Assuming global 'voiceEnabled' var exists outside (it does in original script)
        // We'll just toggle the global var for now or sets session storage.
        
        // Sync initial state
        const savedVoice = sessionStorage.getItem('voiceEnabled') === 'true';
        if (savedVoice) {
             // We need to trigger the global voice enable logic if it exists, or just set the flag
             // Since the original script had `voiceEnabled` variable, we should try to update it.
             // However, `voiceEnabled` is let-defined in the global scope below.
             // We can't access it easily if it's not exposed. 
             // Best to rely on sessionStorage and let the voice logic check it?
             // Or we simply update the UI here and let the user click to toggle.
        }
        
        if (voiceToggleBtn) {
             voiceToggleBtn.setAttribute("aria-pressed", String(savedVoice));
             if (voiceSettingsGroup) voiceSettingsGroup.style.display = savedVoice ? 'flex' : 'none';

             voiceToggleBtn.addEventListener("click", () => {
                 const isPressed = voiceToggleBtn.getAttribute("aria-pressed") === "true";
                 const newState = !isPressed;
                 
                 voiceToggleBtn.setAttribute("aria-pressed", String(newState));
                 sessionStorage.setItem('voiceEnabled', String(newState));
                 
                 if (voiceSettingsGroup) voiceSettingsGroup.style.display = newState ? 'flex' : 'none';
                 
                 // Update global voice flag if accessible (we might need to move that flag to an object or accessible scope)
                 // For now, let's dispatch an event that the voice system listens to
                 document.dispatchEvent(new CustomEvent('voice-toggle', { detail: { enabled: newState } }));
             });
        }
    },
    
    setupResetButton() {
      const resetBtn = document.getElementById('settings-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          // Reset theme
          ThemeManager.reset();
          
          // Reset reduce motion
          document.body.classList.remove('reduce-motion');
          localStorage.removeItem('reduceMotion');
          const reduceMotionBtn = document.getElementById('settings-reduce-motion');
          if (reduceMotionBtn) {
            reduceMotionBtn.setAttribute('aria-pressed', 'false');
          }
          
          // Reset font size
          document.documentElement.style.fontSize = '';
          localStorage.removeItem('fontSize');
          
          // Reset contrast
          document.body.classList.remove('high-contrast');
          sessionStorage.removeItem('highContrast');
          const contrastBtn = document.getElementById('contrast-toggle');
          if (contrastBtn) contrastBtn.setAttribute('aria-pressed', 'false');
          
          // Reset voice
          sessionStorage.removeItem('voiceEnabled');
          const voiceBtn = document.getElementById('voice-toggle');
          if (voiceBtn) voiceBtn.setAttribute('aria-pressed', 'false');
           document.dispatchEvent(new CustomEvent('voice-toggle', { detail: { enabled: false } }));
        });
      }
    },
    
    open() {
      if (!this.panel || !this.overlay) return;
      
      this.lastFocusedElement = document.activeElement;
      this.panel.classList.add('is-open');
      this.overlay.classList.add('is-visible');
      this.panel.setAttribute('aria-hidden', 'false');
      this.overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('panel-open');
      this.toggleBtn?.setAttribute('aria-expanded', 'true');
      
      // Focus first focusable element
      const firstFocusable = this.panel.querySelector('button, [href], input, select');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    },
    
    close() {
      if (!this.panel || !this.overlay) return;
      
      this.panel.classList.remove('is-open');
      this.overlay.classList.remove('is-visible');
      this.panel.setAttribute('aria-hidden', 'true');
      this.overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('panel-open');
      this.toggleBtn?.setAttribute('aria-expanded', 'false');
      
      // Return focus
      if (this.lastFocusedElement?.focus) {
        this.lastFocusedElement.focus();
      }
    },
    
    toggle() {
      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    },
    
    isOpen() {
      return this.panel?.classList.contains('is-open') ?? false;
    }
  };
  
  // Initialize settings panel
  SettingsPanel.init();

  // ========================
  // PAGE TRANSITION
  // ========================
  document.body.classList.add("page-transition");
  
  // ========================
  // VOICE SYSTEM (Updated)
  // ========================
  // Event listener for voice toggle from settings
  document.addEventListener('voice-toggle', (e) => {
       // Update internal voice state if we can access it, or just reload logic
       // Since the voice logic is below, we need to ensure it checks sessionStorage
       // or we expose a global object.
       // Let's rely on the fact that 'voiceEnabled' is defined below.
       // We can't access 'voiceEnabled' variable if it's defined in a closure or not yet defined.
       // But wait, the original code had 'let voiceEnabled = false;' at global scope (line 416).
       // We can just update that variable if this code runs in the same scope.
       // Yes, same file.
       if (typeof updateVoiceState === 'function') {
           updateVoiceState(e.detail.enabled);
       }
  });

  // ========================
  // ANIMATE COUNTING NUMBERS
  // ========================
  const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const startTime = performance.now();
    const suffix = element.textContent.replace(/[\d.,]/g, "");

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeProgress * target);

      element.textContent = current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target.toLocaleString() + suffix;
      }
    };

    requestAnimationFrame(updateCounter);
  };

  // Observe stat numbers for counting animation
  const statObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const text = element.textContent;
          const numMatch = text.match(/[\d]+/);

          if (numMatch) {
            const target = parseInt(numMatch[0]);
            animateCounter(element, target, 2000);
          }

          statObserver.unobserve(element);
        }
      });
    },
    { threshold: 0.5 },
  );

  document.querySelectorAll(".stat-number").forEach((stat) => {
    statObserver.observe(stat);
  });

  // ========================
  // VOICE SYSTEM CORE
  // ========================
  let voiceEnabled = sessionStorage.getItem('voiceEnabled') === 'true'; // Sync on load
  let currentLanguage = "en";
  let lastSpokenText = "";
  const speechSupported = !!(
    window.speechSynthesis && window.SpeechSynthesisUtterance
  );

  // Update voice state helper
  const updateVoiceState = (enabled) => {
      voiceEnabled = enabled;
      if (!enabled) {
          stopSpeech();
      } else {
          speak("Voice assistance enabled");
      }
  };

  const speak = (text) => {
    if (!voiceEnabled || !speechSupported || !text) return;
    if (text === lastSpokenText) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLanguage === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    const volSlider = document.getElementById('voice-volume');
    utterance.volume = volSlider ? parseFloat(volSlider.value) : 0.8;

    window.speechSynthesis.speak(utterance);
    lastSpokenText = text;
  };

  const stopSpeech = () => {
    if (speechSupported) {
      window.speechSynthesis.cancel();
      lastSpokenText = "";
    }
  };

  // ========================
  // SMOOTH SCROLL WITH EASING
  // ========================
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        const navHeight = document.querySelector(".navbar")?.offsetHeight || 0;
        const targetPosition = target.offsetTop - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      }
    });
  });

  // OLD ACCESSIBILITY CONTROLS REMOVED (Merged into SettingsPanel)




  // ========================
  // NAVBAR SCROLL BEHAVIOR
  // ========================
  const navbar = document.querySelector(".navbar");
  let lastScroll = window.pageYOffset;
  let scrollTicking = false;

  const handleScroll = () => {
    const currentScroll = window.pageYOffset;

    if (navbar) {
      // Add scrolled class for enhanced blur
      if (currentScroll > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }

    lastScroll = currentScroll;
    scrollTicking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTicking) {
        requestAnimationFrame(handleScroll);
        scrollTicking = true;
      }
    },
    { passive: true },
  );

  // ========================
  // REVEAL ANIMATIONS - Disabled for instant loading
  // ========================
  // Elements are shown immediately without staggered animations
  const revealTargets = document.querySelectorAll(
    ".section, .problem-card, .feature-card, .hardware-card, .software-item, " +
      ".limitation-item, .feature-highlight, .layer, .step, .advantage-item, " +
      ".application-card, .enhancement-item, .impact-area, .impact-statement, " +
      ".overview-card, .team-card",
  );

  // Immediately show all elements without animation delays
  revealTargets.forEach((element) => {
    element.classList.add("reveal", "visible");
  });

  // ========================
  // 3D TILT EFFECT ON CARDS
  // ========================
  const addTiltEffect = (card) => {
    if (prefersReducedMotion) return;

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  };

  document
    .querySelectorAll(".overview-card, .problem-card")
    .forEach(addTiltEffect);

  // ========================
  // BUTTON RIPPLE EFFECT
  // ========================
  const createRipple = (event) => {
    const button = event.currentTarget;
    const ripple = document.createElement("span");
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    `;

    button.style.position = "relative";
    button.style.overflow = "hidden";
    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  };

  // Add ripple style
  const rippleStyle = document.createElement("style");
  rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
  document.head.appendChild(rippleStyle);

  document.querySelectorAll(".cta-button").forEach((button) => {
    button.addEventListener("click", createRipple);
  });

  // ========================
  // LAZY LOADING
  // ========================
  document.querySelectorAll("img").forEach((img) => {
    img.setAttribute("loading", "lazy");
  });

  // ========================
  // LANGUAGE TRANSLATION
  // ========================
  const hiTextMap = {
    "Smart Vision Aid": "स्मार्ट विज़न सहायता",
    Home: "होम",
    Problem: "समस्या",
    Solution: "समाधान",
    Features: "विशेषताएं",
    Impact: "प्रभाव",
    Team: "टीम",
    "Voice Off": "वॉइस बंद",
    "Voice On": "वॉइस चालू",
  };

  const translatableElements = document.querySelectorAll(
    "h1, h2, h3, p, a.nav-link, .nav-logo, .cta-button, .control-btn, option, label, .panel-label, .panel-title",
  );

  const updateVoiceToggleLabel = () => {
    if (!voiceToggleBtn) return;

    if (voiceEnabled) {
      voiceToggleBtn.textContent =
        currentLanguage === "hi" ? "वॉइस चालू" : "Voice On";
      voiceToggleBtn.classList.add("voice-active");
      voiceToggleBtn.setAttribute("aria-pressed", "true");
    } else {
      voiceToggleBtn.textContent =
        currentLanguage === "hi" ? "वॉइस बंद" : "Voice Off";
      voiceToggleBtn.classList.remove("voice-active");
      voiceToggleBtn.setAttribute("aria-pressed", "false");
    }
  };

  const applyLanguage = (lang) => {
    currentLanguage = lang;
    document.documentElement.setAttribute("lang", lang);

    translatableElements.forEach((el) => {
      if (!el.dataset.en) el.dataset.en = el.textContent.trim();

      if (lang === "hi") {
        const hiText = hiTextMap[el.dataset.en];
        if (hiText) el.textContent = hiText;
      } else {
        el.textContent = el.dataset.en;
      }
    });

    updateVoiceToggleLabel();
  };

  const savedLanguage = localStorage.getItem("language") || "en";
  if (languageSelect) {
    languageSelect.value = savedLanguage;
    languageSelect.addEventListener("change", (e) => {
      localStorage.setItem("language", e.target.value);
      applyLanguage(e.target.value);
    });
  }
  applyLanguage(savedLanguage);



  // Hover & focus speech
  const speechSelectors =
    ".hero-title, .section-title, .nav-link, .cta-button, button, .feature-card, h3, p, .problem-card, .hardware-card, .software-item, .advantage-item, .overview-card";

  const getSpeechText = (element) => {
    if (!element) return "";

    if (element.dataset?.speech) return element.dataset.speech.trim();

    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel.trim();

    if (
      element.classList.contains("feature-card") ||
      element.classList.contains("overview-card")
    ) {
      const heading = element.querySelector("h3");
      if (heading) return heading.textContent.trim();
    }

    const text = element.textContent.trim();
    return text.length > 120 ? text.slice(0, 117) + "..." : text;
  };

  const handleSpeakableEvent = (event) => {
    if (!voiceEnabled || !speechSupported) return;

    const target = event.target.closest(speechSelectors);
    if (!target) return;

    const speechText = getSpeechText(target);
    if (!speechText || speechText.length < 2) return;

    speak(speechText);
  };

  document.addEventListener("mouseenter", handleSpeakableEvent, true);
  document.addEventListener("focusin", handleSpeakableEvent, true);

  // ========================
  // KEYBOARD ACCESSIBILITY
  // ========================
  document.querySelectorAll("a, button, select").forEach((element) => {
    element.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.click();
      }
    });
  });

  // ========================
  // CONSOLE BRANDING
  // ========================
  console.log(
    "%cSmart Vision Aid",
    "color: #ffffff; font-size: 20px; font-weight: bold; background: #0B0B0D; padding: 10px 20px;",
  );
  console.log(
    "%cLiquid Glass Design System",
    "color: #707070; font-size: 12px;",
  );
}); // End DOMContentLoaded
