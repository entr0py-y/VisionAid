/**
 * Premium Dot Grid Background
 * Performance optimized, context-aware, monochrome aesthetic.
 */

class GridController {
    constructor() {
        this.canvas = document.getElementById('grid-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d', { alpha: true });
        
        // Configuration
        this.spacing = 28;
        this.dotRadius = 2;
        this.mouseRadius = 120;
        this.fps = 60;
        this.interval = 1000 / this.fps;
        
        // State
        this.dots = [];
        this.mouse = { x: -1000, y: -1000 };
        this.lastTime = 0;
        this.rafId = null;
        
        // Theme variables
        this.colors = {
            dot: 'rgba(255, 255, 255, 0.12)',
            glow: 12,
            pulseAmp: 0.06
        };

        this.init();
    }

    init() {
        this.resize();
        this.updateTheme();
        this.bindEvents();
        this.createGrid();
        this.animate(0);
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createGrid();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        const observer = new MutationObserver(() => this.updateTheme());
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    }

    updateTheme() {
        const isLight = document.documentElement.classList.contains('light-mode');
        if (isLight) {
            this.colors.dot = 'rgba(0, 0, 0, 0.08)';
            this.colors.glow = 0;
            this.colors.pulseAmp = 0.03;
        } else {
            this.colors.dot = 'rgba(255, 255, 255, 0.12)';
            this.colors.glow = 12;
            this.colors.pulseAmp = 0.06;
        }
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }

    createGrid() {
        this.dots = [];
        const cols = Math.ceil(this.width / this.spacing) + 1;
        const rows = Math.ceil(this.height / this.spacing) + 1;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                this.dots.push({
                    baseX: i * this.spacing,
                    baseY: j * this.spacing,
                    x: i * this.spacing,
                    y: j * this.spacing,
                    phase: Math.random() * Math.PI * 2,
                    scale: 1,
                    currentGlow: 0
                });
            }
        }
    }

    animate(time) {
        if (document.hidden) {
            this.rafId = requestAnimationFrame((t) => this.animate(t));
            return;
        }

        const delta = time - this.lastTime;
        if (delta < this.interval) {
            this.rafId = requestAnimationFrame((t) => this.animate(t));
            return;
        }

        this.lastTime = time - (delta % this.interval);
        this.update(time);
        this.draw();
        
        this.rafId = requestAnimationFrame((t) => this.animate(t));
    }

    update(time) {
        const t = time * 0.001;
        
        this.dots.forEach(dot => {
            // 1. Tiny circular path & Pulse
            const offset = 0.6;
            const circleX = Math.cos(t + dot.phase) * offset;
            const circleY = Math.sin(t + dot.phase * 0.8) * offset;
            
            const pulse = 1 + Math.sin(t * 1.5 + dot.phase) * this.colors.pulseAmp;
            
            // 2. Mouse Interaction
            const dx = this.mouse.x - dot.baseX;
            const dy = this.mouse.y - dot.baseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            let targetScale = pulse;
            let targetGlow = 0;
            let attractionX = 0;
            let attractionY = 0;

            if (dist < this.mouseRadius) {
                const factor = 1 - dist / this.mouseRadius;
                targetScale = pulse * (1 + 0.3 * factor); // Scale up to 1.3
                targetGlow = this.colors.glow * factor;
                
                // Slight attraction offset
                attractionX = (dx / dist) * 2 * factor;
                attractionY = (dy / dist) * 2 * factor;
            }

            // Lerp smoothing
            dot.scale = this.lerp(dot.scale, targetScale, 0.1);
            dot.currentGlow = this.lerp(dot.currentGlow, targetGlow, 0.1);
            
            dot.x = dot.baseX + circleX + attractionX;
            dot.y = dot.baseY + circleY + attractionY;
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = this.colors.dot;
        
        this.dots.forEach(dot => {
            if (dot.x < -10 || dot.x > this.width + 10 || dot.y < -10 || dot.y > this.height + 10) return;

            this.ctx.beginPath();
            
            const radius = this.dotRadius * dot.scale;
            
            if (dot.currentGlow > 0) {
                this.ctx.save();
                this.ctx.shadowBlur = dot.currentGlow;
                this.ctx.shadowColor = this.colors.dot;
                this.ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            } else {
                this.ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    lerp(a, b, n) {
        return (1 - n) * a + n * b;
    }
}

// Export for integration
window.GridController = GridController;
