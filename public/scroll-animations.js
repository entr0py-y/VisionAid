/**
 * Scroll Animation Controller
 * Centralized performance-optimized scroll animation system
 * Uses IntersectionObserver for efficient scroll-triggered reveals
 */

class ScrollAnimationController {
  constructor() {
    this.observers = new Map();
    this.animatedElements = new Set();
    this.rafId = null;
    this.isPaused = false;
    
    // Enable animations - progressive enhancement
    document.body.classList.add('animations-enabled');
    
    // Track document visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
    
    this.init();
  }
  
  init() {
    // Create main IntersectionObserver for fade reveals
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          } else {
            entry.target.classList.remove('is-visible');
          }
        });
      },
      {
        threshold: 0.2, // Trigger when 20% visible
        rootMargin: '0px 0px -50px 0px'
      }
    );
    
    this.observers.set('reveal', revealObserver);
    
    // Observe all reveal elements
    this.observeRevealElements();
    
    // Initialize continuous animations
    this.initContinuousAnimations();
  }
  
  observeRevealElements() {
    const revealObserver = this.observers.get('reveal');
    
    // Observe all elements with reveal classes
    const revealSelectors = [
      '.reveal-fade-up',
      '.reveal-fade-in',
      '.breakdown-item',
      '.stage',
      '.timeline-node'
    ];
    
    revealSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        revealObserver.observe(el);
      });
    });
  }
  
  initContinuousAnimations() {
    // Start pulse animations
    document.querySelectorAll('.pulse-glow-subtle').forEach(el => {
      this.animatePulse(el);
    });
    
    // Start line animations
    document.querySelectorAll('.animated-line').forEach(el => {
      this.animateLine(el);
    });
    
    // Start waveform animations
    document.querySelectorAll('.waveform').forEach(el => {
      this.animateWaveform(el);
    });
    
    // Start scanning line animations
    document.querySelectorAll('.scanning-line').forEach(el => {
      this.animateScanningLine(el);
    });
  }
  
  animatePulse(element) {
    let startTime = null;
    
    const pulse = (timestamp) => {
      if (this.isPaused) {
        this.rafId = requestAnimationFrame(pulse);
        return;
      }
      
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      // Very slow 4-second pulse
      const opacity = 0.5 + Math.sin(elapsed / 2000) * 0.1;
      element.style.opacity = opacity;
      
      this.rafId = requestAnimationFrame(pulse);
    };
    
    requestAnimationFrame(pulse);
  }
  
  animateLine(element) {
    // Animate SVG line drawing
    const length = element.getTotalLength();
    element.style.strokeDasharray = length;
    element.style.strokeDashoffset = length;
    
    // Observe when line comes into view
    const lineObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            element.style.strokeDashoffset = '0';
            lineObserver.unobserve(element);
          }
        });
      },
      { threshold: 0.3 }
    );
    
    lineObserver.observe(element);
  }
  
  animateWaveform(element) {
    const path = element.querySelector('.wave-line');
    if (!path) return;
    
    let startTime = null;
    const points = 50;
    const amplitude = 20;
    const frequency = 0.002;
    
    const wave = (timestamp) => {
      if (this.isPaused) {
        this.rafId = requestAnimationFrame(wave);
        return;
      }
      
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      let pathData = 'M 0 20 ';
      
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * 200;
        const y = 20 + Math.sin(i * 0.3 + elapsed * frequency) * amplitude;
        pathData += `L ${x} ${y} `;
      }
      
      path.setAttribute('d', pathData);
      
      this.rafId = requestAnimationFrame(wave);
    };
    
    requestAnimationFrame(wave);
  }
  
  animateScanningLine(element) {
    let startTime = null;
    
    const scan = (timestamp) => {
      if (this.isPaused) {
        this.rafId = requestAnimationFrame(scan);
        return;
      }
      
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      // Move across container over 3 seconds, then repeat
      const progress = (elapsed % 3000) / 3000;
      const xPos = progress * 100;
      
      element.style.left = `${xPos}%`;
      
      this.rafId = requestAnimationFrame(scan);
    };
    
    requestAnimationFrame(scan);
  }
  
  pause() {
    this.isPaused = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  resume() {
    this.isPaused = false;
    this.initContinuousAnimations();
  }
  
  destroy() {
    // Clean up all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.animatedElements.clear();
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.scrollAnimationController = new ScrollAnimationController();
  });
} else {
  window.scrollAnimationController = new ScrollAnimationController();
}
