import {
  GameState,
  PacMan,
  Ghost,
  Position,
  Direction,
  CellType,
  GhostState,
  GhostType
} from '../types/game';
import {
  GAME_CONFIG,
  MAZE_LAYOUT,
  GHOST_CONFIG,
  PACMAN_START_POSITION
} from '../config/gameConfig';
import { AIEngine } from './AIEngine';

/**
 * Core game engine handling all game logic, physics, and state management
 */
export class GameEngine {
  private aiEngine: AIEngine;
  private gameState: GameState;
  private lastUpdateTime: number = 0;
  private frameCount: number = 0;
  private difficultyMultiplier: number = 1.0;

  constructor() {
    this.aiEngine = new AIEngine();
    this.gameState = this.initializeGameState();
  }

  /**
   * Initialize the game state with default values
   */
  private initializeGameState(): GameState {
    const maze = MAZE_LAYOUT.map(row => [...row]);
    const pelletsRemaining = this.countPellets(maze);

    return {
      pacman: this.createPacMan(),
      ghosts: this.createGhosts(),
      maze,
      score: 0,
      highScore: parseInt(localStorage.getItem('pacman_highscore') || '0'),
      lives: 3,
      level: 1,
      pelletsRemaining,
      powerPelletActive: false,
      powerPelletTimer: 0,
      gameStatus: 'READY',
      ghostEatenCount: 0,
      fruitSpawned: false,
      fruitPosition: null,
      fruitScore: 0,
      aiLearningLevel: 0,
      showAIFeatures: true,
      dangerMap: [],
      playerPatterns: [],
      screenShake: false,
      vhsGlitch: false
    };
  }

  /**
   * Create Pac-Man with initial state
   */
  private createPacMan(): PacMan {
    return {
      position: {
        x: PACMAN_START_POSITION.x * GAME_CONFIG.CELL_SIZE,
        y: PACMAN_START_POSITION.y * GAME_CONFIG.CELL_SIZE
      },
      velocity: { dx: 0, dy: 0 },
      direction: Direction.NONE,
      nextDirection: Direction.NONE,
      animationFrame: 0,
      isDead: false,
      mouthOpen: true
    };
  }

  /**
   * Create all four ghosts with their unique properties
   */
  private createGhosts(): Ghost[] {
    return Object.entries(GHOST_CONFIG).map(([type, config]) => ({
      id: type as GhostType,
      position: {
        x: config.startPosition.x * GAME_CONFIG.CELL_SIZE,
        y: config.startPosition.y * GAME_CONFIG.CELL_SIZE
      },
      velocity: { dx: 0, dy: 0 },
      direction: Direction.UP,
      state: type === 'BLINKY' ? GhostState.CHASE : GhostState.IN_HOUSE,
      color: config.color,
      targetPosition: {
        x: config.scatterTarget.x * GAME_CONFIG.CELL_SIZE,
        y: config.scatterTarget.y * GAME_CONFIG.CELL_SIZE
      },
      scatterTarget: {
        x: config.scatterTarget.x * GAME_CONFIG.CELL_SIZE,
        y: config.scatterTarget.y * GAME_CONFIG.CELL_SIZE
      },
      houseTimer: type === 'BLINKY' ? 0 : 60 + (Object.keys(GHOST_CONFIG).indexOf(type) * 30),
      frightenedTimer: 0,
      isFlashing: false,
      lastDirection: Direction.UP,
      pathPrediction: []
    }));
  }

  /**
   * Main game update loop - called at 60fps
   */
  update(currentTime: number, inputDirection: Direction): GameState {
    // const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;
    this.frameCount++;

    if (this.gameState.gameStatus !== 'PLAYING') {
      return this.gameState;
    }

    // Update Pac-Man
    this.updatePacMan(inputDirection);

    // Update ghosts
    this.updateGhosts();

    // Check collisions
    this.checkCollisions();

    // Update power pellet timer
    this.updatePowerPelletTimer();

    // Update AI analysis
    this.updateAIAnalysis();

    // Check win/lose conditions
    this.checkGameConditions();

    // Update visual effects
    this.updateVisualEffects();

    // Spawn fruit occasionally
    this.updateFruitSpawning();

    return this.gameState;
  }

