import React, { useRef, useEffect } from 'react';
import { GameState, CellType, Direction, GhostState } from '../types/game.ts';
import { GAME_CONFIG } from '../config/gameConfig.ts';

interface GameRendererProps {
  gameState: GameState;
  className?: string;
}

/**
 * Canvas-based game renderer with retro CRT effects and AI visualizations
 */
export const GameRenderer: React.FC<GameRendererProps> = ({ gameState, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = GAME_CONFIG.MAZE_WIDTH * GAME_CONFIG.CELL_SIZE;
    canvas.height = GAME_CONFIG.MAZE_HEIGHT * GAME_CONFIG.CELL_SIZE;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render maze
      renderMaze(ctx, gameState.maze);

      // Render AI features if enabled
      if (gameState.showAIFeatures) {
        renderDangerHeatmap(ctx, gameState.dangerMap);
        renderGhostPredictions(ctx, gameState.ghosts);
        renderSafeZones(ctx, gameState);
      }

      // Render game entities
      renderPacMan(ctx, gameState.pacman);
      renderGhosts(ctx, gameState.ghosts);
      renderFruit(ctx, gameState.fruitPosition, gameState.level);

      // Render effects
      if (gameState.powerPelletActive) {
        renderPowerPelletEffect(ctx);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      className={`${className} ${gameState.screenShake ? 'screen-shake' : ''} ${gameState.vhsGlitch ? 'vhs-glitch' : ''}`}
      style={{
        imageRendering: 'pixelated',
        filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.3))'
      }}
    />
  );
};

/**
 * Render the maze walls, pellets, and power pellets
 */
