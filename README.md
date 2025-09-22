# Tetris Game

A classic Tetris game built with HTML5 Canvas, CSS3, and vanilla JavaScript.

## Features

- **Classic Tetris Gameplay**: All 7 standard Tetris pieces (I, O, T, S, Z, J, L)
- **Smooth Controls**: Arrow keys for movement and rotation, spacebar for hard drop
- **Scoring System**: Points for clearing lines, increasing difficulty with levels
- **Next Piece Preview**: See what piece is coming next
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Beautiful gradient design with smooth animations

## How to Play

1. **Start the Game**: Click the "Start Game" button
2. **Controls**:
   - `←` `→` Move piece left/right
   - `↓` Soft drop (faster fall)
   - `↑` Rotate piece
   - `Space` Hard drop (instant drop)
3. **Objective**: Fill complete horizontal lines to clear them and score points
4. **Game Over**: When pieces reach the top of the playing field

## Scoring

- **Lines Cleared**: 100 points × level
- **Levels**: Increase every 10 lines cleared
- **Speed**: Game speed increases with each level

## Installation & Setup

1. Clone or download this repository
2. Open `index.html` in a web browser
3. Start playing!

## File Structure

```
tetris-test-01/
├── index.html          # Main HTML file
├── styles.css          # CSS styling and animations
├── tetris.js           # Game logic and mechanics
└── README.md           # This file
```

## Technical Details

- **Canvas-based Rendering**: Uses HTML5 Canvas for smooth graphics
- **Object-Oriented Design**: Clean JavaScript class structure
- **Collision Detection**: Precise piece placement and rotation
- **Game Loop**: 60 FPS update cycle for smooth gameplay
- **Responsive Layout**: CSS Grid and Flexbox for modern layout

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Future Enhancements

- [ ] High score persistence (localStorage)
- [ ] Sound effects and background music
- [ ] Different game modes
- [ ] Multiplayer support
- [ ] Mobile touch controls
- [ ] Particle effects for line clears

## License

This project is open source and available under the MIT License.

---

Enjoy playing Tetris! 🎮
