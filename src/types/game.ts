// Core game types and interfaces

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  dx: number;
  dy: number;
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  NONE = 'NONE'
}

export enum CellType {
  EMPTY = 0,
  WALL = 1,
  PELLET = 2,
  POWER_PELLET = 3,
  GHOST_HOUSE = 4,
  TUNNEL = 5,
  FRUIT = 6
}

export enum GhostState {
  CHASE = 'CHASE',
  SCATTER = 'SCATTER',
  FRIGHTENED = 'FRIGHTENED',
  EATEN = 'EATEN',
  IN_HOUSE = 'IN_HOUSE'
}

export enum GhostType {
  BLINKY = 'BLINKY',
  PINKY = 'PINKY',
  INKY = 'INKY',
  CLYDE = 'CLYDE'
}

export interface Ghost {
  id: GhostType;
  position: Position;
  velocity: Velocity;
  direction: Direction;
  state: GhostState;
  color: string;
  targetPosition: Position;
  scatterTarget: Position;
  houseTimer: number;
  frightenedTimer: number;
  isFlashing: boolean;
  lastDirection: Direction;
  pathPrediction: Position[];
}

export interface PacMan {
  position: Position;
  velocity: Velocity;
  direction: Direction;
  nextDirection: Direction;
  animationFrame: number;
  isDead: boolean;
  mouthOpen: boolean;
}

export interface GameState {
  pacman: PacMan;
  ghosts: Ghost[];
  maze: CellType[][];
  score: number;
  highScore: number;
  lives: number;
  level: number;
  pelletsRemaining: number;
  powerPelletActive: boolean;
  powerPelletTimer: number;
  gameStatus: 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'LEVEL_COMPLETE';
  ghostEatenCount: number;
  fruitSpawned: boolean;
  fruitPosition: Position | null;
  fruitScore: number;
  aiLearningLevel: number;
  showAIFeatures: boolean;
  dangerMap: number[][];
  playerPatterns: Direction[];
  screenShake: boolean;
  vhsGlitch: boolean;
}

export interface AIAnalysis {
  dangerLevel: number;
  suggestedDirection: Direction;
  ghostPredictions: { [key in GhostType]: Position[] };
  safeZones: Position[];
  escapeRoutes: Position[];
  playerTendencies: { [key in Direction]: number };
}

export interface SoundEffect {
  name: string;
  audio: HTMLAudioElement;
  volume: number;
}

export interface GameConfig {
  MAZE_WIDTH: number;
  MAZE_HEIGHT: number;
  CELL_SIZE: number;
  PACMAN_SPEED: number;
  GHOST_SPEED: number;
  FRIGHTENED_SPEED: number;
  POWER_PELLET_DURATION: number;
  GHOST_FLASH_DURATION: number;
  POINTS_PELLET: number;
  POINTS_POWER_PELLET: number;
  POINTS_GHOST_BASE: number;
  POINTS_FRUIT: number[];
  FPS: number;
  AI_PREDICTION_STEPS: number;
  AI_PATTERN_MEMORY: number;
}