function renderMaze(ctx: CanvasRenderingContext2D, maze: CellType[][]): void {
  const cellSize = GAME_CONFIG.CELL_SIZE;

  maze.forEach((row, y) => {
    row.forEach((cell, x) => {
      const pixelX = x * cellSize;
      const pixelY = y * cellSize;

      switch (cell) {
        case CellType.WALL:
          // Neon blue walls with glow effect
          ctx.fillStyle = '#0066ff';
          ctx.shadowColor = '#00aaff';
          ctx.shadowBlur = 8;
          ctx.fillRect(pixelX + 2, pixelY + 2, cellSize - 4, cellSize - 4);
          ctx.shadowBlur = 0;
          break;

        case CellType.PELLET:
          // Small yellow pellets
          ctx.fillStyle = '#ffff00';
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(pixelX + cellSize / 2, pixelY + cellSize / 2, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          break;

        case CellType.POWER_PELLET:
          // Large pulsing power pellets
          const pulseSize = 6 + Math.sin(Date.now() / 200) * 2;
          ctx.fillStyle = '#ffff00';
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(pixelX + cellSize / 2, pixelY + cellSize / 2, pulseSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          break;

        case CellType.GHOST_HOUSE:
          // Ghost house area
          ctx.fillStyle = '#333333';
          ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
          break;
      }
    });
  });
}

/**
 * Render danger heatmap overlay
 */
function renderDangerHeatmap(ctx: CanvasRenderingContext2D, dangerMap: number[][]): void {
  if (!dangerMap.length) return;

  const cellSize = GAME_CONFIG.CELL_SIZE;

  dangerMap.forEach((row, y) => {
    row.forEach((danger, x) => {
      if (danger <= 0) return;

      const pixelX = x * cellSize;
      const pixelY = y * cellSize;
      
      // Color from green (safe) to red (dangerous)
      const red = Math.floor(255 * danger);
      const green = Math.floor(255 * (1 - danger));
      
      ctx.fillStyle = `rgba(${red}, ${green}, 0, ${0.3 * danger})`;
      ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
    });
  });
}

/**
 * Render ghost movement predictions
 */
function renderGhostPredictions(ctx: CanvasRenderingContext2D, ghosts: any[]): void {
  const cellSize = GAME_CONFIG.CELL_SIZE;

  ghosts.forEach(ghost => {
    if (!ghost.pathPrediction || ghost.pathPrediction.length === 0) return;

    ctx.strokeStyle = ghost.color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(
      ghost.position.x * cellSize + cellSize / 2,
      ghost.position.y * cellSize + cellSize / 2
    );

    ghost.pathPrediction.forEach((pos: any, index: number) => {
      const alpha = 0.8 - (index * 0.15);
      ctx.globalAlpha = Math.max(alpha, 0.2);
      
      ctx.lineTo(
        pos.x * cellSize + cellSize / 2,
        pos.y * cellSize + cellSize / 2
      );
    });

    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  });
}

/**
 * Render safe zones and escape routes
 */
function renderSafeZones(ctx: CanvasRenderingContext2D, gameState: GameState): void {
  // This would render safe zones if we had them in the game state
  // For now, we'll skip this to keep the implementation focused
}

/**
 * Render Pac-Man with animated mouth and directional sprites
 */
function renderPacMan(ctx: CanvasRenderingContext2D, pacman: any): void {
  const cellSize = GAME_CONFIG.CELL_SIZE;
  const centerX = pacman.position.x + cellSize / 2;
  const centerY = pacman.position.y + cellSize / 2;
  const radius = cellSize / 2 - 2;

  if (pacman.isDead) {
    // Death animation - spinning circle collapse
    const deathFrame = Math.floor(Date.now() / 100) % 8;
    const deathRadius = radius * (1 - deathFrame / 8);
    
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(deathRadius, 0), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    return;
  }

  // Calculate mouth angle based on direction
  let startAngle = 0;
  let endAngle = Math.PI * 2;

  if (pacman.mouthOpen) {
    const mouthSize = Math.PI / 3;
    switch (pacman.direction) {
      case Direction.RIGHT:
        startAngle = mouthSize / 2;
        endAngle = Math.PI * 2 - mouthSize / 2;
        break;
      case Direction.LEFT:
        startAngle = Math.PI - mouthSize / 2;
        endAngle = Math.PI + mouthSize / 2;
        break;
      case Direction.UP:
        startAngle = Math.PI * 1.5 - mouthSize / 2;
        endAngle = Math.PI * 1.5 + mouthSize / 2;
        break;
      case Direction.DOWN:
        startAngle = Math.PI * 0.5 - mouthSize / 2;
        endAngle = Math.PI * 0.5 + mouthSize / 2;
        break;
    }
  }

  // Draw Pac-Man with glow effect
  ctx.fillStyle = '#ffff00';
  ctx.shadowColor = '#ffff00';
  ctx.shadowBlur = 12;
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  if (pacman.mouthOpen && pacman.direction !== Direction.NONE) {
    ctx.lineTo(centerX, centerY);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Add eye
  if (!pacman.mouthOpen || pacman.direction === Direction.NONE) {
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 5, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Render ghosts with animated sprites and state-based colors
 */
function renderGhosts(ctx: CanvasRenderingContext2D, ghosts: any[]): void {
  const cellSize = GAME_CONFIG.CELL_SIZE;

  ghosts.forEach(ghost => {
    const centerX = ghost.position.x + cellSize / 2;
    const centerY = ghost.position.y + cellSize / 2;
    const radius = cellSize / 2 - 2;

    let fillColor = ghost.color;
    let shadowColor = ghost.color;

    // Handle different ghost states
    if (ghost.state === GhostState.FRIGHTENED) {
      fillColor = ghost.isFlashing ? '#ffffff' : '#0066ff';
      shadowColor = '#0066ff';
    } else if (ghost.state === GhostState.EATEN) {
      fillColor = 'transparent';
      shadowColor = 'transparent';
    }

    if (ghost.state !== GhostState.EATEN) {
      // Draw ghost body
      ctx.fillStyle = fillColor;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 8;

      // Ghost body (rounded top, wavy bottom)
      ctx.beginPath();
      ctx.arc(centerX, centerY - 2, radius, Math.PI, 0);
      
      // Wavy bottom
      const waveOffset = Math.sin(Date.now() / 200 + ghost.position.x) * 2;
      ctx.lineTo(centerX + radius, centerY + radius - 2);
      ctx.lineTo(centerX + radius - 4, centerY + radius - 2 + waveOffset);
      ctx.lineTo(centerX + 4, centerY + radius - 2 - waveOffset);
      ctx.lineTo(centerX, centerY + radius - 2 + waveOffset);
      ctx.lineTo(centerX - 4, centerY + radius - 2 - waveOffset);
      ctx.lineTo(centerX - radius + 4, centerY + radius - 2 + waveOffset);
      ctx.lineTo(centerX - radius, centerY + radius - 2);
      
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX - 6, centerY - 4, 3, 0, Math.PI * 2);
      ctx.arc(centerX + 6, centerY - 4, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw pupils based on direction
      ctx.fillStyle = '#000000';
      let pupilOffsetX = 0;
      let pupilOffsetY = 0;

      switch (ghost.direction) {
        case Direction.LEFT:
          pupilOffsetX = -1;
          break;
        case Direction.RIGHT:
          pupilOffsetX = 1;
          break;
        case Direction.UP:
          pupilOffsetY = -1;
          break;
        case Direction.DOWN:
          pupilOffsetY = 1;
          break;
      }

      ctx.beginPath();
      ctx.arc(centerX - 6 + pupilOffsetX, centerY - 4 + pupilOffsetY, 1.5, 0, Math.PI * 2);
      ctx.arc(centerX + 6 + pupilOffsetX, centerY - 4 + pupilOffsetY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw eyes only for eaten ghosts
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(centerX - 6, centerY - 4, 4, 0, Math.PI * 2);
      ctx.arc(centerX + 6, centerY - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#0066ff';
      ctx.beginPath();
      ctx.arc(centerX - 6, centerY - 4, 2, 0, Math.PI * 2);
      ctx.arc(centerX + 6, centerY - 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/**
 * Render fruit bonus items
 */
function renderFruit(ctx: CanvasRenderingContext2D, fruitPosition: any, level: number): void {
  if (!fruitPosition) return;

  const cellSize = GAME_CONFIG.CELL_SIZE;
  const centerX = fruitPosition.x * cellSize + cellSize / 2;
  const centerY = fruitPosition.y * cellSize + cellSize / 2;

  // Different fruit sprites based on level
  const fruitColors = ['#ff0000', '#ffaa00', '#ff6600', '#aa00ff', '#00ff00', '#ff00aa', '#00aaff', '#ffff00'];
  const color = fruitColors[Math.min(level - 1, 7)];

  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  // Simple fruit representation
  ctx.beginPath();
  ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
  ctx.fill();

  // Add sparkle effect
  const sparkleOffset = Math.sin(Date.now() / 150) * 3;
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(centerX - 3 + sparkleOffset, centerY - 3, 1, 0, Math.PI * 2);
  ctx.arc(centerX + 3 - sparkleOffset, centerY + 3, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

/**
 * Render power pellet screen effect
 */
function renderPowerPelletEffect(ctx: CanvasRenderingContext2D): void {
  const canvas = ctx.canvas;
  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width / 2
  );
  
  gradient.addColorStop(0, 'rgba(255, 255, 0, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}