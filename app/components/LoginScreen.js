'use client';

import { useState } from 'react';

export default function LoginScreen({ onLoginSuccess }) {
    const [id, setId] = useState('');
    const [key, setKey] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loginSucceeded = () => {
        if (id.trim() && key.trim()) {
            setSubmitting(true);
            setTimeout(() => onLoginSuccess(), 1000);
        }
    };

    return (
        <div className="login-overlay">
            <div className="login-card">
                <div className="login-content">
                    <div className="login-header">
                        <div className="login-logo-container">
                            <img src="/assets/images/ui/logo.png" alt="Hestia" className="login-logo-img" />
                        </div>
                        <div className="login-wordmark">
                            <img src="/assets/images/ui/logo_word.png" alt="HESTIA" className="login-wordmark-img" />
                        </div>
                    </div>

                    <div className="login-form">
                        <div className="input-group">
                            <label className="input-label">USERNAME</label>
                            <div className="input-field">
                                <div className="input-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Enter your identification..." 
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                    autoComplete="off"
                                />
                                <div className="field-border" />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">ACCESS KEY</label>
                            <div className="input-field">
                                <div className="input-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </div>
                                <input 
                                    type="password" 
                                    placeholder="Enter your security key..." 
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && loginSucceeded()}
                                />
                                <div className="field-border" />
                            </div>
                        </div>

                        <button 
                            type="button" 
                            className="login-action-btn" 
                            disabled={submitting}
                            onClick={loginSucceeded}
                        >
                            <span className="btn-text">{submitting ? 'AUTHORIZING...' : 'START GAME'}</span>
                        </button>
                    </div>

                    <div className="login-footer">
                        <div className="footer-divider">
                            <span className="divider-line" />
                            <span className="divider-text">OR</span>
                            <span className="divider-line" />
                        </div>
                        <button type="button" className="guest-action-btn" onClick={() => onLoginSuccess()}>
                            <span className="btn-text">PLAY AS GUEST</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
