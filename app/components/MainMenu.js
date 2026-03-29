'use client';

import { useEffect, useRef, useState } from 'react';

// ============ Dust Particle Class ============
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
        this.speedX = (Math.random() - 0.4) * 0.6;
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

export default function MainMenu({ onLoginSuccess, hideUI }) {
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showProfileCreateModal, setShowProfileCreateModal] = useState(false);
    const [showProfileSelectModal, setShowProfileSelectModal] = useState(false);
    const [profiles, setProfiles] = useState([]);
    const [newProfileName, setNewProfileName] = useState('');
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const animIdRef = useRef(null);

    // Particle system
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();

        // Init particles
        const count = Math.min(100, Math.floor(window.innerWidth * 0.06));
        particlesRef.current = [];
        for (let i = 0; i < count; i++) {
            particlesRef.current.push(new DustParticle(canvas));
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particlesRef.current.forEach(p => {
                p.update();
                p.draw(ctx);
            });
            animIdRef.current = requestAnimationFrame(animate);
        }
        animate();

        window.addEventListener('resize', resize);
        return () => {
            cancelAnimationFrame(animIdRef.current);
            window.removeEventListener('resize', resize);
        };
    }, []);

    // Load profiles on mount
    useEffect(() => {
        const stored = localStorage.getItem('HESTIA_PROFILES');
        if (stored) {
            setProfiles(JSON.parse(stored));
        }
    }, []);

    // Close modals on Escape key
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                setShowAboutModal(false);
                setShowProfileCreateModal(false);
                setShowProfileSelectModal(false);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showAboutModal, showProfileCreateModal, showProfileSelectModal]);

    const handleCreateProfile = (e) => {
        e.preventDefault();
        if (!newProfileName.trim()) return;

        const newProfile = {
            name: newProfileName,
            createdAt: new Date().toISOString(),
            lastPlayed: new Date().toISOString()
        };

        const updatedProfiles = [...profiles, newProfile];
        localStorage.setItem('HESTIA_PROFILES', JSON.stringify(updatedProfiles));
        localStorage.setItem('HESTIA_CURRENT_PROFILE', JSON.stringify(newProfile));
        setProfiles(updatedProfiles);
        
        setIsTransitioning(true);
        setTimeout(() => {
            window.location.href = '/story';
        }, 1500);
    };

    const handleSelectProfile = (profile) => {
        localStorage.setItem('HESTIA_CURRENT_PROFILE', JSON.stringify(profile));
        setIsTransitioning(true);
        setTimeout(() => {
            window.location.href = '/gameplay';
        }, 1000);
    };

    const menuItems = [
        { label: 'Begin a New Story', id: 'new-story' },
        { label: 'Continue the Story', id: 'continue-story' },
        { label: 'Options', id: 'options' },
        { label: 'About Us', id: 'about-us' },
    ];

    return (
        <div className="parallax-container">
            {/* Video Background */}
            <video
                className="menu-video-bg"
                src="/assets/videos/main_menu_bg.mp4"
                autoPlay
                loop
                muted
                playsInline
            />

            {/* Particle canvas */}
            <canvas ref={canvasRef} className="particle-canvas" />

            {/* Vignette */}
            <div className="vignette-overlay" />

            {/* UI Layer */}
            {!hideUI && (
                <div className="ui-layer">
                    {/* Top left — Title */}
                    <div className="title-watermark">
                        <img src="/assets/images/ui/logo_word.png" alt="Hestia" className="game-title-img" />
                    </div>

                    {/* Top right — Login */}
                    <div className="top-right-ui">
                        <button className="login-btn" id="login-btn" onClick={onLoginSuccess}>
                            <span className="login-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <polyline points="10 17 15 12 10 7" />
                                    <line x1="15" y1="12" x2="3" y2="12" />
                                </svg>
                            </span>
                            {hideUI ? 'LOGIN' : 'LOGOUT'}
                        </button>
                    </div>

                    {/* Bottom left — Menu */}
                    <div className="bottom-left-ui">

                        <div className="menu-buttons">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    className="cta"
                                    id={item.id}
                                    onClick={() => {
                                        if (item.id === 'about-us') {
                                            setShowAboutModal(true);
                                        } else if (item.id === 'new-story') {
                                            setShowProfileCreateModal(true);
                                        } else if (item.id === 'continue-story') {
                                            if (profiles.length === 0) {
                                                alert("No existing stories found. Start a new one!");
                                            } else if (profiles.length === 1) {
                                                handleSelectProfile(profiles[0]);
                                            } else {
                                                setShowProfileSelectModal(true);
                                            }
                                        }
                                    }}
                                >
                                    <span className="span">{item.label}</span>
                                    <svg className="second" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                        <path className="one" d="M6 8 L14 16 L6 24 Z" />
                                        <path className="two" d="M14 8 L22 16 L14 24 Z" />
                                        <path className="three" d="M22 8 L30 16 L22 24 Z" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* About Us Modal */}
            {showAboutModal && (
                <div className="about-modal-overlay" onClick={() => setShowAboutModal(false)}>
                    <div className="about-modal-card" onClick={(e) => e.stopPropagation()}>
                        {/* Close Button */}
                        <button className="about-modal-close" onClick={() => setShowAboutModal(false)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        {/* Modal Content */}
                        <div className="about-modal-body">
                            <div className="credit-header">
                                <div className="studio-info">
                                    <h1 className="credit-studio">Angel NextDoor</h1>
                                    <span className="studio-label">STUDIO PRESENTS</span>
                                </div>
                                <div className="credit-divider" />
                                <div className="logo-container">
                                    <img
                                        src="/assets/images/ui/logo.png"
                                        alt="HESTIA Logo"
                                        className="credit-logo-main"
                                    />
                                </div>
                            </div>

                            <div className="credit-section">
                                <h2 className="section-title">The Masterminds</h2>
                                <div className="credits-grid">
                                    {/* ANUNAY — Systems & Vision */}
                                    <div className="credit-entry">
                                        <div className="entry-header">
                                            <span className="name">Anunay Yadav</span>
                                            <span className="specialty-tag">Vision & Systems</span>
                                        </div>
                                        <div className="roles-container">
                                            <span className="role">Visionary Director</span>
                                            <span className="role">Game Architect</span>
                                            <span className="role">Chief Systems Architect</span>
                                            <span className="role">Lead Gameplay Engineer</span>
                                            <span className="role">Executive Game Designer</span>
                                            <span className="role">Creative Technologist</span>
                                            <span className="role">Mastermind of Systems</span>
                                            <span className="role">World Systems Director</span>
                                        </div>
                                    </div>

                                    {/* ABHINAV KUMAR MISHRA — UI & Narrative */}
                                    <div className="credit-entry">
                                        <div className="entry-header">
                                            <span className="name">Abhinav Kumar Mishra</span>
                                            <span className="specialty-tag">Narrative & Experience</span>
                                        </div>
                                        <div className="roles-container">
                                            <span className="role">Narrative Architect</span>
                                            <span className="role">Experience Designer</span>
                                            <span className="role">UI Vision Designer</span>
                                            <span className="role">Story Systems Designer</span>
                                            <span className="role">Interactive Narrative Designer</span>
                                            <span className="role">Cinematic UI Designer</span>
                                        </div>
                                    </div>

                                    {/* MANTHAN — Lore & Characters */}
                                    <div className="credit-entry">
                                        <div className="entry-header">
                                            <span className="name">Manthan Choudhary</span>
                                            <span className="specialty-tag">World & Lore</span>
                                        </div>
                                        <div className="roles-container">
                                            <span className="role">Lore Architect</span>
                                            <span className="role">Character Visionary</span>
                                            <span className="role">Worldbuilding Director</span>
                                            <span className="role">Narrative World Designer</span>
                                            <span className="role">Character & Mythos Designer</span>
                                            <span className="role">Story Universe Creator</span>
                                        </div>
                                    </div>

                                    {/* ABHINAV CHAUHAN — Support & Implementation */}
                                    <div className="credit-entry">
                                        <div className="entry-header">
                                            <span className="name">Abhinav Chauhan</span>
                                            <span className="specialty-tag">Technical Associate</span>
                                        </div>
                                        <div className="roles-container">
                                            <span className="role">Technical Support Engineer</span>
                                            <span className="role">Development Associate</span>
                                            <span className="role">Junior Systems Engineer</span>
                                            <span className="role">Implementation Specialist</span>
                                            <span className="role">Engineering Support</span>
                                        </div>
                                    </div>

                                    {/* AYUSMAN PAL — Assets & Content */}
                                    <div className="credit-entry">
                                        <div className="entry-header">
                                            <span className="name">Ayusman Pal</span>
                                            <span className="specialty-tag">Production & Assets</span>
                                        </div>
                                        <div className="roles-container">
                                            <span className="role">Visual Assets Designer</span>
                                            <span className="role">Media & Asset Engineer</span>
                                            <span className="role">Production Designer</span>
                                            <span className="role">Digital Assets Creator</span>
                                            <span className="role">Content & Assets Designer</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="credit-section mission-section">
                                <div className="mission-separator" />
                                <h2 className="section-title">Studio Mission</h2>
                                <div className="mission-content">
                                    <p className="credit-text">
                                        Angle NextDoor is an independent creative studio dedicated to crafting immersive narratives and advanced simulations. Project Hestia is our flagship experience, built to demonstrate the future of collaborative storytelling and technical innovation.
                                    </p>
                                </div>
                                <div className="mission-footer-ornament">
                                    <span>◆</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Creation Modal */}
            {showProfileCreateModal && (
                <div className="about-modal-overlay" onClick={() => setShowProfileCreateModal(false)}>
                    <div className="about-modal-card profile-card" onClick={(e) => e.stopPropagation()}>
                        <div className="about-modal-body">
                            <h2 className="modal-title">Identify Thyself</h2>
                            <p className="modal-subtitle">Enter your name to begin your journey in Hestia.</p>
                            <form onSubmit={handleCreateProfile} className="profile-form">
                                <input 
                                    type="text" 
                                    className="profile-input" 
                                    placeholder="Enter Profile Name..." 
                                    value={newProfileName}
                                    onChange={(e) => setNewProfileName(e.target.value)}
                                    autoFocus
                                    required
                                />
                                <div className="modal-actions">
                                    <button type="button" className="modal-btn secondary" onClick={() => setShowProfileCreateModal(false)}>Cancel</button>
                                    <button type="submit" className="modal-btn primary">Begin Story</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Selection Modal */}
            {showProfileSelectModal && (
                <div className="about-modal-overlay" onClick={() => setShowProfileSelectModal(false)}>
                    <div className="about-modal-card profile-card" onClick={(e) => e.stopPropagation()}>
                        <div className="about-modal-body">
                            <h2 className="modal-title">Return to Hestia</h2>
                            <p className="modal-subtitle">Select a profile to continue your story.</p>
                            <div className="profile-list">
                                {profiles.map((p, i) => (
                                    <button 
                                        key={i} 
                                        className="profile-item"
                                        onClick={() => handleSelectProfile(p)}
                                    >
                                        <div className="profile-info">
                                            <span className="p-name">{p.name}</span>
                                            <span className="p-date">Last seen: {new Date(p.lastPlayed).toLocaleDateString()}</span>
                                        </div>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                            <div className="modal-actions">
                                <button className="modal-btn secondary" onClick={() => setShowProfileSelectModal(false)}>Back</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Story Transition Overlay */}
            <div className={`story-transition-overlay ${isTransitioning ? 'active' : ''}`}>
                <div className="transition-message">THE STORY BEGINS...</div>
            </div>
        </div>
    );
}
