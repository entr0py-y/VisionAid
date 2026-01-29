/**
 * Interactive Eye Background Animation
 * Premium, Full Almond Structure, Assistive Tech Aesthetic.
 * Optimized for smooth initial loading.
 */

class EyeController {
    constructor() {
        this.canvas = document.getElementById('eye-canvas');
        if (!this.canvas) return;

        // Optimize canvas for performance
        this.ctx = this.canvas.getContext('2d', { 
            alpha: true,
            desynchronized: true // Reduces latency
        });
        
        // Performance optimization
        this.canvas.style.willChange = 'transform';
        
        // State
        this.mouse = { x: 0, y: 0 };
        this.bgMouse = { x: 0, y: 0 }; // Smoother for background parallax
        this.currentPupil = { x: 0, y: 0 };
        this.currentIris = { x: 0, y: 0 }; // Parallax iris
        this.center = { x: 0, y: 0 };
        
        // Dimensions
        this.eyeWidth = 0;
        this.eyeHeight = 0;
        this.irisRadius = 0;
        this.pupilRadius = 0;
        
        // Animation State
        this.rafId = null;
        this.time = 0;
        this.irisRotation = 0;
        this.frameCount = 0; // Track frames for startup optimization
        this.isWarmedUp = false; // Flag for initial warmup period
        
        // Eyelid State
        this.blinkFactor = 1; // Start CLOSED (1 = closed, 0 = open)
        this.squintFactor = 0; // 0 = relaxed, 1 = squinted
        this.targetSquint = 0;
        this.nextBlinkTime = Math.random() * 300 + 200; // Frames until next blink
        this.isBlinking = false;
        this.hasInteracted = false; // Eye stays closed until first interaction
        
        // Physics
        this.velocity = { x: 0, y: 0 };
        this.lastMouse = { x: 0, y: 0 };

        // Configuration
        this.lerpFactor = 0.1;

        // Theme Colors
        this.colors = {
            bg: '#0B0B0D',
            outline: 'rgba(255, 255, 255, 0.4)',
            irisStart: '#333',
            irisEnd: '#111',
            pupil: '#000',
            glow: 'rgba(255, 255, 255, 0.05)',
            radialLines: 'rgba(255, 255, 255, 0.1)'
        };

        // Idle State
        this.lastInteractionTime = Date.now();
        this.isIdle = false;
        this.idleThreshold = 5000; // 5 seconds

        this.init();
    }

