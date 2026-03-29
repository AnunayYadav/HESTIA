'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import DialogueBox from '../components/DialogueBox';
import './story.css';

/* ============================================================
   AUDIO HELPERS — programmatic Web Audio API sounds
   ============================================================ */
function createAudioCtx() {
    if (typeof window === 'undefined') return null;
    return new (window.AudioContext || window.webkitAudioContext)();
}

function playCrashSound(ctx) {
    if (!ctx) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    src.connect(gain).connect(ctx.destination);
    src.start();
}

function playRinging(ctx, duration = 4) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(4200, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
}

function playSiren(ctx, duration = 5) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(1.5, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(200, ctx.currentTime);
    lfo.connect(lfoGain).connect(osc.frequency);
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    lfo.start();
    osc.start();
    osc.stop(ctx.currentTime + duration);
    lfo.stop(ctx.currentTime + duration);
}

function playPhoneRing(ctx) {
    if (!ctx) return;
    // Two-tone ring
    [0, 0.15, 0.5, 0.65].forEach(delay => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(delay < 0.3 ? 440 : 480, ctx.currentTime + delay);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.06, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.12);
    });
}

function playCrowdMurmur(ctx, duration = 5) {
    if (!ctx) return;
    // Low-passed noise for crowd
    const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + duration);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
}



/* Character sprite with black-background removal via canvas */
function CharacterSprite({ src, className, style, width = 600, skipTransparency = false }) {
    const cRef = useRef(null);

    useEffect(() => {
        const canvas = cRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const scale = width / img.width;
            canvas.width = width;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            if (skipTransparency) return; // Leave the completely opaque image

            // Strip black background pixels using flood fill to preserve dark internals
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const px = data.data;
            const w = canvas.width;
            const h = canvas.height;

            const visited = new Uint8Array(w * h);
            const stack = [0, w - 1, (h - 1) * w, (h - 1) * w + w - 1]; // Start from corners

            // iterative flood fill
            while (stack.length > 0) {
                const idx = stack.pop();
                if (visited[idx]) continue;

                const pIdx = idx * 4;
                const r = px[pIdx], g = px[pIdx + 1], b = px[pIdx + 2];
                const brightness = (r + g + b) / 3;

                if (brightness < 30) {
                    visited[idx] = 1;
                    px[pIdx + 3] = 0; // make transparent

                    const x = idx % w;
                    const y = Math.floor(idx / w);
                    if (x > 0 && !visited[idx - 1]) stack.push(idx - 1);
                    if (x < w - 1 && !visited[idx + 1]) stack.push(idx + 1);
                    if (y > 0 && !visited[idx - w]) stack.push(idx - w);
                    if (y < h - 1 && !visited[idx + w]) stack.push(idx + w);
                } else if (brightness < 50) {
                    // Soften the boundary, but don't flood further
                    visited[idx] = 1;
                    px[pIdx + 3] = Math.round((brightness - 30) / 20 * 255);
                } else {
                    visited[idx] = 1; // Mark as visited so we don't process again, but leave opaque
                }
            }
            ctx.putImageData(data, 0, 0);
        };
        img.src = src;
    }, [src, width, skipTransparency]);

    return (
        <canvas
            ref={cRef}
            className={className}
            style={style}
        />
    );
}

function playAmbient(ctx, duration = 8) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
}

/* ============================================================
   SCENE DEFINITIONS
   ============================================================ */
const SCENES = {
    HANGOUT: 'hangout',
    PHONE_CALL: 'phone_call',
    WALKING: 'walking',
    ACCIDENT: 'accident',
    AFTERMATH: 'aftermath',
    VOID: 'void',
    HESTIA: 'hestia',
};

const SCENE_ORDER = [
    SCENES.HANGOUT,
    SCENES.PHONE_CALL,
    SCENES.WALKING,
    SCENES.ACCIDENT,
    SCENES.AFTERMATH,
    SCENES.VOID,
    SCENES.HESTIA,
];

