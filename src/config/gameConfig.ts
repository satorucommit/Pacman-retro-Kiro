import { GameConfig, CellType } from '../types/game';

export const GAME_CONFIG: GameConfig = {
  MAZE_WIDTH: 19,
  MAZE_HEIGHT: 21,
  CELL_SIZE: 24,
  PACMAN_SPEED: 2,
  GHOST_SPEED: 1.8,
  FRIGHTENED_SPEED: 1.2,
  POWER_PELLET_DURATION: 360, // 6 seconds at 60fps
  GHOST_FLASH_DURATION: 120,  // 2 seconds at 60fps
  POINTS_PELLET: 10,
  POINTS_POWER_PELLET: 50,
  POINTS_GHOST_BASE: 200,
  POINTS_FRUIT: [100, 300, 500, 700, 1000, 2000, 3000, 5000],
  FPS: 60,
  AI_PREDICTION_STEPS: 5,
  AI_PATTERN_MEMORY: 20
};

// Classic Pac-Man maze layout
export const MAZE_LAYOUT: CellType[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,1,2,1,1,1,1,1,1,1,2,1,1,1,3,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,2,1,1,1,2,1,2,1,1,1,2,1],
  [1,2,2,2,2,2,1,2,2,1,2,2,1,2,2,2,2,2,1],
  [1,1,1,1,1,2,1,1,0,1,0,1,1,2,1,1,1,1,1],
  [0,0,0,0,1,2,1,0,0,0,0,0,1,2,1,0,0,0,0],
  [1,1,1,1,1,2,1,0,4,4,4,0,1,2,1,1,1,1,1],
  [5,0,0,0,0,2,0,0,4,4,4,0,0,2,0,0,0,0,5],
  [1,1,1,1,1,2,1,0,4,4,4,0,1,2,1,1,1,1,1],
  [0,0,0,0,1,2,1,0,0,0,0,0,1,2,1,0,0,0,0],
  [1,1,1,1,1,2,1,1,0,1,0,1,1,2,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,1,1,1,1,1,1,2,1,1,1,2,1],
  [1,3,2,2,1,2,2,2,2,2,2,2,2,2,1,2,2,3,1],
  [1,1,1,2,1,2,1,2,1,1,1,2,1,2,1,2,1,1,1],
  [1,2,2,2,2,2,1,2,2,1,2,2,1,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Ghost spawn positions and scatter targets
export const GHOST_CONFIG = {
  BLINKY: {
    startPosition: { x: 9, y: 9 },
    scatterTarget: { x: 17, y: 0 },
    color: '#ff0000'
  },
  PINKY: {
    startPosition: { x: 9, y: 10 },
    scatterTarget: { x: 2, y: 0 },
    color: '#ffb8ff'
  },
  INKY: {
    startPosition: { x: 8, y: 10 },
    scatterTarget: { x: 17, y: 20 },
    color: '#00ffff'
  },
  CLYDE: {
    startPosition: { x: 10, y: 10 },
    scatterTarget: { x: 0, y: 20 },
    color: '#ffb852'
  }
};

// Pac-Man starting position
export const PACMAN_START_POSITION = { x: 9, y: 15 };

// Sound effect configurations
export const SOUND_CONFIG = {
  CHOMP: { volume: 0.3 },
  POWER_PELLET: { volume: 0.4 },
  GHOST_EATEN: { volume: 0.5 },
  DEATH: { volume: 0.6 },
  FRUIT: { volume: 0.4 },
  SIREN: { volume: 0.2 },
  FRIGHTENED: { volume: 0.3 }
};

// AI configuration
export const AI_CONFIG = {
  DANGER_RADIUS: 3,
  SAFE_DISTANCE: 5,
  PREDICTION_WEIGHT: 0.7,
  PATTERN_THRESHOLD: 0.6,
  LEARNING_RATE: 0.1,
  MAX_LEARNING_LEVEL: 100
};