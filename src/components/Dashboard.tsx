import React, { useState, useEffect } from 'react';
import './Dashboard.css';

export type Difficulty = 'easy' | 'normal' | 'hard';

interface DashboardProps {
    onStartGame: (difficulty: Difficulty) => void;
    onToggleAI: (enabled: boolean) => void;
}

/**
 * Premium Dashboard Component - Game Start Screen
 * Features:
 * - Animated Pac-Man logo
 * - Difficulty selection (affects ghost speed)
 * - AI features toggle
 * - High score display from localStorage
 * - Modern glassmorphism design
 */
export const Dashboard: React.FC<DashboardProps> = ({ onStartGame, onToggleAI }) => {
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
    const [aiEnabled, setAiEnabled] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [animatedText, setAnimatedText] = useState('');
    const [highScore, setHighScore] = useState(0);
    const fullText = 'AI-POWERED PAC-MAN';

    // Load high score from localStorage
    useEffect(() => {
        const savedHighScore = localStorage.getItem('pacman_highscore');
        if (savedHighScore) {
            setHighScore(parseInt(savedHighScore, 10));
        }
    }, []);

    // Typewriter effect for title
    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex <= fullText.length) {
                setAnimatedText(fullText.slice(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const handleStartGame = () => {
        onToggleAI(aiEnabled);
        onStartGame(selectedDifficulty);
    };

    const handleAIToggle = () => {
        setAiEnabled(!aiEnabled);
    };

    return (
        <div className="dashboard-container">
            {/* Animated Background */}
            <div className="dashboard-bg">
                <div className="grid-overlay"></div>
                <div className="floating-pellets">
                    {[...Array(10)].map((_, i) => (
                        <div
                            key={i}
                            className="pellet"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-content">
                {/* Title Section */}
                <div className="title-section">
                    <div className="pacman-logo">
                        <div className="pacman-icon"></div>
                        <div className="ghost-icons">
                            <div className="ghost ghost-red"></div>
                            <div className="ghost ghost-pink"></div>
                            <div className="ghost ghost-cyan"></div>
                            <div className="ghost ghost-orange"></div>
                        </div>
                    </div>
                    <h1 className="main-title glitch" data-text={animatedText}>
                        {animatedText}
                        <span className="cursor-blink">_</span>
                    </h1>
                    <p className="subtitle">Enhanced with Artificial Intelligence</p>
                </div>

                {/* Game Options Card */}
                <div className="options-card glass-morphism">
                    {/* Difficulty Selection */}
                    <div className="option-section">
                        <h3 className="option-title">SELECT DIFFICULTY</h3>
                        <div className="difficulty-buttons">
                            {['easy', 'normal', 'hard'].map((diff) => (
                                <button
                                    key={diff}
                                    className={`difficulty-btn ${selectedDifficulty === diff ? 'active' : ''}`}
                                    onClick={() => setSelectedDifficulty(diff as any)}
                                >
                                    <span className="btn-icon">
                                        {diff === 'easy' && '🟢'}
                                        {diff === 'normal' && '🟡'}
                                        {diff === 'hard' && '🔴'}
                                    </span>
                                    <span className="btn-text">{diff.toUpperCase()}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AI Features Toggle */}
                    <div className="option-section">
                        <h3 className="option-title">AI ASSISTANCE</h3>
                        <div className="ai-toggle-container">
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={aiEnabled}
                                    onChange={handleAIToggle}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                            <div className="ai-info">
                                <p className="ai-label">{aiEnabled ? 'ENABLED' : 'DISABLED'}</p>
                                <p className="ai-description">
                                    {aiEnabled
                                        ? '🧠 Predictive paths, danger zones & smart hints'
                                        : 'Classic gameplay experience'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Start Button */}
                    <button className="start-button" onClick={handleStartGame}>
                        <span className="btn-glow"></span>
                        <span className="btn-content">
                            <span className="btn-icon-start">▶</span>
                            START GAME
                        </span>
                    </button>

                    {/* Instructions Button */}
                    <button
                        className="instructions-button"
                        onClick={() => setShowInstructions(!showInstructions)}
                    >
                        {showInstructions ? '✖ CLOSE' : 'ℹ INSTRUCTIONS'}
                    </button>
                </div>

                {/* Instructions Panel */}
                {showInstructions && (
                    <div className="instructions-panel glass-morphism">
                        <div className="instructions-grid">
                            <div className="instruction-item">
                                <div className="instruction-icon">🎮</div>
                                <div className="instruction-content">
                                    <h4>MOVEMENT</h4>
                                    <p>Use <span className="key">←</span> <span className="key">↑</span> <span className="key">↓</span> <span className="key">→</span> or <span className="key">W</span><span className="key">A</span><span className="key">S</span><span className="key">D</span></p>
                                </div>
                            </div>
                            <div className="instruction-item">
                                <div className="instruction-icon">⏯️</div>
                                <div className="instruction-content">
                                    <h4>CONTROLS</h4>
                                    <p><span className="key">SPACE</span> Pause/Resume</p>
                                </div>
                            </div>
                            <div className="instruction-item">
                                <div className="instruction-icon">🔄</div>
                                <div className="instruction-content">
                                    <h4>RESTART</h4>
                                    <p>Press <span className="key">R</span> to restart game</p>
                                </div>
                            </div>
                            <div className="instruction-item">
                                <div className="instruction-icon">🤖</div>
                                <div className="instruction-content">
                                    <h4>AI TOGGLE</h4>
                                    <p>Press <span className="key">H</span> to toggle AI features</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* High Score Display */}
                <div className="high-score-display glass-morphism">
                    <div className="score-label">HIGH SCORE</div>
                    <div className="score-value">{highScore.toString().padStart(5, '0')}</div>
                </div>
            </div>

            {/* Footer */}
            <div className="dashboard-footer">
                <p className="footer-text">
                    Created with ❤️ using React + TypeScript • Enhanced with AI
                </p>
            </div>
        </div>
    );
};
