'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

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
        this.hue = 25 + Math.random() * 20;
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

/* Logo already has transparency — just render as img */

export default function SplashScreen({ onComplete }) {
    const canvasRef = useRef(null);
    const animIdRef = useRef(null);
    const embersRef = useRef([]);
    const [fadeOut, setFadeOut] = useState(false);

    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        resizeCanvas();

        // Init embers
        embersRef.current = [];
        for (let i = 0; i < 60; i++) {
            embersRef.current.push(new Ember(canvas, { y: Math.random() * canvas.height }));
        }

        // Animate
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            embersRef.current.forEach(e => {
                e.update();
                e.draw(ctx);
            });
            animIdRef.current = requestAnimationFrame(animate);
        }
        animate();

        // Transition timer
        const timer = setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => {
                cancelAnimationFrame(animIdRef.current);
                if (onComplete) onComplete();
            }, 800);
        }, 1500);

        const handleResize = () => resizeCanvas();
        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(animIdRef.current);
            window.removeEventListener('resize', handleResize);
        };
    }, [onComplete, resizeCanvas]);

    return (
        <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
            <canvas ref={canvasRef} className="ember-canvas" />
            <div className="splash-glow" />
            <div className="splash-content">
                <div className="hestia-logo-splash">
                    <img src="/assets/images/ui/logo.png" alt="Hestia" className="hestia-logo-img" style={{ width: '280px', height: 'auto' }} />
                </div>
                <p className="splash-subtitle">Presented by Angel NextDoor</p>
            </div>
        </div>
    );
}
