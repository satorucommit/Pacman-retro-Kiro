import { 
  Position, 
  Direction, 
  Ghost, 
  PacMan, 
  CellType, 
  GhostState,
  AIAnalysis,
  GhostType 
} from '../types/game.ts';
import { GAME_CONFIG, AI_CONFIG } from '../config/gameConfig.ts';

/**
 * AI Engine for Pac-Man game
 * Implements three core AI features:
 * 1. Predictive Path Display - Shows ghost movement predictions
 * 2. Danger Zone Heatmap - Real-time danger visualization
 * 3. Adaptive Ghost Intelligence - Learning from player patterns
 */
export class AIEngine {
  private playerPatterns: Direction[] = [];
  private patternWeights: { [key in Direction]: number } = {
    [Direction.UP]: 0,
    [Direction.DOWN]: 0,
    [Direction.LEFT]: 0,
    [Direction.RIGHT]: 0,
    [Direction.NONE]: 0
  };
  private learningLevel: number = 0;

  /**
   * Analyzes current game state and provides AI insights
   */
  analyzeGameState(
    pacman: PacMan,
    ghosts: Ghost[],
    maze: CellType[][]
  ): AIAnalysis {
    const ghostPredictions = this.predictGhostMovements(ghosts, maze, pacman);
    const dangerLevel = this.calculateDangerLevel(pacman.position, ghosts);
    const suggestedDirection = this.suggestOptimalDirection(pacman, ghosts, maze);
    const safeZones = this.findSafeZones(pacman.position, ghosts, maze);
    const escapeRoutes = this.findEscapeRoutes(pacman.position, ghosts, maze);

    return {
      dangerLevel,
      suggestedDirection,
      ghostPredictions,
      safeZones,
      escapeRoutes,
      playerTendencies: { ...this.patternWeights }
    };
  }

  /**
   * Predicts ghost movements using A* pathfinding and behavior patterns
   */
  predictGhostMovements(
    ghosts: Ghost[],
    maze: CellType[][],
    pacman: PacMan
  ): { [key in GhostType]: Position[] } {
    const predictions: { [key in GhostType]: Position[] } = {
      [GhostType.BLINKY]: [],
      [GhostType.PINKY]: [],
      [GhostType.INKY]: [],
      [GhostType.CLYDE]: []
    };

    ghosts.forEach(ghost => {
      if (ghost.state === GhostState.FRIGHTENED || ghost.state === GhostState.EATEN) {
        // Frightened ghosts move randomly, harder to predict
        predictions[ghost.id] = this.predictRandomMovement(ghost, maze);
      } else {
        // Use A* pathfinding to predict chase/scatter behavior
        const target = this.getGhostTarget(ghost, pacman, ghosts);
        predictions[ghost.id] = this.predictPathToTarget(ghost, target, maze);
      }
    });

    return predictions;
  }

  /**
   * Calculates danger level at given position based on ghost proximity and states
   */
  calculateDangerLevel(position: Position, ghosts: Ghost[]): number {
    let totalDanger = 0;

    ghosts.forEach(ghost => {
      if (ghost.state === GhostState.FRIGHTENED || ghost.state === GhostState.EATEN) {
        return; // No danger from frightened/eaten ghosts
      }

      const distance = this.manhattanDistance(position, ghost.position);
      const maxDangerDistance = AI_CONFIG.DANGER_RADIUS;

      if (distance <= maxDangerDistance) {
        // Closer ghosts are more dangerous
        const dangerContribution = (maxDangerDistance - distance) / maxDangerDistance;
        totalDanger += dangerContribution;
      }
    });

    return Math.min(totalDanger, 1); // Normalize to 0-1
  }