  /**
   * Update Pac-Man position and animation
   */
  private updatePacMan(inputDirection: Direction): void {
    const pacman = this.gameState.pacman;

    // Handle direction changes
    if (inputDirection !== Direction.NONE) {
      pacman.nextDirection = inputDirection;

      // Record movement for AI learning
      this.aiEngine.recordPlayerMovement(inputDirection);
    }

    // Try to change direction if possible
    if (pacman.nextDirection !== pacman.direction && pacman.nextDirection !== Direction.NONE) {
      const gridX = Math.round(pacman.position.x / GAME_CONFIG.CELL_SIZE);
      const gridY = Math.round(pacman.position.y / GAME_CONFIG.CELL_SIZE);
      const nextGridPos = this.getNextPosition({ x: gridX, y: gridY }, pacman.nextDirection);

      if (this.isValidMove(nextGridPos)) {
        pacman.direction = pacman.nextDirection;
        this.setVelocity(pacman, pacman.direction);
      }
    }

    // Move Pac-Man
    if (pacman.direction !== Direction.NONE) {
      let nextX = pacman.position.x + pacman.velocity.dx;
      let nextY = pacman.position.y + pacman.velocity.dy;

      // Handle tunnel wraparound
      if (nextX < 0) {
        nextX = (GAME_CONFIG.MAZE_WIDTH - 1) * GAME_CONFIG.CELL_SIZE;
      } else if (nextX >= GAME_CONFIG.MAZE_WIDTH * GAME_CONFIG.CELL_SIZE) {
        nextX = 0;
      }

      // Check if move is valid by converting to grid coordinates
      const gridX = Math.round(nextX / GAME_CONFIG.CELL_SIZE);
      const gridY = Math.round(nextY / GAME_CONFIG.CELL_SIZE);

      if (this.isValidMove({ x: gridX, y: gridY })) {
        pacman.position.x = nextX;
        pacman.position.y = nextY;
      } else {
        // Stop if hitting wall
        pacman.direction = Direction.NONE;
        pacman.velocity = { dx: 0, dy: 0 };
      }
    }

    // Update animation
    if (this.frameCount % 8 === 0) {
      pacman.mouthOpen = !pacman.mouthOpen;
      pacman.animationFrame = (pacman.animationFrame + 1) % 4;
    }
  }

  /**
   * Update all ghost positions and AI behavior
   */
  private updateGhosts(): void {
    this.gameState.ghosts.forEach(ghost => {
      this.updateGhostState(ghost);
      this.updateGhostMovement(ghost);
      this.updateGhostAnimation(ghost);
    });
  }

  /**
   * Update individual ghost state and target
   */
  private updateGhostState(ghost: Ghost): void {
    // Handle house timer
    if (ghost.state === GhostState.IN_HOUSE && ghost.houseTimer > 0) {
      ghost.houseTimer--;
      if (ghost.houseTimer <= 0) {
        ghost.state = GhostState.CHASE;
      }
      return;
    }

    // Handle frightened state
    if (ghost.state === GhostState.FRIGHTENED) {
      ghost.frightenedTimer--;

      // Start flashing when timer is low
      if (ghost.frightenedTimer <= GAME_CONFIG.GHOST_FLASH_DURATION) {
        ghost.isFlashing = Math.floor(ghost.frightenedTimer / 10) % 2 === 0;
      }

      if (ghost.frightenedTimer <= 0) {
        ghost.state = GhostState.CHASE;
        ghost.isFlashing = false;
      }
      return;
    }

    // Handle eaten state
    if (ghost.state === GhostState.EATEN) {
      // Return to house
      const housePos = GHOST_CONFIG[ghost.id].startPosition;
      if (ghost.position.x === housePos.x && ghost.position.y === housePos.y) {
        ghost.state = GhostState.CHASE;
      }
      ghost.targetPosition = housePos;
      return;
    }

    // Normal chase/scatter behavior with AI adaptation
    // const baseTarget = this.getGhostTarget(ghost);
    ghost.targetPosition = this.aiEngine.adaptGhostBehavior(
      ghost,
      this.gameState.pacman,
      this.gameState.ghosts
    );

    // Alternate between chase and scatter modes
    const modeTime = Math.floor(this.frameCount / 600); // Change every 10 seconds
    ghost.state = modeTime % 2 === 0 ? GhostState.CHASE : GhostState.SCATTER;
  }

