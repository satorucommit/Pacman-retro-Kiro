import React from 'react';
import { GameState, Direction } from '../types/game';

interface GameUIProps {
  gameState: GameState;
  onToggleAI: () => void;
  suggestedDirection?: Direction;
}

/**
 * Game UI component displaying score, lives, AI features, and game status
 */
export const GameUI: React.FC<GameUIProps> = ({ 
  gameState, 
  onToggleAI, 
  suggestedDirection 
}) => {
  return (
    <div className="game-ui">
      {/* Main HUD */}
      <div className="hud-container">
        <ScoreDisplay gameState={gameState} />
        <LivesDisplay lives={gameState.lives} />
        <LevelDisplay level={gameState.level} />
        <FruitDisplay gameState={gameState} />
      </div>

      {/* AI Features Panel */}
      {gameState.showAIFeatures && (
        <AIFeaturesPanel 
          gameState={gameState} 
          suggestedDirection={suggestedDirection}
        />
      )}

      {/* Game Status Overlay */}
      <GameStatusOverlay gameState={gameState} />

      {/* AI Toggle Button */}
      <AIToggleButton 
        showAI={gameState.showAIFeatures} 
        onToggle={onToggleAI} 
      />

      {/* Mobile Controls */}
      <MobileControls />
    </div>
  );
};

/**
 * Score display with retro styling
 */
const ScoreDisplay: React.FC<{ gameState: GameState }> = ({ gameState }) => (
  <div className="score-display">
    <div className="score-item">
      <span className="label neon-blue font-arcade">SCORE</span>
      <span className="value neon-yellow font-arcade rgb-separation" data-text={gameState.score.toLocaleString()}>
        {gameState.score.toLocaleString()}
      </span>
    </div>
    <div className="score-item">
      <span className="label neon-blue font-arcade">HIGH</span>
      <span className="value neon-yellow font-arcade">
        {gameState.highScore.toLocaleString()}
      </span>
    </div>
  </div>
);

/**
 * Lives display with Pac-Man icons
 */
const LivesDisplay: React.FC<{ lives: number }> = ({ lives }) => (
  <div className="lives-display">
    <span className="label neon-blue font-arcade">LIVES</span>
    <div className="lives-icons">
      {Array.from({ length: Math.max(0, lives) }, (_, i) => (
        <div key={i} className="life-icon neon-yellow">
          ●
        </div>
      ))}
    </div>
  </div>
);

/**
 * Level display
 */
const LevelDisplay: React.FC<{ level: number }> = ({ level }) => (
  <div className="level-display">
    <span className="label neon-blue font-arcade">LEVEL</span>
    <span className="value neon-yellow font-arcade">{level}</span>
  </div>
);

/**
 * Fruit bonus display
 */
const FruitDisplay: React.FC<{ gameState: GameState }> = ({ gameState }) => (
  <div className="fruit-display">
    {gameState.fruitScore > 0 && (
      <div className="fruit-score neon-green font-arcade pulse">
        +{gameState.fruitScore}
      </div>
    )}
    {gameState.fruitPosition && (
      <div className="fruit-indicator neon-red font-arcade pulse">
        FRUIT!
      </div>
    )}
  </div>
);

/**
 * AI Features Panel showing learning level, danger meter, and suggestions
 */
const AIFeaturesPanel: React.FC<{ 
  gameState: GameState; 
  suggestedDirection?: Direction;
}> = ({ gameState, suggestedDirection }) => (
  <div className="ai-panel">
    <div className="ai-header">
      <span className="neon-green font-arcade">AI ASSIST</span>
    </div>
    
    {/* Learning Level Meter */}
    <div className="ai-feature">
      <span className="ai-label font-mono neon-blue">Learning Level</span>
      <div className="progress-bar">
        <div 
          className="progress-fill neon-green"
          style={{ width: `${gameState.aiLearningLevel}%` }}
        />
      </div>
      <span className="ai-value font-mono neon-yellow">
        {Math.round(gameState.aiLearningLevel)}%
      </span>
    </div>

    {/* Danger Meter */}
    <DangerMeter gameState={gameState} />

    {/* Suggested Direction */}
    {suggestedDirection && suggestedDirection !== Direction.NONE && (
      <div className="ai-feature">
        <span className="ai-label font-mono neon-blue">Suggested Move</span>
        <DirectionIndicator direction={suggestedDirection} />
      </div>
    )}

    {/* Player Pattern Analysis */}
    <PatternAnalysis gameState={gameState} />

    {/* Ghost Behavior Indicators */}
    <GhostBehaviorIndicators ghosts={gameState.ghosts} />
  </div>
);

/**
 * Danger meter showing current threat level
 */
