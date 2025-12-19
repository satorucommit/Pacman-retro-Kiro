import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameEngine } from './engine/GameEngine.ts';
import { GameRenderer } from './components/GameRenderer.tsx';
import { GameUI } from './components/GameUI.tsx';
import { Dashboard, Difficulty } from './components/Dashboard.tsx';
import { Direction } from './types/game.ts';
import './App.css';

/**
 * Main App component - AI-Powered Pac-Man Game
 * 
 * Features:
 * - Classic Pac-Man gameplay with modern AI enhancements
 * - Predictive ghost movement visualization
 * - Real-time danger zone heatmap
 * - Adaptive ghost intelligence that learns from player patterns
 * - Authentic 1980s CRT monitor aesthetics
 */
const App: React.FC = () => {
  const gameEngineRef = useRef<GameEngine>(new GameEngine());
  const [gameState, setGameState] = useState(gameEngineRef.current.getGameState());
  const [currentInput, setCurrentInput] = useState<Direction>(Direction.NONE);
  const [suggestedDirection, setSuggestedDirection] = useState<Direction>(Direction.NONE);
  const [showDashboard, setShowDashboard] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);

  /**
   * Main game loop - runs at 60fps
   */
  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastUpdateTimeRef.current;

    // Target 60fps (16.67ms per frame)
    if (deltaTime >= 16.67) {
      const newGameState = gameEngineRef.current.update(currentTime, currentInput);
      setGameState({ ...newGameState });

      // Reset input after processing to allow for new direction changes
      setCurrentInput(Direction.NONE);

      // Get AI suggestion for next move
      if (newGameState.showAIFeatures && newGameState.gameStatus === 'PLAYING') {
        // This would integrate with the AI engine to get suggestions
        // For now, we'll set it to NONE
        setSuggestedDirection(Direction.NONE);
      }

      lastUpdateTimeRef.current = currentTime;
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [currentInput]);

  /**
   * Handle keyboard input - Classic Pac-Man style
   */
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    // Prevent default for game keys
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' ', 'r', 'h'].includes(key)) {
      event.preventDefault();
    }

    switch (key) {
      case 'arrowup':
      case 'w':
        setCurrentInput(Direction.UP);
        break;
      case 'arrowdown':
      case 's':
        setCurrentInput(Direction.DOWN);
        break;
      case 'arrowleft':
      case 'a':
        setCurrentInput(Direction.LEFT);
        break;
      case 'arrowright':
      case 'd':
        setCurrentInput(Direction.RIGHT);
        break;
      case ' ':
        if (gameState.gameStatus === 'READY') {
          gameEngineRef.current.startGame();
        } else if (gameState.gameStatus === 'PLAYING') {
          gameEngineRef.current.pauseGame();
        } else if (gameState.gameStatus === 'PAUSED') {
          gameEngineRef.current.resumeGame();
        }
        break;
      case 'r':
        if (gameState.gameStatus === 'GAME_OVER') {
          gameEngineRef.current.restartGame();
          setGameState(gameEngineRef.current.getGameState());
        }
        break;
      case 'h':
        // Toggle AI features
        gameEngineRef.current.toggleAIFeatures();
        setGameState(gameEngineRef.current.getGameState());
        break;
      case 'escape':
        // Return to dashboard
        if (!showDashboard) {
          // Pause game if playing
          if (gameState.gameStatus === 'PLAYING') {
            gameEngineRef.current.pauseGame();
          }
          // Reset game
          gameEngineRef.current.restartGame();
          setGameState(gameEngineRef.current.getGameState());
          // Show dashboard
          setShowDashboard(true);
        }
        break;
    }
  }, [gameState.gameStatus, showDashboard]);

  /**
   * Handle key release - In classic Pac-Man, we don't need to handle key release
   * The character continues moving until hitting a wall or changing direction
   */
  const handleKeyRelease = useCallback((event: KeyboardEvent) => {
    // No action needed - Pac-Man continues moving in the last direction
  }, []);

  /**
   * Toggle AI features
   */
  const toggleAIFeatures = useCallback(() => {
    gameEngineRef.current.toggleAIFeatures();
  }, []);

  /**
   * Handle start game from dashboard
   */
  const handleStartGame = useCallback((selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setShowDashboard(false);

    // Apply difficulty settings to game engine  
    const difficultyMultiplier = selectedDifficulty === 'easy' ? 0.7 : selectedDifficulty === 'hard' ? 1.4 : 1.0;
    gameEngineRef.current.setDifficulty(difficultyMultiplier);

    gameEngineRef.current.startGame();
    setGameState(gameEngineRef.current.getGameState());
  }, []);

  /**
   * Handle AI toggle from dashboard
   */
  const handleDashboardAIToggle = useCallback((enabled: boolean) => {
    if (enabled !== gameState.showAIFeatures) {
      gameEngineRef.current.toggleAIFeatures();
      setGameState(gameEngineRef.current.getGameState());
    }
  }, [gameState.showAIFeatures]);

  /**
   * Handle return to dashboard
   */
  const handleReturnToDashboard = useCallback(() => {
    // Pause game if playing
    if (gameState.gameStatus === 'PLAYING') {
      gameEngineRef.current.pauseGame();
    }
    // Reset game
    gameEngineRef.current.restartGame();
    setGameState(gameEngineRef.current.getGameState());
    // Show dashboard
    setShowDashboard(true);
  }, [gameState.gameStatus]);

  /**
   * Setup event listeners and game loop
   */
  useEffect(() => {
    // Add keyboard event listeners
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keyup', handleKeyRelease);

    // Start game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('keyup', handleKeyRelease);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleKeyPress, handleKeyRelease, gameLoop]);

  /**
   * Prevent context menu on right click
   */
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', preventContextMenu);
    return () => document.removeEventListener('contextmenu', preventContextMenu);
  }, []);

  return (
    <div className="app">
      {/* Show Dashboard or Game */}
      {showDashboard ? (
        <Dashboard
          onStartGame={handleStartGame}
          onToggleAI={handleDashboardAIToggle}
        />
      ) : (
        <>
          {/* Fullscreen Game Container */}
          <div className="game-fullscreen">
            <div className="game-wrapper">
              {/* CRT Monitor Container */}
              <div className="crt-monitor">
                <div className="crt-screen">
                  {/* Game Container */}
                  <div className="game-container">
                    {/* Arcade Cabinet Frame */}
                    <div className="arcade-cabinet">
                      {/* Game Title */}
                      <div className="game-title">
                        <h1 className="neon-yellow font-arcade rgb-separation" data-text="AI PAC-MAN">
                          AI PAC-MAN
                        </h1>
                        <div className="subtitle neon-blue font-mono">
                          Enhanced with Artificial Intelligence
                        </div>
                      </div>

                      {/* Main Game Area */}
                      <div className="game-area">
                        <GameRenderer
                          gameState={gameState}
                          className="game-canvas phosphor-glow"
                        />

                        {/* Game UI Overlay */}
                        <GameUI
                          gameState={gameState}
                          onToggleAI={toggleAIFeatures}
                          suggestedDirection={suggestedDirection}
                        />
                      </div>

                      {/* Control Instructions */}
                      <div className="controls-info">
                        <div className="control-group">
                          <span className="neon-blue font-mono">MOVE:</span>
                          <span className="neon-yellow font-mono">ARROW KEYS / WASD</span>
                        </div>
                        <div className="control-group">
                          <span className="neon-blue font-mono">START/PAUSE:</span>
                          <span className="neon-yellow font-mono">SPACE</span>
                        </div>
                        <div className="control-group">
                          <span className="neon-blue font-mono">RESTART:</span>
                          <span className="neon-yellow font-mono">R</span>
                        </div>
                        <div className="control-group">
                          <span className="neon-blue font-mono">TOGGLE AI:</span>
                          <span className="neon-yellow font-mono">H</span>
                        </div>
                        <div className="control-group">
                          <span className="neon-blue font-mono">MENU:</span>
                          <span className="neon-yellow font-mono">ESC</span>
                        </div>
                      </div>

                      {/* Back to Menu Button */}
                      <div className="back-to-menu-container">
                        <button className="back-to-menu-btn" onClick={handleReturnToDashboard}>
                          <span className="btn-icon-back">◄</span>
                          BACK TO MENU
                        </button>
                      </div>

                      {/* AI Features Description */}
                      {gameState.showAIFeatures && (
                        <div className="ai-description">
                          <div className="ai-feature-desc">
                            <span className="neon-green font-mono">🔮 PREDICTIVE PATHS:</span>
                            <span className="font-mono">Ghost movement predictions</span>
                          </div>
                          <div className="ai-feature-desc">
                            <span className="neon-green font-mono">🌡️ DANGER ZONES:</span>
                            <span className="font-mono">Real-time threat visualization</span>
                          </div>
                          <div className="ai-feature-desc">
                            <span className="neon-green font-mono">🧠 ADAPTIVE AI:</span>
                            <span className="font-mono">Ghosts learn your patterns</span>
                          </div>
                        </div>
                      )}

                      {/* FPS Counter (optional) */}
                      <div className="fps-counter neon-green font-mono">
                        60 FPS
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background Ambient Effects */}
          <div className="ambient-effects">
            <div className="scan-line" />
            <div className="crt-flicker" />
          </div>
        </>
      )}
    </div>
  );
};

export default App;