/* ============================================================
   MAIN STORY INTRO COMPONENT
   ============================================================ */
export default function StoryPage() {
    const [sceneIndex, setSceneIndex] = useState(0);
    const [transition, setTransition] = useState('none');
    const [transitioning, setTransitioning] = useState(false);
    const [showGrain, setShowGrain] = useState(true);
    const [accidentPhase, setAccidentPhase] = useState(0);
    const [aftermathPhase, setAftermathPhase] = useState(0);
    const [voidPhase, setVoidPhase] = useState(0);
    const [hestiaPhase, setHestiaPhase] = useState(0);
    const [playerName, setPlayerName] = useState('X');
    const [isEnding, setIsEnding] = useState(false);
    const audioCtxRef = useRef(null);

    // Retrieve player name from profile
    useEffect(() => {
        const saved = localStorage.getItem('HESTIA_CURRENT_PROFILE');
        if (saved) {
            try {
                const profile = JSON.parse(saved);
                if (profile.name) setPlayerName(profile.name);
            } catch (e) { console.error('Error parsing profile', e); }
        }
    }, []);

    // Sprite switching state
    const [friendTalking, setFriendTalking] = useState(false);
    const [hestiaTalking, setHestiaTalking] = useState(false);
    const spriteIntervalRef = useRef(null);
    const [spriteFrame, setSpriteFrame] = useState(false); // toggles for animation

    const scene = SCENE_ORDER[sceneIndex];

    const ensureAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = createAudioCtx();
        }
        return audioCtxRef.current;
    }, []);

    // Sprite toggle interval (faster for talking movement)
    useEffect(() => {
        spriteIntervalRef.current = setInterval(() => {
            setSpriteFrame(prev => !prev);
        }, 300);
        return () => clearInterval(spriteIntervalRef.current);
    }, []);

    // Transition to next scene
    const goToScene = useCallback(() => {
        if (transitioning) return;
        setSceneIndex(prev => prev + 1);
        setAccidentPhase(0);
        setAftermathPhase(0);
        setVoidPhase(0);
        setHestiaPhase(0);
        setFriendTalking(false);
        setHestiaTalking(false);
    }, [transitioning]);

    const skipToHestia = useCallback(() => {
        setSceneIndex(SCENE_ORDER.indexOf(SCENES.HESTIA));
        setAccidentPhase(0);
        setAftermathPhase(0);
        setVoidPhase(0);
        setHestiaPhase(0);
        setFriendTalking(false);
        setHestiaTalking(false);
    }, []);

    const skipToEnd = useCallback(() => {
        setIsEnding(true);
        setTimeout(() => {
            window.location.href = '/gameplay';
        }, 1500);
    }, []);

    /* ---------- Sprite switching callbacks ---------- */
    const handleFriendSpeaker = useCallback((speaker, isTyping) => {
        setFriendTalking(speaker === 'Friend' && isTyping);
    }, []);

    const handleHestiaSpeaker = useCallback((speaker, isTyping) => {
        setHestiaTalking(speaker === 'Hestia' && isTyping);
    }, []);

    // Global keyboard controls
    useEffect(() => {
        const handleKeys = (e) => {
            if (e.code === 'Escape') {
                e.preventDefault();
                const hestiaIndex = SCENE_ORDER.indexOf(SCENES.HESTIA);
                if (sceneIndex < hestiaIndex) {
                    skipToHestia();
                } else {
                    skipToEnd();
                }
            }
            // Space is usually handled by DialogueBox, but we can ensure it works here if needed
            // Actually, DialogueBox handles it via window listener IF we add it.
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [sceneIndex, skipToHestia, skipToEnd]);

    /* ---------- Aftermath auto-sequencer ---------- */
    useEffect(() => {
        if (scene !== SCENES.AFTERMATH) return;
        const ctx = ensureAudio();

        if (aftermathPhase === 0) {
            playSiren(ctx, 6);
            playRinging(ctx, 7);
            playCrowdMurmur(ctx, 5);
            const t = setTimeout(() => setAftermathPhase(1), 3000);
            return () => clearTimeout(t);
        }
        if (aftermathPhase === 1) {
            const t = setTimeout(() => setAftermathPhase(2), 3000);
            return () => clearTimeout(t);
        }
        if (aftermathPhase === 2) {
            const t = setTimeout(() => goToScene(), 2000);
            return () => clearTimeout(t);
        }
    }, [scene, aftermathPhase, ensureAudio, goToScene]);

    /* ---------- Void auto-sequencer ---------- */
    useEffect(() => {
        if (scene !== SCENES.VOID) return;
        if (voidPhase === 0) {
            const t = setTimeout(() => setVoidPhase(1), 2500);
            return () => clearTimeout(t);
        }
        if (voidPhase === 1) {
            const t = setTimeout(() => setVoidPhase(2), 2500);
            return () => clearTimeout(t);
        }
    }, [scene, voidPhase]);

    /* ---------- Accident sequencer (video-based) ---------- */
    const truckVideoRef = useRef(null);

    useEffect(() => {
        if (scene !== SCENES.ACCIDENT) return;
        const vid = truckVideoRef.current;
        if (vid && accidentPhase === 0) {
            vid.currentTime = 0;
            vid.playbackRate = 1.0;
            vid.play().catch(() => { });

            // Stop at 3 seconds
            const onTime = () => {
                if (vid.currentTime >= 3) {
                    vid.pause();
                    vid.removeEventListener('timeupdate', onTime);
                    handleTruckVideoEnd();
                }
            };
            vid.addEventListener('timeupdate', onTime);
            return () => vid.removeEventListener('timeupdate', onTime);
        }
    }, [scene, accidentPhase]);

    // When video hits 3s, trigger crash + flash + move on
    const handleTruckVideoEnd = useCallback(() => {
        const ctx = ensureAudio();
        playCrashSound(ctx);
        setAccidentPhase(1); // impact shake
        setTimeout(() => {
            setAccidentPhase(2); // white flash
            setTimeout(() => goToScene(), 600);
        }, 500);
    }, [ensureAudio, goToScene]);

    /* ---------- Phone ring sound ---------- */
    useEffect(() => {
        if (scene !== SCENES.PHONE_CALL) return;
        const ctx = ensureAudio();
        playPhoneRing(ctx);
        const t = setTimeout(() => playPhoneRing(ctx), 1000);
        return () => clearTimeout(t);
    }, [scene, ensureAudio]);

    /* ---------- Ambient for hangout ---------- */
    useEffect(() => {
        if (scene === SCENES.HANGOUT) {
            const ctx = ensureAudio();
            playAmbient(ctx, 30);
        }
    }, [scene, ensureAudio]);

    /* ============================================================
       SCENE RENDERERS
       ============================================================ */

    // ---- Scene 1: Hangout ----
    const renderHangout = () => {
        const showTalking = friendTalking && spriteFrame;
        return (
            <div className="story-scene scene-hangout">
                {/* Real background */}
                <div className="scene-bg-img">
                    <img src="/assets/images/story/conveni.jpeg" alt="Convenience store" className="bg-image" />
                </div>
                <div className="scene-bg-overlay" />
                <div className="scene-vignette" />

                {/* Friend character with sprite switching */}
                <div className="sprite-character friend-sprite-pos">
                    <CharacterSprite
                        src={showTalking ? '/assets/characters/friend/talk.png' : '/assets/characters/friend/neutral.png'}
                        className="character-sprite"
                        width={800}
                        skipTransparency={true}
                    />
                </div>

                <DialogueBox
                    lines={[
                        { speaker: 'Friend', text: "Hey, it's getting late.", color: '#8fdb8f' },
                        { speaker: playerName, text: "Yeah, I should head back.", color: '#e895b3' },
                        { speaker: 'Friend', text: "Be safe out there.", color: '#8fdb8f' },
                        { speaker: playerName, text: "Always am.", color: '#e895b3' },
                    ]}
                    onComplete={() => goToScene()}
                    onSpeakerChange={handleFriendSpeaker}
                />
            </div>
        );
    };

    // ---- Scene 2: Phone Call ----
    const renderPhoneCall = () => (
        <div className="story-scene scene-phone">
            <div className="scene-bg-img">
                <img src="/assets/images/story/street.jpeg" alt="Night street" className="bg-image phone-bg-blur" />
            </div>
            <div className="scene-bg-overlay dark-overlay" />
            <div className="scene-vignette" />

            {/* Phone screen glow */}
            <div className="phone-screen-glow" />

            {/* Incoming call UI */}
            <div className="phone-call-card">
                {/* Animated pulse rings */}
                <div className="call-pulse-ring ring-1" />
                <div className="call-pulse-ring ring-2" />
                <div className="call-pulse-ring ring-3" />

                {/* Caller avatar */}
                <div className="caller-avatar">
                    <span className="caller-avatar-icon">👤</span>
                </div>

                {/* Caller info */}
                <div className="caller-info">
                    <span className="caller-label">Incoming Call</span>
                    <span className="caller-name">Unknown</span>
                    <span className="caller-number">Mobile • 0:00</span>
                </div>

                {/* Call action buttons */}
                <div className="call-actions">
                    <div className="call-btn decline-btn">
                        <span>✕</span>
                    </div>
                    <div className="call-btn accept-btn">
                        <span>📞</span>
                    </div>
                </div>

                {/* Slide to answer hint */}
                <div className="slide-hint">tap to continue</div>
            </div>

            <DialogueBox
                lines={[
                    { speaker: playerName, text: "Hello?", color: '#e895b3' },
                    { speaker: '???', text: "Where are you? Come home.", color: '#b8b8b8' },
                    { speaker: playerName, text: "Yeah… I'm coming home.", color: '#e895b3' },
                ]}
                onComplete={() => goToScene()}
            />
        </div>
    );

    // ---- Scene 3: Walking (brief pause, then truck) ----
    useEffect(() => {
        if (scene !== SCENES.WALKING) return;
        const t = setTimeout(() => goToScene(), 1000);
        return () => clearTimeout(t);
    }, [scene, goToScene]);

    const renderWalking = () => (
        <div className="story-scene scene-walking">
            <div className="scene-bg-img">
                <img src="/assets/images/story/street.jpeg" alt="Dark street" className="bg-image walking-pan" />
            </div>
            <div className="scene-bg-overlay darker-overlay" />
            <div className="scene-vignette" style={{ opacity: 0.85 }} />
        </div>
    );

    // ---- Scene 4: Accident (Video) ----
    const renderAccident = () => (
        <div className={`story-scene scene-accident ${accidentPhase >= 1 ? 'impact' : ''} ${accidentPhase >= 2 ? 'flash-white' : ''}`}>
            {/* Full-screen truck video */}
            <video
                ref={truckVideoRef}
                src="/assets/videos/story/truck.mp4"
                className="truck-video"
                muted
                playsInline
            />

            {/* Dialogue text above the video */}
            {accidentPhase === 0 && (
                <div className="accident-dialogue-top">
                    <DialogueBox
                        lines={[
                            { speaker: playerName, text: "Ahhh...!!!", color: '#e895b3' },
                        ]}
                        onComplete={() => { }}
                    />
                </div>
            )}

            {accidentPhase >= 1 && <div className="motion-blur-overlay" />}
        </div>
    );

    // ---- Scene 5: Aftermath (ENHANCED) ----
    const renderAftermath = () => (
        <div className={`story-scene scene-aftermath phase-${aftermathPhase}`}>
            <div className="aftermath-black" />

            {/* Ambulance siren lights */}
            <div className={`siren-light siren-red ${aftermathPhase < 2 ? 'active' : ''}`} />
            <div className={`siren-light siren-blue ${aftermathPhase < 2 ? 'active' : ''}`} />

            {aftermathPhase === 0 && (
                <div className="aftermath-text visible">
                    <p>…</p>
                </div>
            )}
            {aftermathPhase === 1 && (
                <div className="aftermath-text ringing-text visible">
                    <p style={{ opacity: 0.3, fontSize: '0.8rem' }}>eeeeeeeeeeee…</p>
                </div>
            )}
        </div>
    );

    // ---- Scene 6: Void ----
    const renderVoid = () => (
        <div className={`story-scene scene-void phase-${voidPhase}`}>
            {/* Transition from black → Hestia BG fading in */}
            <div className="void-bg" />
            <div className={`hestia-bg-fadein ${voidPhase >= 1 ? 'visible' : ''}`}>
                <img src="/assets/images/story/hestia_bg.jpeg" alt="" className="bg-image" style={{ opacity: 0.3 }} />
            </div>
            <canvas className="void-particles" id="void-particles" />
            {voidPhase >= 1 && <div className="void-glow" />}
            {voidPhase >= 2 && (
                <DialogueBox
                    lines={[
                        { text: "Where… am I?", color: '#e895b3' },
                    ]}
                    onComplete={() => goToScene()}
                />
            )}
        </div>
    );

    // ---- Scene 7: Hestia ----
    const renderHestia = () => {
        const showTalking = hestiaTalking && spriteFrame;
        return (
            <div className={`story-scene scene-hestia phase-${hestiaPhase}`}>
                {/* Hestia background */}
                <div className="scene-bg-img">
                    <img src="/assets/images/story/hestia_bg.jpeg" alt="Divine realm" className="bg-image" />
                </div>
                <div className="hestia-divine-glow" />

                {/* Hestia character with sprite switching */}
                <div className="hestia-character-sprite">
                    <div className="hestia-aura-glow" />
                    <CharacterSprite
                        src={showTalking ? '/assets/characters/hestia/talk.png' : '/assets/characters/hestia/neutral.png'}
                        className="character-sprite hestia-sprite"
                        width={720}
                        skipTransparency={true}
                    />
                </div>

                <DialogueBox
                    lines={[
                        { speaker: 'Hestia', text: "Easy now…", color: '#f5b848' },
                        { speaker: 'Hestia', text: "You are safe.", color: '#f5b848' },
                        { speaker: 'Hestia', text: "Do not be afraid.", color: '#f5b848' },
                        { speaker: playerName, text: "What… what happened? Where am I?", color: '#e895b3' },
                        { speaker: 'Hestia', text: "You have crossed a threshold few ever reach.", color: '#f5b848' },
                        { speaker: 'Hestia', text: "But your story… is far from over.", color: '#f5b848' },
                    ]}
                    onComplete={skipToEnd}
                    onSpeakerChange={handleHestiaSpeaker}
                />
            </div>
        );
    };

    // Void particle canvas
    useEffect(() => {
        if (scene !== SCENES.VOID) return;
        const canvas = document.getElementById('void-particles');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.5 + 0.5,
                dx: (Math.random() - 0.5) * 0.3,
                dy: (Math.random() - 0.5) * 0.3,
                o: Math.random() * 0.4 + 0.1,
            });
        }

        let raf;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.dx;
                p.y += p.dy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(245, 184, 72, ${p.o})`;
                ctx.fill();
            });
            raf = requestAnimationFrame(draw);
        }
        draw();
        return () => cancelAnimationFrame(raf);
    }, [scene]);

    const renderScene = () => {
        switch (scene) {
            case SCENES.HANGOUT: return renderHangout();
            case SCENES.PHONE_CALL: return renderPhoneCall();
            case SCENES.WALKING: return renderWalking();
            case SCENES.ACCIDENT: return renderAccident();
            case SCENES.AFTERMATH: return renderAftermath();
            case SCENES.VOID: return renderVoid();
            case SCENES.HESTIA: return renderHestia();
            default: return null;
        }
    };

    return (
        <div className="story-container">
            {showGrain && <div className="film-grain" />}

            {/* Final transition overlay */}
            <div className={`transition-finish ${isEnding ? 'active' : ''}`} />

            {renderScene()}
        </div>
    );
}