  /**
   * Update ghost movement using pathfinding
   */
  private updateGhostMovement(ghost: Ghost): void {
    if (ghost.state === GhostState.IN_HOUSE) {
      // Simple up-down movement in house
      if (this.frameCount % 60 < 30) {
        ghost.direction = Direction.UP;
      } else {
        ghost.direction = Direction.DOWN;
      }
      this.setGhostVelocity(ghost);
      
      // Move ghost in house
      ghost.position.y += ghost.velocity.dy;
      return;
    }

    // Convert ghost position to grid coordinates for pathfinding
    const gridX = Math.round(ghost.position.x / GAME_CONFIG.CELL_SIZE);
    const gridY = Math.round(ghost.position.y / GAME_CONFIG.CELL_SIZE);
    const gridPos = { x: gridX, y: gridY };

    // Get possible directions (can't reverse unless frightened)
    const possibleDirections = this.getPossibleDirections(gridPos)
      .filter(dir => {
        if (ghost.state === GhostState.FRIGHTENED) return true;
        return this.getOppositeDirection(dir) !== ghost.lastDirection;
      });

    if (possibleDirections.length === 0) return;

    // Choose direction based on target
    let bestDirection = possibleDirections[0];
    let shortestDistance = Infinity;

    if (ghost.state === GhostState.FRIGHTENED) {
      // Random movement when frightened
      bestDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
    } else {
      // Move toward target
      const targetGridX = Math.round(ghost.targetPosition.x / GAME_CONFIG.CELL_SIZE);
      const targetGridY = Math.round(ghost.targetPosition.y / GAME_CONFIG.CELL_SIZE);

      possibleDirections.forEach(direction => {
        const nextPos = this.getNextPosition(gridPos, direction);
        const distance = this.manhattanDistance(nextPos, { x: targetGridX, y: targetGridY });

        if (distance < shortestDistance) {
          shortestDistance = distance;
          bestDirection = direction;
        }
      });
    }

    ghost.lastDirection = ghost.direction;
    ghost.direction = bestDirection;
    this.setGhostVelocity(ghost);

    // Move ghost
    let nextX = ghost.position.x + ghost.velocity.dx;
    let nextY = ghost.position.y + ghost.velocity.dy;

    // Handle tunnel wraparound
    if (nextX < 0) {
      nextX = (GAME_CONFIG.MAZE_WIDTH - 1) * GAME_CONFIG.CELL_SIZE;
    } else if (nextX >= GAME_CONFIG.MAZE_WIDTH * GAME_CONFIG.CELL_SIZE) {
      nextX = 0;
    }

    // Check if move is valid by converting to grid coordinates
    const nextGridX = Math.round(nextX / GAME_CONFIG.CELL_SIZE);
    const nextGridY = Math.round(nextY / GAME_CONFIG.CELL_SIZE);

    if (this.isValidMove({ x: nextGridX, y: nextGridY })) {
      ghost.position.x = nextX;
      ghost.position.y = nextY;
    }
  }

  /**
   * Update ghost animation and visual effects
   */
  private updateGhostAnimation(ghost: Ghost): void {
    // Update path prediction for AI visualization
    if (this.frameCount % 30 === 0) { // Update every half second
      const predictions = this.aiEngine.predictGhostMovements(
        [ghost],
        this.gameState.maze,
        this.gameState.pacman
      );
      ghost.pathPrediction = predictions[ghost.id] || [];
    }
  }

