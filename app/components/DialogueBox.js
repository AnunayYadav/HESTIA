'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function DialogueBox({ 
    lines, 
    onComplete, 
    speakerColor = '#e0dcd4', 
    autoAdvance = false, 
    autoDelay = 2000,
    onSpeakerChange = null,  // callback(speaker, isTyping) — for sprite switching
}) {
    const [currentLine, setCurrentLine] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [showIndicator, setShowIndicator] = useState(false);
    const typeIntervalRef = useRef(null);
    const autoTimerRef = useRef(null);

    const line = lines[currentLine];
    const fullText = typeof line === 'string' ? line : line?.text || '';
    const speaker = typeof line === 'string' ? null : line?.speaker || null;
    const color = typeof line === 'string' ? speakerColor : line?.color || speakerColor;

    // Notify parent about speaker changes for sprite animation
    useEffect(() => {
        if (onSpeakerChange) {
            onSpeakerChange(speaker, isTyping);
        }
    }, [speaker, isTyping, onSpeakerChange]);

    // Typewriter effect
    useEffect(() => {
        setDisplayedText('');
        setIsTyping(true);
        setShowIndicator(false);
        let i = 0;

        typeIntervalRef.current = setInterval(() => {
            i++;
            setDisplayedText(fullText.slice(0, i));
            if (i >= fullText.length) {
                clearInterval(typeIntervalRef.current);
                setIsTyping(false);
                setShowIndicator(true);
            }
        }, 20); // 20ms as requested

        return () => clearInterval(typeIntervalRef.current);
    }, [currentLine, fullText]);

    const advance = useCallback(() => {
        if (isTyping) {
            clearInterval(typeIntervalRef.current);
            setDisplayedText(fullText);
            setIsTyping(false);
            setShowIndicator(true);
            return;
        }

        if (currentLine < lines.length - 1) {
            setCurrentLine(prev => prev + 1);
        } else {
            if (onComplete) onComplete();
        }
    }, [isTyping, currentLine, lines.length, fullText, onComplete]);

    // Auto-advance support
    useEffect(() => {
        if (autoAdvance && !isTyping) {
            autoTimerRef.current = setTimeout(() => {
                advance();
            }, autoDelay);
            return () => clearTimeout(autoTimerRef.current);
        }
    }, [isTyping, autoAdvance, autoDelay, advance]);

    // Space key listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                advance();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [advance]);

    const handleClick = () => {
        advance();
    };

    return (
        <div className="dialogue-box-wrapper" onClick={handleClick}>
            {speaker && (
                <div className="name-tag">
                    {speaker}
                </div>
            )}
            
            <div className="dialogue-box">
                <div className="dialogue-text">
                    {displayedText}
                    <span className={`dialogue-cursor ${isTyping ? 'typing' : 'blink'}`}>|</span>
                </div>
                
                {showIndicator && !autoAdvance && (
                    <div className="next-indicator">▶</div>
                )}
            </div>
            
            <div className="controls-hint">Click or Space to Continue • ESC to Skip</div>
        </div>
    );
}