  /**
   * Generates danger heatmap for the entire maze
   */
  generateDangerHeatmap(ghosts: Ghost[], maze: CellType[][]): number[][] {
    const heatmap: number[][] = Array(maze.length).fill(null)
      .map(() => Array(maze[0].length).fill(0));

    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[0].length; x++) {
        if (maze[y][x] === CellType.WALL) {
          heatmap[y][x] = -1; // Mark walls
          continue;
        }

        heatmap[y][x] = this.calculateDangerLevel({ x, y }, ghosts);
      }
    }

    return heatmap;
  }

  /**
   * Records player movement patterns for adaptive AI
   */
  recordPlayerMovement(direction: Direction): void {
    this.playerPatterns.push(direction);

    // Keep only recent patterns
    if (this.playerPatterns.length > AI_CONFIG.PATTERN_THRESHOLD) {
      this.playerPatterns.shift();
    }

    // Update pattern weights
    this.updatePatternWeights();
    this.updateLearningLevel();
  }

  /**
   * Suggests optimal direction based on danger analysis and escape routes
   */
  suggestOptimalDirection(
    pacman: PacMan,
    ghosts: Ghost[],
    maze: CellType[][]
  ): Direction {
    const possibleDirections = this.getPossibleDirections(pacman.position, maze);
    let bestDirection = Direction.NONE;
    let lowestDanger = Infinity;

    possibleDirections.forEach(direction => {
      const nextPosition = this.getNextPosition(pacman.position, direction);
      const danger = this.calculateDangerLevel(nextPosition, ghosts);
      
      // Consider future danger by looking ahead
      const futureDanger = this.calculateFutureDanger(nextPosition, ghosts, maze, 3);
      const totalDanger = danger + (futureDanger * 0.5);

      if (totalDanger < lowestDanger) {
        lowestDanger = totalDanger;
        bestDirection = direction;
      }
    });

    return bestDirection;
  }

  /**
   * Finds safe zones where player can temporarily hide
   */
  findSafeZones(
    pacmanPosition: Position,
    ghosts: Ghost[],
    maze: CellType[][]
  ): Position[] {
    const safeZones: Position[] = [];
    const safeDistance = AI_CONFIG.SAFE_DISTANCE;

    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[0].length; x++) {
        if (maze[y][x] === CellType.WALL) continue;

        const position = { x, y };
        const isSafe = ghosts.every(ghost => {
          if (ghost.state === GhostState.FRIGHTENED || ghost.state === GhostState.EATEN) {
            return true;
          }
          return this.manhattanDistance(position, ghost.position) >= safeDistance;
        });

        if (isSafe && this.manhattanDistance(position, pacmanPosition) <= 8) {
          safeZones.push(position);
        }
      }
    }

    return safeZones;
  }

  /**
   * Finds escape routes when surrounded by ghosts
   */
  findEscapeRoutes(
    pacmanPosition: Position,
    ghosts: Ghost[],
    maze: CellType[][]
  ): Position[] {
    const escapeRoutes: Position[] = [];
    const visited = new Set<string>();
    const queue: { position: Position; path: Position[] }[] = [
      { position: pacmanPosition, path: [] }
    ];

    while (queue.length > 0) {
      const { position, path } = queue.shift()!;
      const key = `${position.x},${position.y}`;

      if (visited.has(key) || path.length > 6) continue;
      visited.add(key);

      // Check if this position is safe
      const danger = this.calculateDangerLevel(position, ghosts);
      if (danger < 0.3 && path.length > 2) {
        escapeRoutes.push(...path);
        continue;
      }

      // Explore adjacent positions
      const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
      directions.forEach(direction => {
        const nextPos = this.getNextPosition(position, direction);
        if (this.isValidPosition(nextPos, maze)) {
          queue.push({
            position: nextPos,
            path: [...path, nextPos]
          });
        }
      });
    }

    return escapeRoutes;
  }

  /**
   * Adapts ghost behavior based on learned player patterns
   */
  adaptGhostBehavior(ghost: Ghost, pacman: PacMan, ghosts: Ghost[]): Position {
    const baseTarget = this.getGhostTarget(ghost, pacman, ghosts);
    
    if (this.learningLevel < 20) {
      return baseTarget; // Not enough learning yet
    }

    // Predict where player is likely to go based on patterns
    const predictedDirection = this.predictPlayerDirection();
    const predictedPosition = this.getNextPosition(pacman.position, predictedDirection);

    // Adjust ghost target to intercept predicted path
    const interceptTarget = this.calculateInterceptPoint(
      ghost.position,
      predictedPosition,
      pacman.velocity
    );

    // Blend original target with intercept target based on learning level
    const learningWeight = Math.min(this.learningLevel / 100, 0.7);
    
    return {
      x: Math.round(baseTarget.x * (1 - learningWeight) + interceptTarget.x * learningWeight),
      y: Math.round(baseTarget.y * (1 - learningWeight) + interceptTarget.y * learningWeight)
    };
  }

  // Private helper methods

  private predictRandomMovement(ghost: Ghost, maze: CellType[][]): Position[] {
    const predictions: Position[] = [];
    let currentPos = { ...ghost.position };

    for (let i = 0; i < GAME_CONFIG.AI_PREDICTION_STEPS; i++) {
      const possibleDirections = this.getPossibleDirections(currentPos, maze);
      const randomDirection = possibleDirections[
        Math.floor(Math.random() * possibleDirections.length)
      ];
      currentPos = this.getNextPosition(currentPos, randomDirection);
      predictions.push({ ...currentPos });
    }

    return predictions;
  }

  private predictPathToTarget(
    ghost: Ghost,
    target: Position,
    maze: CellType[][]
  ): Position[] {
    const path = this.findPathAStar(ghost.position, target, maze);
    return path.slice(1, GAME_CONFIG.AI_PREDICTION_STEPS + 1);
  }

  private findPathAStar(
    start: Position,
    goal: Position,
    maze: CellType[][]
  ): Position[] {
    const openSet = [start];
    const cameFrom = new Map<string, Position>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    gScore.set(`${start.x},${start.y}`, 0);
    fScore.set(`${start.x},${start.y}`, this.manhattanDistance(start, goal));

    while (openSet.length > 0) {
      // Find node with lowest fScore
      let current = openSet[0];
      let currentIndex = 0;
      
      for (let i = 1; i < openSet.length; i++) {
        const currentKey = `${current.x},${current.y}`;
        const nodeKey = `${openSet[i].x},${openSet[i].y}`;
        if ((fScore.get(nodeKey) || Infinity) < (fScore.get(currentKey) || Infinity)) {
          current = openSet[i];
          currentIndex = i;
        }
      }

      if (current.x === goal.x && current.y === goal.y) {
        // Reconstruct path
        const path = [current];
        let currentKey = `${current.x},${current.y}`;
        
        while (cameFrom.has(currentKey)) {
          current = cameFrom.get(currentKey)!;
          path.unshift(current);
          currentKey = `${current.x},${current.y}`;
        }
        
        return path;
      }

      openSet.splice(currentIndex, 1);
      
      // Check neighbors
      const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
      directions.forEach(direction => {
        const neighbor = this.getNextPosition(current, direction);
        
        if (!this.isValidPosition(neighbor, maze)) return;

        const neighborKey = `${neighbor.x},${neighbor.y}`;
        const tentativeGScore = (gScore.get(`${current.x},${current.y}`) || 0) + 1;

        if (tentativeGScore < (gScore.get(neighborKey) || Infinity)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(neighborKey, tentativeGScore + this.manhattanDistance(neighbor, goal));

          if (!openSet.some(pos => pos.x === neighbor.x && pos.y === neighbor.y)) {
            openSet.push(neighbor);
          }
        }
      });
    }

    return []; // No path found
  }

  private getGhostTarget(ghost: Ghost, pacman: PacMan, ghosts: Ghost[]): Position {
    switch (ghost.id) {
      case GhostType.BLINKY:
        // Blinky targets Pac-Man directly
        return pacman.position;
        
      case GhostType.PINKY:
        // Pinky targets 4 cells ahead of Pac-Man
        return this.getPositionAhead(pacman.position, pacman.direction, 4);
        
      case GhostType.INKY:
        // Inky uses complex targeting involving Blinky
        const blinky = ghosts.find(g => g.id === GhostType.BLINKY);
        if (blinky) {
          const ahead = this.getPositionAhead(pacman.position, pacman.direction, 2);
          return {
            x: ahead.x + (ahead.x - blinky.position.x),
            y: ahead.y + (ahead.y - blinky.position.y)
          };
        }
        return pacman.position;
        
      case GhostType.CLYDE:
        // Clyde targets Pac-Man when far, scatters when close
        const distance = this.manhattanDistance(ghost.position, pacman.position);
        return distance > 8 ? pacman.position : ghost.scatterTarget;
        
      default:
        return pacman.position;
    }
  }

  private updatePatternWeights(): void {
    // Reset weights
    Object.keys(this.patternWeights).forEach(key => {
      this.patternWeights[key as Direction] = 0;
    });

    // Calculate frequency of each direction
    this.playerPatterns.forEach(direction => {
      this.patternWeights[direction]++;
    });

    // Normalize to percentages
    const total = this.playerPatterns.length;
    Object.keys(this.patternWeights).forEach(key => {
      this.patternWeights[key as Direction] /= total;
    });
  }

  private updateLearningLevel(): void {
    // Learning level increases with pattern consistency
    const maxWeight = Math.max(...Object.values(this.patternWeights));
    const consistency = maxWeight - 0.25; // 0.25 is random chance
    
    if (consistency > 0) {
      this.learningLevel = Math.min(
        this.learningLevel + (consistency * AI_CONFIG.LEARNING_RATE),
        AI_CONFIG.MAX_LEARNING_LEVEL
      );
    }
  }

  private predictPlayerDirection(): Direction {
    const weights = this.patternWeights;
    let maxWeight = 0;
    let predictedDirection = Direction.NONE;

    Object.entries(weights).forEach(([direction, weight]) => {
      if (weight > maxWeight) {
        maxWeight = weight;
        predictedDirection = direction as Direction;
      }
    });

    return predictedDirection;
  }

  private calculateInterceptPoint(
    ghostPos: Position,
    targetPos: Position,
    targetVelocity: { dx: number; dy: number }
  ): Position {
    // Simple interception calculation
    const dx = targetPos.x - ghostPos.x;
    const dy = targetPos.y - ghostPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const timeToReach = distance / GAME_CONFIG.GHOST_SPEED;

    return {
      x: Math.round(targetPos.x + targetVelocity.dx * timeToReach),
      y: Math.round(targetPos.y + targetVelocity.dy * timeToReach)
    };
  }

  private calculateFutureDanger(
    position: Position,
    ghosts: Ghost[],
    maze: CellType[][],
    steps: number
  ): number {
    let totalDanger = 0;

    for (let step = 1; step <= steps; step++) {
      const currentStep = step; // Capture step value to avoid closure issue
      // eslint-disable-next-line no-loop-func
      ghosts.forEach(ghost => {
        if (ghost.state === GhostState.FRIGHTENED || ghost.state === GhostState.EATEN) {
          return;
        }

        // Estimate ghost position after 'step' moves
        const futureGhostPos = this.estimateGhostPosition(ghost, currentStep);
        const distance = this.manhattanDistance(position, futureGhostPos);
        
        if (distance <= AI_CONFIG.DANGER_RADIUS) {
          totalDanger += (AI_CONFIG.DANGER_RADIUS - distance) / AI_CONFIG.DANGER_RADIUS / currentStep;
        }
      });
    }

    return totalDanger;
  }

  private estimateGhostPosition(ghost: Ghost, steps: number): Position {
    // Simple estimation - ghost moves toward its current target
    const dx = ghost.targetPosition.x - ghost.position.x;
    const dy = ghost.targetPosition.y - ghost.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return ghost.position;

    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;

    return {
      x: Math.round(ghost.position.x + normalizedDx * GAME_CONFIG.GHOST_SPEED * steps),
      y: Math.round(ghost.position.y + normalizedDy * GAME_CONFIG.GHOST_SPEED * steps)
    };
  }

  private getPossibleDirections(position: Position, maze: CellType[][]): Direction[] {
    const directions: Direction[] = [];
    
    if (this.isValidPosition(this.getNextPosition(position, Direction.UP), maze)) {
      directions.push(Direction.UP);
    }
    if (this.isValidPosition(this.getNextPosition(position, Direction.DOWN), maze)) {
      directions.push(Direction.DOWN);
    }
    if (this.isValidPosition(this.getNextPosition(position, Direction.LEFT), maze)) {
      directions.push(Direction.LEFT);
    }
    if (this.isValidPosition(this.getNextPosition(position, Direction.RIGHT), maze)) {
      directions.push(Direction.RIGHT);
    }

    return directions;
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
        return { x: position.x, y: position.y - distance };
      case Direction.DOWN:
        return { x: position.x, y: position.y + distance };
      case Direction.LEFT:
        return { x: position.x - distance, y: position.y };
      case Direction.RIGHT:
        return { x: position.x + distance, y: position.y };
      default:
        return position;
    }
  }

  private isValidPosition(position: Position, maze: CellType[][]): boolean {
    if (position.y < 0 || position.y >= maze.length) return false;
    if (position.x < 0 || position.x >= maze[0].length) return false;
    return maze[position.y][position.x] !== CellType.WALL;
  }

  private manhattanDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  // Getters for external access
  getLearningLevel(): number {
    return this.learningLevel;
  }

  getPlayerPatterns(): Direction[] {
    return [...this.playerPatterns];
  }

  getPatternWeights(): { [key in Direction]: number } {
    return { ...this.patternWeights };
  }
}