  /**
   * Check collisions between Pac-Man and game elements
   */
  private checkCollisions(): void {
    const pacmanPos = this.gameState.pacman.position;
    const gridX = Math.round(pacmanPos.x / GAME_CONFIG.CELL_SIZE);
    const gridY = Math.round(pacmanPos.y / GAME_CONFIG.CELL_SIZE);

    // Ensure we're within bounds
    if (gridX < 0 || gridX >= GAME_CONFIG.MAZE_WIDTH || gridY < 0 || gridY >= GAME_CONFIG.MAZE_HEIGHT) {
      return;
    }

    const cellType = this.gameState.maze[gridY][gridX];

    // Collect pellets
    if (cellType === CellType.PELLET) {
      this.gameState.maze[gridY][gridX] = CellType.EMPTY;
      this.gameState.score += GAME_CONFIG.POINTS_PELLET;
      this.gameState.pelletsRemaining--;
      this.playSound('CHOMP');
    }

    // Collect power pellets
    if (cellType === CellType.POWER_PELLET) {
      this.gameState.maze[gridY][gridX] = CellType.EMPTY;
      this.gameState.score += GAME_CONFIG.POINTS_POWER_PELLET;
      this.gameState.pelletsRemaining--;
      this.activatePowerPellet();
      this.playSound('POWER_PELLET');
    }

    // Collect fruit
    if (this.gameState.fruitPosition &&
      gridX === this.gameState.fruitPosition.x &&
      gridY === this.gameState.fruitPosition.y) {
      const fruitPoints = GAME_CONFIG.POINTS_FRUIT[Math.min(this.gameState.level - 1, 7)];
      this.gameState.score += fruitPoints;
      this.gameState.fruitScore = fruitPoints;
      this.gameState.fruitPosition = null;
      this.gameState.fruitSpawned = false;
      this.playSound('FRUIT');
    }

    // Check ghost collisions
    this.gameState.ghosts.forEach(ghost => {
      const ghostGridX = Math.round(ghost.position.x / GAME_CONFIG.CELL_SIZE);
      const ghostGridY = Math.round(ghost.position.y / GAME_CONFIG.CELL_SIZE);
      const distance = Math.abs(gridX - ghostGridX) + Math.abs(gridY - ghostGridY);

      if (distance < 1) {
        if (ghost.state === GhostState.FRIGHTENED) {
          // Eat ghost
          ghost.state = GhostState.EATEN;
          const points = GAME_CONFIG.POINTS_GHOST_BASE * Math.pow(2, this.gameState.ghostEatenCount);
          this.gameState.score += points;
          this.gameState.ghostEatenCount++;
          this.gameState.screenShake = true;
          this.playSound('GHOST_EATEN');
        } else if (ghost.state !== GhostState.EATEN) {
          // Pac-Man dies
          this.gameState.pacman.isDead = true;
          this.gameState.lives--;
          this.gameState.screenShake = true;
          this.playSound('DEATH');

          if (this.gameState.lives <= 0) {
            this.gameState.gameStatus = 'GAME_OVER';
          } else {
            // Reset positions
            setTimeout(() => this.resetPositions(), 2000);
          }
        }
      }
    });
  }

  /**
   * Activate power pellet effect
   */
  private activatePowerPellet(): void {
    this.gameState.powerPelletActive = true;
    this.gameState.powerPelletTimer = GAME_CONFIG.POWER_PELLET_DURATION;
    this.gameState.ghostEatenCount = 0;

    // Make ghosts frightened
    this.gameState.ghosts.forEach(ghost => {
      if (ghost.state !== GhostState.EATEN && ghost.state !== GhostState.IN_HOUSE) {
        ghost.state = GhostState.FRIGHTENED;
        ghost.frightenedTimer = GAME_CONFIG.POWER_PELLET_DURATION;
        ghost.isFlashing = false;
        // Reverse direction
        ghost.direction = this.getOppositeDirection(ghost.direction);
      }
    });
  }

  /**
   * Update power pellet timer
   */
  private updatePowerPelletTimer(): void {
    if (this.gameState.powerPelletActive) {
      this.gameState.powerPelletTimer--;
      if (this.gameState.powerPelletTimer <= 0) {
        this.gameState.powerPelletActive = false;
      }
    }
  }

  /**
   * Update AI analysis and danger map
   */
  private updateAIAnalysis(): void {
    if (this.frameCount % 10 === 0) { // Update every 6th of a second
      // const analysis = this.aiEngine.analyzeGameState(
      //   this.gameState.pacman,
      //   this.gameState.ghosts,
      //   this.gameState.maze
      // );

      this.gameState.dangerMap = this.aiEngine.generateDangerHeatmap(
        this.gameState.ghosts,
        this.gameState.maze
      );

      this.gameState.aiLearningLevel = this.aiEngine.getLearningLevel();
      this.gameState.playerPatterns = this.aiEngine.getPlayerPatterns();
    }
  }

  /**
   * Check win/lose conditions
   */
  private checkGameConditions(): void {
    // Check if all pellets collected
    if (this.gameState.pelletsRemaining <= 0) {
      this.gameState.gameStatus = 'LEVEL_COMPLETE';
      this.gameState.level++;

      // Reset maze and positions for next level
      setTimeout(() => {
        this.gameState.maze = MAZE_LAYOUT.map(row => [...row]);
        this.gameState.pelletsRemaining = this.countPellets(this.gameState.maze);
        this.resetPositions();
        this.gameState.gameStatus = 'READY';
      }, 2000);
    }

    // Update high score
    if (this.gameState.score > this.gameState.highScore) {
      this.gameState.highScore = this.gameState.score;
      localStorage.setItem('pacman_highscore', this.gameState.score.toString());
    }
  }

