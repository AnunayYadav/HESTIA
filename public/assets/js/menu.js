/* ============================================
   HESTIA — Cinematic Game Main Menu
   Interactive JavaScript
   ============================================ */

(function () {
    'use strict';

    // ============ SPLASH SCREEN EMBERS ============
    const splashCanvas = document.getElementById('ember-canvas-splash');
    const splashCtx = splashCanvas.getContext('2d');
    let splashEmbers = [];
    let splashAnimId;

    function resizeSplashCanvas() {
        splashCanvas.width = window.innerWidth;
        splashCanvas.height = window.innerHeight;
    }

    class Ember {
        constructor(canvas, opts = {}) {
            this.canvas = canvas;
            this.reset(opts);
        }

        reset(opts = {}) {
            const w = this.canvas.width;
            const h = this.canvas.height;
            this.x = opts.x ?? Math.random() * w;
            this.y = opts.y ?? h + Math.random() * 100;
            this.size = Math.random() * 3 + 1;
            this.speedX = (Math.random() - 0.5) * 0.8;
            this.speedY = -(Math.random() * 1.5 + 0.5);
            this.opacity = Math.random() * 0.7 + 0.3;
            this.decay = Math.random() * 0.003 + 0.002;
            this.hue = 25 + Math.random() * 20; // warm orange range
            this.life = 1;
        }

        update() {
            this.x += this.speedX + Math.sin(this.y * 0.01) * 0.3;
            this.y += this.speedY;
            this.life -= this.decay;
            this.opacity = this.life * 0.7;
            if (this.life <= 0 || this.y < -20) {
                this.reset();
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = `hsl(${this.hue}, 85%, 55%)`;
            ctx.shadowBlur = this.size * 4;
            ctx.shadowColor = `hsl(${this.hue}, 90%, 50%)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function initSplashEmbers() {
        resizeSplashCanvas();
        splashEmbers = [];
        for (let i = 0; i < 60; i++) {
            splashEmbers.push(new Ember(splashCanvas, {
                y: Math.random() * splashCanvas.height
            }));
        }
    }

    function animateSplashEmbers() {
        splashCtx.clearRect(0, 0, splashCanvas.width, splashCanvas.height);
        splashEmbers.forEach(e => {
            e.update();
            e.draw(splashCtx);
        });
        splashAnimId = requestAnimationFrame(animateSplashEmbers);
    }

    // ============ SPLASH → MAIN MENU TRANSITION ============
    function startSplashSequence() {
        initSplashEmbers();
        animateSplashEmbers();

        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            const mainMenu = document.getElementById('main-menu');

            splash.classList.add('fade-out');
            mainMenu.classList.remove('hidden');

            setTimeout(() => {
                mainMenu.classList.add('visible');
            }, 100);

            setTimeout(() => {
                splash.style.display = 'none';
                cancelAnimationFrame(splashAnimId);
                splashCtx.clearRect(0, 0, splashCanvas.width, splashCanvas.height);
            }, 1300);
        }, 3200);
    }

    // ============ MAIN MENU PARTICLES ============
    const particleCanvas = document.getElementById('particle-canvas');
    const particleCtx = particleCanvas ? particleCanvas.getContext('2d') : null;
    let particles = [];

    class DustParticle {
        constructor(canvas) {
            this.canvas = canvas;
            this.reset(true);
        }

        reset(initial = false) {
            const w = this.canvas.width;
            const h = this.canvas.height;
            this.x = Math.random() * w;
            this.y = initial ? Math.random() * h : -10;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.4) * 0.6; // slight rightward drift
            this.speedY = Math.random() * 0.4 + 0.1;
            this.opacity = Math.random() * 0.4 + 0.1;
            this.wobble = Math.random() * Math.PI * 2;
            this.wobbleSpeed = Math.random() * 0.02 + 0.005;
            this.type = Math.random() > 0.6 ? 'ash' : 'dust';
        }

        update() {
            this.wobble += this.wobbleSpeed;
            this.x += this.speedX + Math.sin(this.wobble) * 0.3;
            this.y += this.speedY;

            if (this.y > this.canvas.height + 10 || this.x < -20 || this.x > this.canvas.width + 20) {
                this.reset();
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            if (this.type === 'ash') {
                ctx.fillStyle = 'rgba(200, 180, 150, 0.6)';
            } else {
                ctx.fillStyle = 'rgba(160, 170, 150, 0.4)';
            }
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function resizeParticleCanvas() {
        if (!particleCanvas) return;
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
    }

    function initParticles() {
        resizeParticleCanvas();
        particles = [];
        const count = Math.min(100, Math.floor(window.innerWidth * 0.06));
        for (let i = 0; i < count; i++) {
            particles.push(new DustParticle(particleCanvas));
        }
    }

    function animateParticles() {
        if (!particleCtx) return;
        particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        particles.forEach(p => {
            p.update();
            p.draw(particleCtx);
        });
        requestAnimationFrame(animateParticles);
    }

    // ============ FLICKERING LIGHTS ============
    function createFlickerLights() {
        const flickerLayer = document.getElementById('flicker-layer');
        if (!flickerLayer) return;

        // Clear existing lights
        flickerLayer.innerHTML = '';

        const lights = [
            { left: '12%', bottom: '22%' },
            { left: '18%', bottom: '28%' },
            { left: '25%', bottom: '18%' },
            { left: '32%', bottom: '35%' },
            { left: '38%', bottom: '24%' },
            { left: '45%', bottom: '30%' },
            { left: '52%', bottom: '20%' },
            { left: '58%', bottom: '32%' },
            { left: '65%', bottom: '26%' },
            { left: '72%', bottom: '22%' },
            { left: '78%', bottom: '34%' },
            { left: '84%', bottom: '28%' },
            { left: '90%', bottom: '24%' },
            { left: '15%', bottom: '38%' },
            { left: '42%', bottom: '15%' },
            { left: '68%', bottom: '40%' },
            { left: '55%', bottom: '42%' },
            { left: '30%', bottom: '12%' },
            { left: '80%', bottom: '16%' },
            { left: '48%', bottom: '38%' },
        ];

        lights.forEach(pos => {
            const light = document.createElement('div');
            light.classList.add('flicker-light');
            light.style.left = pos.left;
            light.style.bottom = pos.bottom;
            light.style.setProperty('--duration', `${1 + Math.random() * 3}s`);
            light.style.setProperty('--delay', `${Math.random() * 4}s`);
            light.style.width = `${2 + Math.random() * 2}px`;
            light.style.height = light.style.width;
            flickerLayer.appendChild(light);
        });
    }

    // ============ PARALLAX EFFECT ============
    let mouseX = 0.5;
    let mouseY = 0.5;
    let currentX = 0.5;
    let currentY = 0.5;
    const parallaxLayers = [];

    function initParallax() {
        const layers = document.querySelectorAll('.parallax-layer');
        layers.forEach(layer => {
            const depth = parseFloat(layer.dataset.depth) || 0;
            parallaxLayers.push({ el: layer, depth });
        });
    }

    function updateParallax() {
        // Smooth interpolation
        currentX += (mouseX - currentX) * 0.04;
        currentY += (mouseY - currentY) * 0.04;

        const offsetX = (currentX - 0.5);
        const offsetY = (currentY - 0.5);

        parallaxLayers.forEach(({ el, depth }) => {
            const moveX = offsetX * depth * 600;
            const moveY = offsetY * depth * 400;
            el.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });

        requestAnimationFrame(updateParallax);
    }

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX / window.innerWidth;
        mouseY = e.clientY / window.innerHeight;
    });

    // ============ LOGIN MODAL ============
    const loginBtn = document.getElementById('login-btn');
    const loginOverlay = document.getElementById('login-overlay');
    const loginClose = document.getElementById('login-close');
    const loginForm = document.getElementById('login-form');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            loginOverlay.classList.add('active');
        });
    }

    if (loginClose) {
        loginClose.addEventListener('click', () => {
            loginOverlay.classList.remove('active');
        });
    }

    if (loginOverlay) {
        loginOverlay.addEventListener('click', (e) => {
            if (e.target === loginOverlay) {
                loginOverlay.classList.remove('active');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            // Placeholder interaction — flash the button
            const submitBtn = document.getElementById('submit-login');
            submitBtn.style.transform = 'scale(0.97)';
            submitBtn.textContent = 'Authenticating...';
            setTimeout(() => {
                submitBtn.style.transform = '';
                submitBtn.innerHTML = '<span>Login</span><div class="btn-shimmer"></div>';
                loginOverlay.classList.remove('active');
            }, 1500);
        });
    }

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && loginOverlay && loginOverlay.classList.contains('active')) {
            loginOverlay.classList.remove('active');
        }
    });

    // ============ MENU BUTTON AUDIO-LIKE FEEDBACK ============
    const menuBtns = document.querySelectorAll('.menu-btn');
    menuBtns.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            // Subtle haptic-like visual pulse
            btn.style.transition = 'all 0.15s ease';
            setTimeout(() => {
                btn.style.transition = '';
            }, 150);
        });
    });

    // ============ RESIZE HANDLER ============
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeSplashCanvas();
            resizeParticleCanvas();
        }, 200);
    });

    // ============ INITIALIZATION ============
    function init() {
        startSplashSequence();
        initParticles();
        animateParticles();
        createFlickerLights();
        initParallax();
        updateParallax();
    }

    // Wait for DOM + assets
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
