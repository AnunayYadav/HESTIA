'use client';

import { useState, useEffect, useCallback } from 'react';
import SplashScreen from './components/SplashScreen';
import MainMenu from './components/MainMenu';
import LoginScreen from './components/LoginScreen';

export default function Home() {
    const [splashDone, setSplashDone] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    // Persist login state
    useEffect(() => {
        const saved = localStorage.getItem('hestia_logged_in');
        if (saved === 'true') {
            setIsLoggedIn(true);
            setMenuVisible(true);
            setSplashDone(true);
        }
    }, []);

    const handleSplashComplete = useCallback(() => {
        console.log('Splash Screen sequence finished. Transitioning to login...');
        setSplashDone(true);
    }, []);

    const handleLogout = useCallback(() => {
        setIsLoggedIn(false);
        localStorage.removeItem('hestia_logged_in');
    }, []);

    const handleLoginSuccess = useCallback(() => {
        setIsLoggedIn(true);
        localStorage.setItem('hestia_logged_in', 'true');
        setTimeout(() => setMenuVisible(true), 100);
    }, []);

    return (
        <main>
            {/* Splash Screen - Only show if not logged in and splash not done */}
            {!splashDone && !isLoggedIn && (
                <SplashScreen onComplete={handleSplashComplete} />
            )}

            {/* Main Menu (Background) - Show after splash or if logged in */}
            {(splashDone || isLoggedIn) && (
                <div className={`main-menu ${isLoggedIn ? 'visible' : 'logged-out'}`}>
                    <MainMenu onLoginSuccess={handleLogout} hideUI={!isLoggedIn} />
                </div>
            )}

            {/* Login Overlay - Show after splash but only if not logged in */}
            {splashDone && !isLoggedIn && (
                <LoginScreen onLoginSuccess={handleLoginSuccess} />
            )}
        </main>
    );
}