  /**
   * Update visual effects
   */
  private updateVisualEffects(): void {
    // Reset screen shake
    if (this.gameState.screenShake) {
      setTimeout(() => {
        this.gameState.screenShake = false;
      }, 200);
    }

    // Random VHS glitch effect
    if (Math.random() < 0.001) {
      this.gameState.vhsGlitch = true;
      setTimeout(() => {
        this.gameState.vhsGlitch = false;
      }, 100);
    }
  }

  /**
   * Update fruit spawning logic
   */
  private updateFruitSpawning(): void {
    if (!this.gameState.fruitSpawned &&
      this.gameState.pelletsRemaining < this.countPellets(MAZE_LAYOUT) * 0.7) {
      // Spawn fruit when 70% of pellets are eaten
      this.gameState.fruitSpawned = true;
      this.gameState.fruitPosition = { x: 9, y: 15 }; // Center of maze (grid coordinates)

      // Remove fruit after 10 seconds
      setTimeout(() => {
        this.gameState.fruitPosition = null;
        this.gameState.fruitSpawned = false;
      }, 10000);
    }
  }

  // Helper methods

  private getGhostTarget(ghost: Ghost): Position {
    const pacman = this.gameState.pacman;

    switch (ghost.id) {
      case GhostType.BLINKY:
        return pacman.position;

      case GhostType.PINKY:
        return this.getPositionAhead(pacman.position, pacman.direction, 4);

      case GhostType.INKY:
        const blinky = this.gameState.ghosts.find(g => g.id === GhostType.BLINKY);
        if (blinky) {
          const ahead = this.getPositionAhead(pacman.position, pacman.direction, 2);
          return {
            x: ahead.x + (ahead.x - blinky.position.x),
            y: ahead.y + (ahead.y - blinky.position.y)
          };
        }
        return pacman.position;

      case GhostType.CLYDE:
        const distance = this.manhattanDistance(ghost.position, pacman.position);
        return distance > 8 ? pacman.position : ghost.scatterTarget;

      default:
        return pacman.position;
    }
  }

  private getNextPosition(position: Position, direction: Direction): Position {
    switch (direction) {
      case Direction.UP:
        return { x: position.x, y: position.y - 1 };
      case Direction.DOWN:
        return { x: position.x, y: position.y + 1 };
      case Direction.LEFT:
        return { x: position.x - 1, y: position.y };
      case Direction.RIGHT:
        return { x: position.x + 1, y: position.y };
      default:
        return position;
    }
  }

  private getPositionAhead(position: Position, direction: Direction, distance: number): Position {
    switch (direction) {
      case Direction.UP:
        return { x: position.x, y: Math.max(0, position.y - distance) };
      case Direction.DOWN:
        return { x: position.x, y: Math.min(GAME_CONFIG.MAZE_HEIGHT - 1, position.y + distance) };
      case Direction.LEFT:
        return { x: Math.max(0, position.x - distance), y: position.y };
      case Direction.RIGHT:
        return { x: Math.min(GAME_CONFIG.MAZE_WIDTH - 1, position.x + distance), y: position.y };
      default:
        return position;
    }
  }

  private getOppositeDirection(direction: Direction): Direction {
    switch (direction) {
      case Direction.UP: return Direction.DOWN;
      case Direction.DOWN: return Direction.UP;
      case Direction.LEFT: return Direction.RIGHT;
      case Direction.RIGHT: return Direction.LEFT;
      default: return Direction.NONE;
    }
  }

  private getPossibleDirections(position: Position): Direction[] {
    const directions: Direction[] = [];

    if (this.isValidMove(this.getNextPosition(position, Direction.UP))) {
      directions.push(Direction.UP);
    }
    if (this.isValidMove(this.getNextPosition(position, Direction.DOWN))) {
      directions.push(Direction.DOWN);
    }
    if (this.isValidMove(this.getNextPosition(position, Direction.LEFT))) {
      directions.push(Direction.LEFT);
    }
    if (this.isValidMove(this.getNextPosition(position, Direction.RIGHT))) {
      directions.push(Direction.RIGHT);
    }

    return directions;
  }