    init() {
        this.bindEvents();
        this.resize();
        this.updateTheme();
        // Delay animation start slightly to let browser settle
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.animate();
            });
        });
    }

    bindEvents() {
        const resetIdle = () => {
            this.lastInteractionTime = Date.now();
            this.isIdle = false;
            this.hasInteracted = true; // Mark that user has interacted - eye will open
        };

        window.addEventListener('resize', () => this.resize());
        
        // Track all interaction types
        ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
            window.addEventListener(evt, resetIdle, { passive: true });
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            // Calculate velocity for micro-tension
            const dx = this.mouse.x - this.lastMouse.x;
            const dy = this.mouse.y - this.lastMouse.y;
            this.velocity.x = dx;
            this.velocity.y = dy;
            this.lastMouse.x = this.mouse.x;
            this.lastMouse.y = this.mouse.y;
            
            // Removed layout-triggering elementFromPoint for performance
            this.targetSquint = 0;
        });
        
        const observer = new MutationObserver(() => this.updateTheme());
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    }

    updateTheme() {
        const computedStyle = getComputedStyle(document.documentElement);
        // Using computed styles or fallback based on class
        const isLight = document.documentElement.classList.contains('light-mode');
        
        this.colors.bg = computedStyle.getPropertyValue('--eye-bg').trim() || (isLight ? '#F5F5F7' : '#0B0B0D');
        this.colors.outline = computedStyle.getPropertyValue('--eye-outline').trim() || (isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)');
        this.colors.irisStart = computedStyle.getPropertyValue('--eye-iris-start').trim() || (isLight ? '#E0E0E0' : '#333');
        this.colors.irisEnd = computedStyle.getPropertyValue('--eye-iris-end').trim() || (isLight ? '#C0C0C0' : '#111');
        this.colors.pupil = computedStyle.getPropertyValue('--eye-pupil').trim() || (isLight ? '#222' : '#000');
        this.colors.glow = computedStyle.getPropertyValue('--eye-glow').trim() || (isLight ? 'transparent' : 'rgba(255,255,255,0.05)');
        this.colors.radialLines = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)';
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.center.x = window.innerWidth / 2;
        this.center.y = window.innerHeight / 2;

        // Eye Dimensions (Almond Shape)
        // 65-75% viewport width
        this.eyeWidth = Math.min(window.innerWidth * 0.7, 900);
        this.eyeHeight = this.eyeWidth * 0.45; // Aspect ratio
        
        this.irisRadius = this.eyeHeight * 0.55;
        this.pupilRadius = this.irisRadius * 0.35;
    }

    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    getEyePath(openness) {
        const w = this.eyeWidth / 2;
        const h = (this.eyeHeight / 2) * openness;
        
        const path = new Path2D();
        // Upper Lid - using cubic bezier for almond shape
        path.moveTo(-w, 0); 
        path.bezierCurveTo(-w * 0.5, -h * 1.5, w * 0.5, -h * 1.5, w, 0);
        
        // Lower Lid
        path.bezierCurveTo(w * 0.5, h * 1.3, -w * 0.5, h * 1.3, -w, 0);
        path.closePath();
        return path;
    }

    update() {
        this.time += 1;

        // Check Idle State
        if (Date.now() - this.lastInteractionTime > this.idleThreshold) {
            this.isIdle = true;
        }

        // 1. Target Tracking
        const dx = this.mouse.x - this.center.x;
        const dy = this.mouse.y - this.center.y;
        
        // Limit movement to within the eye
        const maxDistX = this.eyeWidth * 0.35;
        const maxDistY = this.eyeHeight * 0.15 * (1 - this.blinkFactor); // Limit Y movement when blinking
        
        let targetX = Math.max(-maxDistX, Math.min(maxDistX, dx));
        let targetY = Math.max(-maxDistY, Math.min(maxDistY, dy));

        // Parallax: Iris moves slower than pupil target (which tracks mouse 1:1 visually but mapped)
        this.currentPupil.x = this.lerp(this.currentPupil.x, targetX, this.lerpFactor);
        this.currentPupil.y = this.lerp(this.currentPupil.y, targetY, this.lerpFactor);
        
        this.currentIris.x = this.lerp(this.currentIris.x, targetX * 0.8, this.lerpFactor * 0.8);
        this.currentIris.y = this.lerp(this.currentIris.y, targetY * 0.8, this.lerpFactor * 0.8);

        // 2. Blinking Logic
        // If user hasn't interacted yet, keep eye closed
        if (!this.hasInteracted) {
            this.blinkFactor = 1; // Stay fully closed
            this.isBlinking = false;
        } else if (this.isIdle) {
            // If idle (after interaction), slowly close
            this.blinkFactor = this.lerp(this.blinkFactor, 1, 0.05); // Smooth close for idle
            this.isBlinking = false; // Disable random blinking while idle
            this.targetSquint = 0; // Relax squint
        } else {
            // Normal Random Blinking (eye is open and active)
            this.nextBlinkTime--;
            if (this.nextBlinkTime <= 0) {
                this.isBlinking = true;
            }

            if (this.isBlinking) {
                this.blinkFactor += 0.15; // Speed of closing
                if (this.blinkFactor >= 1.2) { // Overshoot slightly for full close
                    this.blinkFactor = 1;
                    this.isBlinking = false;
                    this.nextBlinkTime = Math.random() * 300 + 300; // Reset timer
                }
            } else {
                this.blinkFactor = this.lerp(this.blinkFactor, 0, 0.08); // Open smoothly
            }
        }

        // 3. Squint Logic (Hover + Velocity)
        // Only squint if active
        if (!this.isIdle) {
            const vel = Math.abs(this.velocity.x) + Math.abs(this.velocity.y);
            const velocitySquint = Math.min(vel * 0.005, 0.1); // Slight squint on fast movement
            
            // Combine hover squint and velocity squint
            let desiredSquint = Math.max(this.targetSquint, velocitySquint);
            this.squintFactor = this.lerp(this.squintFactor, desiredSquint, 0.1);
        } else {
            this.squintFactor = this.lerp(this.squintFactor, 0, 0.1);
        }

        // 4. Iris Rotation (Slow idle + reactive)
        this.irisRotation += 0.001 + ( Math.abs(this.velocity.x + this.velocity.y) * 0.0001);
    }

    draw() {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);

        this.ctx.save();
        this.ctx.translate(this.center.x, this.center.y);

        // Calculate current eye openness
        // Base openness = 1, minus blink, minus squint
        let openness = 1 - this.blinkFactor - (this.squintFactor * 0.4);
        if (openness < 0) openness = 0;

        // Current Eye Path
        const eyePath = this.getEyePath(openness);

        // --- LAYER 1: Outer Glow (Dark Mode only) ---
        if (this.colors.glow !== 'transparent' && openness > 0.1) {
            this.ctx.shadowBlur = 40;
            this.ctx.shadowColor = this.colors.glow;
        }

        // --- LAYER 2: Eye Outline ---
        this.ctx.strokeStyle = this.colors.outline;
        this.ctx.lineWidth = 1; // Thin 1px stroke
        this.ctx.stroke(eyePath);
        this.ctx.shadowBlur = 0; // Reset shadow

        // --- CLIP MASK ---
        this.ctx.save(); // Save state before clip
        this.ctx.clip(eyePath);

        // --- PAPER BACKGROUND (Sclera) ---
        // Just transparent/background color usually, but we can fill slightly to obscure background lines if needed
        // this.ctx.fillStyle = this.colors.bg;
        // this.ctx.fill(eyePath);

        // --- LAYER 3: IRIS ---
        this.ctx.translate(this.currentIris.x, this.currentIris.y);
        this.ctx.rotate(this.irisRotation);

        // Iris Gradient
        const irisGrad = this.ctx.createRadialGradient(0, 0, this.irisRadius * 0.2, 0, 0, this.irisRadius);
        irisGrad.addColorStop(0, this.colors.irisStart);
        irisGrad.addColorStop(1, this.colors.irisEnd);
        
        this.ctx.fillStyle = irisGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.irisRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Iris Radial Lines - Reduced from 40 to 24 for better performance
        // Skip radial lines during warmup for faster initial render
        if (this.isWarmedUp) {
            this.ctx.strokeStyle = this.colors.radialLines;
            this.ctx.lineWidth = 1;
            const lines = 24; // Reduced from 40
            this.ctx.beginPath(); // Batch all lines into single path
            for (let i = 0; i < lines; i++) {
                const angle = (i / lines) * Math.PI * 2;
                const len = (i % 2 === 0) ? 0.9 : 0.7;
                this.ctx.moveTo(Math.cos(angle) * this.irisRadius * 0.3, Math.sin(angle) * this.irisRadius * 0.3);
                this.ctx.lineTo(Math.cos(angle) * this.irisRadius * len, Math.sin(angle) * this.irisRadius * len);
            }
            this.ctx.stroke(); // Single stroke call for all lines
        }

        // --- LAYER 4: PUPIL ---
        this.ctx.rotate(-this.irisRotation); // Counter-rotate pupil so it stays upright (optional, but good for gloss)
        // Parallax offset for pupil relative to Iris
        const pupilOffsetX = (this.currentPupil.x - this.currentIris.x) * 0.5;
        const pupilOffsetY = (this.currentPupil.y - this.currentIris.y) * 0.5;
        this.ctx.translate(pupilOffsetX, pupilOffsetY);

        this.ctx.fillStyle = this.colors.pupil;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.pupilRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // --- LAYER 5: REFLECTION ---
        if (openness > 0.2) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.beginPath();
            // Gloss shape
            this.ctx.ellipse(-this.pupilRadius * 0.3, -this.pupilRadius * 0.3, this.pupilRadius * 0.25, this.pupilRadius * 0.15, Math.PI / 4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore(); // Restore Clip
        this.ctx.restore(); // Restore Translation
    }

    animate() {
        // Track warmup period - first 60 frames (~1 second)
        this.frameCount++;
        if (this.frameCount > 60 && !this.isWarmedUp) {
            this.isWarmedUp = true;
            // Remove will-change after warmup to free GPU memory
            this.canvas.style.willChange = 'auto';
        }
        
        if (document.hidden) { // Optimization
            this.rafId = requestAnimationFrame(() => this.animate());
            return;
        }
        
        // During warmup, skip every other frame for smoother perceived performance
        if (!this.isWarmedUp && this.frameCount % 2 === 0) {
            this.rafId = requestAnimationFrame(() => this.animate());
            return;
        }
        
        this.update();
        this.draw();
        this.rafId = requestAnimationFrame(() => this.animate());
    }
}

// Export
window.EyeController = EyeController;
