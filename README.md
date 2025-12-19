# AI-Powered Pac-Man Game

A modern recreation of the classic Pac-Man game enhanced with artificial intelligence features, built with React and TypeScript.

## 🎮 Features

### Classic Gameplay
- Authentic Pac-Man mechanics with maze navigation
- Four unique ghosts with distinct AI behaviors (Blinky, Pinky, Inky, Clyde)
- Pellets, power pellets, and bonus fruit collection
- Multiple lives and progressive difficulty levels
- High score tracking with local storage

### AI Enhancements
- **🔮 Predictive Path Display**: Real-time visualization of ghost movement predictions
- **🌡️ Danger Zone Heatmap**: Dynamic threat level visualization across the maze
- **🧠 Adaptive Ghost Intelligence**: Ghosts learn from player movement patterns and adapt their strategies

### Visual Effects
- Authentic 1980s CRT monitor aesthetics with scanlines and phosphor glow
- Neon lighting effects and retro color schemes
- Screen shake and VHS glitch effects for enhanced immersion
- Smooth 60fps gameplay with canvas-based rendering

## 🚀 Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-pacman-game
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## 🎯 How to Play

### Controls
- **Movement**: Arrow keys or WASD
- **Start/Pause**: Spacebar
- **Restart**: R key (when game over)
- **Toggle AI Features**: H key

### Objective
- Navigate Pac-Man through the maze to collect all pellets
- Avoid ghosts unless you've eaten a power pellet
- Eat power pellets to temporarily make ghosts vulnerable
- Collect bonus fruit for extra points
- Complete levels by eating all pellets

### AI Features
When AI features are enabled (press H), you'll see:
- **Ghost Prediction Paths**: Dotted lines showing where ghosts are likely to move
- **Danger Heatmap**: Red overlay indicating dangerous areas
- **Learning Level**: Shows how much the AI has learned from your patterns
- **Movement Suggestions**: Recommended directions based on AI analysis

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── GameRenderer.tsx # Canvas-based game rendering
│   └── GameUI.tsx      # User interface components
├── engine/             # Game logic
│   ├── GameEngine.ts   # Core game mechanics
│   └── AIEngine.ts     # AI analysis and predictions
├── types/              # TypeScript type definitions
│   └── game.ts         # Game state and entity types
├── config/             # Game configuration
│   └── gameConfig.ts   # Constants and maze layout
├── App.tsx             # Main application component
├── App.css             # Styling and visual effects
└── index.tsx           # Application entry point
```

## 🤖 AI Implementation

### Predictive Path Display
The AI engine uses A* pathfinding to predict ghost movements based on their current targets and behaviors. Predictions are visualized as dotted lines showing likely paths.

### Danger Zone Heatmap
Real-time calculation of threat levels across the maze based on:
- Ghost proximity and states
- Movement speed and direction
- Power pellet status

### Adaptive Ghost Intelligence
Ghosts analyze player movement patterns and adapt their targeting:
- Pattern recognition of player tendencies
- Predictive interception based on learned behaviors
- Dynamic difficulty adjustment based on player skill

## 🎨 Visual Design

The game features an authentic retro aesthetic inspired by 1980s arcade cabinets:
- CRT monitor simulation with curved screen distortion
- Phosphor glow effects on all game elements
- Scanline overlay for authentic CRT appearance
- RGB color separation effects
- Neon lighting with appropriate glow and shadows

## 🔧 Technical Details

- **Framework**: React 18 with TypeScript
- **Rendering**: HTML5 Canvas with 60fps game loop
- **State Management**: React hooks with centralized game state
- **AI**: Custom pathfinding and pattern recognition algorithms
- **Styling**: CSS3 with advanced visual effects
- **Build Tool**: Create React App with custom optimizations

## 📱 Mobile Support

The game includes responsive design and touch controls for mobile devices:
- Virtual joystick for movement
- Touch-friendly UI elements
- Optimized layout for smaller screens

## 🚀 Performance

- Optimized canvas rendering with efficient draw calls
- 60fps gameplay with smooth animations
- Minimal memory footprint with object pooling
- Efficient AI calculations with configurable update intervals

## 🎵 Audio (Future Enhancement)

The codebase includes infrastructure for sound effects:
- Chomp sounds for pellet collection
- Power pellet activation sounds
- Ghost eating effects
- Background music support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Original Pac-Man game by Namco
- Inspired by classic arcade game design
- Modern web technologies for enhanced gameplay experience

---

**Enjoy playing AI-Powered Pac-Man!** 🎮✨