  private isValidMove(position: Position): boolean {
    if (position.y < 0 || position.y >= GAME_CONFIG.MAZE_HEIGHT) return false;
    if (position.x < 0 || position.x >= GAME_CONFIG.MAZE_WIDTH) return false;

    const cellType = this.gameState.maze[position.y][position.x];
    return cellType !== CellType.WALL;
  }

  private setVelocity(entity: PacMan, direction: Direction): void {
    const speed = GAME_CONFIG.PACMAN_SPEED;
    switch (direction) {
      case Direction.UP:
        entity.velocity = { dx: 0, dy: -speed };
        break;
      case Direction.DOWN:
        entity.velocity = { dx: 0, dy: speed };
        break;
      case Direction.LEFT:
        entity.velocity = { dx: -speed, dy: 0 };
        break;
      case Direction.RIGHT:
        entity.velocity = { dx: speed, dy: 0 };
        break;
      default:
        entity.velocity = { dx: 0, dy: 0 };
    }
  }

  private setGhostVelocity(ghost: Ghost): void {
    let speed = GAME_CONFIG.GHOST_SPEED * this.difficultyMultiplier;

    if (ghost.state === GhostState.FRIGHTENED) {
      speed = GAME_CONFIG.FRIGHTENED_SPEED * this.difficultyMultiplier;
    } else if (ghost.state === GhostState.EATEN) {
      speed = GAME_CONFIG.GHOST_SPEED * 1.5 * this.difficultyMultiplier; // Faster when returning to house
    }

    switch (ghost.direction) {
      case Direction.UP:
        ghost.velocity = { dx: 0, dy: -speed };
        break;
      case Direction.DOWN:
        ghost.velocity = { dx: 0, dy: speed };
        break;
      case Direction.LEFT:
        ghost.velocity = { dx: -speed, dy: 0 };
        break;
      case Direction.RIGHT:
        ghost.velocity = { dx: speed, dy: 0 };
        break;
      default:
        ghost.velocity = { dx: 0, dy: 0 };
    }
  }

  private manhattanDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  private countPellets(maze: CellType[][]): number {
    let count = 0;
    maze.forEach(row => {
      row.forEach(cell => {
        if (cell === CellType.PELLET || cell === CellType.POWER_PELLET) {
          count++;
        }
      });
    });
    return count;
  }

  private resetPositions(): void {
    this.gameState.pacman.position = {
      x: PACMAN_START_POSITION.x * GAME_CONFIG.CELL_SIZE,
      y: PACMAN_START_POSITION.y * GAME_CONFIG.CELL_SIZE
    };
    this.gameState.pacman.direction = Direction.NONE;
    this.gameState.pacman.velocity = { dx: 0, dy: 0 };
    this.gameState.pacman.isDead = false;

    this.gameState.ghosts.forEach(ghost => {
      const config = GHOST_CONFIG[ghost.id];
      ghost.position = {
        x: config.startPosition.x * GAME_CONFIG.CELL_SIZE,
        y: config.startPosition.y * GAME_CONFIG.CELL_SIZE
      };
      ghost.direction = Direction.UP;
      ghost.velocity = { dx: 0, dy: 0 };
      ghost.state = ghost.id === GhostType.BLINKY ? GhostState.CHASE : GhostState.IN_HOUSE;
      ghost.houseTimer = ghost.id === GhostType.BLINKY ? 0 : 60;
    });

    this.gameState.powerPelletActive = false;
    this.gameState.powerPelletTimer = 0;
    this.gameState.gameStatus = 'READY';
  }

  private playSound(soundName: string): void {
    // Sound implementation would go here
    // For now, just log the sound that would be played
    console.log(`Playing sound: ${soundName}`);
  }

  // Public methods for external access

  getGameState(): GameState {
    return this.gameState;
  }

  startGame(): void {
    this.gameState.gameStatus = 'PLAYING';
  }

  pauseGame(): void {
    this.gameState.gameStatus = 'PAUSED';
  }

  resumeGame(): void {
    this.gameState.gameStatus = 'PLAYING';
  }

  restartGame(): void {
    this.gameState = this.initializeGameState();
  }

  toggleAIFeatures(): void {
    this.gameState.showAIFeatures = !this.gameState.showAIFeatures;
  }

  setDifficulty(multiplier: number): void {
    this.difficultyMultiplier = multiplier;
  }
}