const DangerMeter: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  // Calculate current danger level based on ghost proximity
  const dangerLevel = gameState.ghosts.reduce((danger, ghost) => {
    if (ghost.state === 'FRIGHTENED' || ghost.state === 'EATEN') return danger;
    
    // Convert to grid coordinates for distance calculation
    const pacmanGridX = Math.round(gameState.pacman.position.x / 24); // CELL_SIZE = 24
    const pacmanGridY = Math.round(gameState.pacman.position.y / 24);
    const ghostGridX = Math.round(ghost.position.x / 24);
    const ghostGridY = Math.round(ghost.position.y / 24);
    
    const distance = Math.abs(ghostGridX - pacmanGridX) + Math.abs(ghostGridY - pacmanGridY);
    
    if (distance < 5) {
      return Math.max(danger, (5 - distance) / 5);
    }
    return danger;
  }, 0);

  const dangerColor = dangerLevel > 0.7 ? 'neon-red' : 
                     dangerLevel > 0.4 ? '#ffaa00' : 'neon-green';

  return (
    <div className="ai-feature">
      <span className="ai-label font-mono neon-blue">Danger Level</span>
      <div className="danger-meter">
        <div 
          className="danger-fill"
          style={{ 
            width: `${dangerLevel * 100}%`,
            backgroundColor: dangerColor,
            boxShadow: `0 0 10px ${dangerColor}`
          }}
        />
      </div>
      <span className={`ai-value font-mono ${dangerLevel > 0.7 ? 'neon-red' : 'neon-green'}`}>
        {dangerLevel > 0.7 ? 'HIGH' : dangerLevel > 0.4 ? 'MED' : 'LOW'}
      </span>
    </div>
  );
};

/**
 * Direction indicator arrow
 */
const DirectionIndicator: React.FC<{ direction: Direction }> = ({ direction }) => {
  const getArrow = (dir: Direction) => {
    switch (dir) {
      case Direction.UP: return '↑';
      case Direction.DOWN: return '↓';
      case Direction.LEFT: return '←';
      case Direction.RIGHT: return '→';
      default: return '•';
    }
  };

  return (
    <div className="direction-indicator neon-green font-arcade pulse">
      {getArrow(direction)}
    </div>
  );
};

/**
 * Player movement pattern analysis
 */
const PatternAnalysis: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const patterns = gameState.playerPatterns.slice(-10); // Last 10 moves
  
  return (
    <div className="ai-feature">
      <span className="ai-label font-mono neon-blue">Movement Pattern</span>
      <div className="pattern-display">
        {patterns.map((direction, index) => (
          <span 
            key={index} 
            className={`pattern-dot font-mono ${
              index === patterns.length - 1 ? 'neon-yellow' : 'neon-blue'
            }`}
          >
            {direction === Direction.UP ? '↑' :
             direction === Direction.DOWN ? '↓' :
             direction === Direction.LEFT ? '←' :
             direction === Direction.RIGHT ? '→' : '•'}
          </span>
        ))}
      </div>
    </div>
  );
};

/**
 * Ghost behavior indicators
 */
const GhostBehaviorIndicators: React.FC<{ ghosts: any[] }> = ({ ghosts }) => (
  <div className="ai-feature">
    <span className="ai-label font-mono neon-blue">Ghost Status</span>
    <div className="ghost-indicators">
      {ghosts.map(ghost => (
        <div key={ghost.id} className="ghost-indicator">
          <div 
            className="ghost-dot"
            style={{ 
              backgroundColor: ghost.state === 'FRIGHTENED' ? '#0066ff' : ghost.color,
              boxShadow: `0 0 5px ${ghost.state === 'FRIGHTENED' ? '#0066ff' : ghost.color}`
            }}
          />
          <span className="ghost-state font-mono neon-blue">
            {ghost.state === 'CHASE' ? 'HUNT' :
             ghost.state === 'SCATTER' ? 'ROAM' :
             ghost.state === 'FRIGHTENED' ? 'FLEE' :
             ghost.state === 'EATEN' ? 'DEAD' : 'WAIT'}
          </span>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Game status overlay for READY, GAME OVER, etc.
 */
const GameStatusOverlay: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  if (gameState.gameStatus === 'PLAYING') return null;

  const getMessage = () => {
    switch (gameState.gameStatus) {
      case 'READY':
        return 'READY!';
      case 'PAUSED':
        return 'PAUSED';
      case 'GAME_OVER':
        return 'GAME OVER';
      case 'LEVEL_COMPLETE':
        return `LEVEL ${gameState.level - 1} COMPLETE!`;
      default:
        return '';
    }
  };

  return (
    <div className="game-status-overlay">
      <div className="status-message neon-yellow font-arcade rgb-separation pulse" data-text={getMessage()}>
        {getMessage()}
      </div>
      {gameState.gameStatus === 'READY' && (
        <div className="status-subtitle neon-blue font-mono">
          Press SPACE to start
        </div>
      )}
      {gameState.gameStatus === 'GAME_OVER' && (
        <div className="status-subtitle neon-blue font-mono">
          Press R to restart
        </div>
      )}
    </div>
  );
};

/**
 * AI toggle button
 */
const AIToggleButton: React.FC<{ showAI: boolean; onToggle: () => void }> = ({ 
  showAI, 
  onToggle 
}) => (
  <button 
    className={`ai-toggle-btn font-arcade ${showAI ? 'neon-green' : 'neon-red'}`}
    onClick={onToggle}
  >
    AI: {showAI ? 'ON' : 'OFF'}
  </button>
);

/**
 * Mobile touch controls
 */
const MobileControls: React.FC = () => (
  <div className="mobile-controls">
    <div className="joystick">
      <div className="joystick-knob" />
    </div>
    <div className="arcade-button" />
  </div>
);

export default GameUI;