'use client';

import { useState, useEffect, useRef } from 'react';

const FlameIcon = () => (
    <svg viewBox="0 0 80 106" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="loginFlameGrad1" cx="50%" cy="80%" r="60%">
                <stop offset="0%" stopColor="#ffe066" />
                <stop offset="40%" stopColor="#f0a030" />
                <stop offset="100%" stopColor="#c84010" />
            </radialGradient>
            <radialGradient id="loginFlameGrad2" cx="50%" cy="70%" r="50%">
                <stop offset="0%" stopColor="#fff4b0" />
                <stop offset="60%" stopColor="#f0a030" />
                <stop offset="100%" stopColor="#d06020" />
            </radialGradient>
            <radialGradient id="loginFlameGrad3" cx="50%" cy="60%" r="40%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#ffe680" />
                <stop offset="100%" stopColor="#f0c040" />
            </radialGradient>
        </defs>
        <path d="M40 2 C55 20, 78 45, 76 68 C74 88, 58 104, 40 104 C22 104, 6 88, 4 68 C2 45, 25 20, 40 2Z" fill="url(#loginFlameGrad1)" opacity="0.8" />
        <path d="M40 18 C52 34, 66 52, 64 70 C62 84, 52 96, 40 96 C28 96, 18 84, 16 70 C14 52, 28 34, 40 18Z" fill="url(#loginFlameGrad2)" opacity="0.6" />
        <path d="M40 40 C48 50, 54 60, 52 72 C50 82, 46 90, 40 90 C34 90, 30 82, 28 72 C26 60, 32 50, 40 40Z" fill="url(#loginFlameGrad3)" opacity="0.9" />
    </svg>
);

export default function LoginModal({ isOpen, onClose }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const overlayRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) {
            onClose();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            setEmail('');
            setPassword('');
            onClose();
        }, 1500);
    };

    return (
        <div
            ref={overlayRef}
            className={`login-overlay ${isOpen ? 'active' : ''}`}
            onClick={handleOverlayClick}
        >
            <div className="login-modal">
                <button className="login-close" onClick={onClose} aria-label="Close login">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="3" y1="3" x2="13" y2="13" />
                        <line x1="13" y1="3" x2="3" y2="13" />
                    </svg>
                </button>

                <div className="login-header">
                    <div className="login-flame-icon">
                        <FlameIcon />
                    </div>
                    <h2 className="login-title">Welcome Back</h2>
                    <p className="login-desc">Enter your credentials to continue</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            className="form-input"
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                        <div className="input-glow" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            className="form-input"
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                        <div className="input-glow" />
                    </div>
                    <button className="submit-btn" type="submit" disabled={submitting}>
                        <span>{submitting ? 'Authenticating...' : 'Login'}</span>
                        {!submitting && <div className="btn-shimmer" />}
                    </button>
                </form>

                <p className="signup-link">
                    Don&apos;t have an account? <a href="#">Sign up</a>
                </p>
            </div>
        </div>
    );
}
