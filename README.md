# TETRIS - 80s Minimalism Edition

A fully-featured Tetris game that runs in the browser with a traditional desktop layout, authentic 80s aesthetic, and comprehensive game mechanics. The game is compatible with desktop and mobile devices, supporting keyboard, mouse, and touch controls.

![Tetris Game Screenshot](https://via.placeholder.com/800x600/000000/00FFFF?text=TETRIS+80s+Minimalism+Edition)

## 🎮 Features

### Core Game Mechanics
- **Standard Tetris Rules**: All 7 tetromino pieces (I, O, T, S, Z, J, L) with authentic gameplay
- **Game Board**: 10x20 grid with responsive 300x600px canvas
- **Piece Movement**: Left/right movement, rotation, soft drop, hard drop
- **Line Clearing**: Complete horizontal lines disappear with proper scoring
- **Hold System**: Store one piece for later use (C key or mobile button)
- **Ghost Piece**: Visual indicator showing where current piece will land
- **Level Progression**: Speed increases with level, every 10 lines cleared
- **Advanced Scoring**: Points for line clears with bonus for Tetris (4 lines at once)

### Visual Design & Layout
- **Traditional Desktop Layout**: Three-column grid structure
  - Left Panel: Hold piece + Score display (vertical stack)
  - Center Panel: Main game board (300x600px)
  - Right Panel: Next piece + Controls + Buttons + Status
  - Header: Centered "TETRIS" title with game status
- **80s Aesthetic**: Neon colors, glowing effects, retro styling
- **Color Scheme**: Dark background with cyan/blue accents and colorful pieces
- **Typography**: Monospace fonts for scores, modern fonts for UI
- **Visual Effects**: Glowing borders, subtle shadows, hover effects

### UI Components
- **Game Board**: 300x600px canvas with grid lines and visual effects
- **Piece Previews**: 100x100px canvases for Next and Hold pieces
- **Score Display**: Score, Level, Lines cleared, High Score (vertical stack)
- **Control List**: Keyboard controls with visual key indicators
- **Game Buttons**: Start, Reset, Pause functionality
- **Status Display**: Current game state (Ready, Playing, Paused, Game Over)
- **Game Over Modal**: Final stats with Play Again button
- **Instructions Screen**: Comprehensive game guide

### Controls
- **Keyboard**: 
  - Arrow keys (move/rotate)
  - Space (hard drop)
  - C (hold)
  - P (pause)
- **Mouse**: Click buttons for game controls
- **Touch**: Mobile-friendly touch controls with swipe gestures
- **Mobile Controls**: On-screen buttons for movement, rotation, drop

### Responsive Design
- **Desktop**: Traditional three-column layout
- **Tablet**: Stacked layout with horizontal scrolling panels
- **Mobile**: Full vertical stack with mobile control overlay

## 🚀 Installation & Setup

### Prerequisites
- Node.js (version 18.x or higher)
- Modern web browser with HTML5 Canvas support

### Quick Start
1. **Clone the repository**
   ```bash
   git clone https://github.com/tanishkarmakar-cloud/tetris-test-01.git
   cd tetris-test-01
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Alternative: Direct File Access
If you prefer not to use a server, you can open `index.html` directly in your browser, though some features may be limited.

## 🎯 Game Rules & Scoring

### Objective
Clear horizontal lines by filling them with tetromino pieces. The game gets faster as you progress through levels!

### Scoring System
- **Single line**: 100 × level
- **Double lines**: 300 × level  
- **Triple lines**: 500 × level
- **Tetris (4 lines)**: 800 × level
- **Hard drop bonus**: 2 points per row dropped

### Level Progression
- Level increases every 10 lines cleared
- Drop speed increases with each level
- Maximum speed reached at level 20

### Controls Reference
| Action | Desktop | Mobile |
|--------|---------|--------|
| Move Left | ← Arrow | Swipe Left / Button |
| Move Right | → Arrow | Swipe Right / Button |
| Soft Drop | ↓ Arrow | Swipe Down / Button |
| Rotate | ↑ Arrow | Swipe Up / Button |
| Hard Drop | Space | Button |
| Hold Piece | C | Button |
| Pause | P | Button |

## 🛠️ Technical Specifications

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express
- **Fonts**: Orbitron, Share Tech Mono
- **Effects**: CSS animations, Canvas API, Web Audio API
- **Storage**: Local Storage for high scores

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance
- Smooth 60fps gameplay
- Responsive canvas rendering
- Optimized for mobile devices
- Minimal memory footprint

## 📱 Mobile Features

### Touch Controls
- **Swipe Gestures**: 
  - Swipe left/right to move
  - Swipe up to rotate
  - Swipe down for soft drop
- **On-screen Buttons**: 
  - Movement controls
  - Rotation button
  - Hold button
  - Drop button

### Responsive Design
- **Adaptive Layout**: Automatically adjusts to screen size
- **Touch Optimization**: Large, easy-to-tap buttons
- **Performance**: Optimized for mobile devices
- **Orientation**: Works in both portrait and landscape

## 🎨 Visual Effects

### 80s Aesthetic
- **Neon Colors**: Cyan, magenta, yellow, green, red, blue, orange
- **Glow Effects**: CSS box-shadow and text-shadow
- **CRT Effects**: Scanlines, screen warping, chromatic aberration
- **3D Perspective**: Angled view for depth and immersion

### Animations
- **Screen Shake**: On line clears and hard drops
- **Particle Effects**: Line clear animations
- **Score Popups**: Floating score text
- **Smooth Animations**: Piece movement and rotations
- **Hover Effects**: Interactive UI elements

### Sound Effects
- **Web Audio API**: Synthesized 8-bit style sounds
- **Move Sounds**: Piece movement feedback
- **Line Clear**: Musical line clear sequence
- **Level Up**: Ascending tone progression
- **Game Over**: Descending tone sequence

## 🏗️ Architecture

### File Structure
```
tetris-game/
├── index.html          # Main HTML structure
├── styles.css          # All styling and responsive design
├── tetris.js           # Game logic and mechanics
├── server.js           # Express server
├── package.json        # Dependencies and scripts
├── Procfile           # Heroku deployment
└── README.md          # Documentation
```

### Code Organization
- **Clean Architecture**: Separated concerns (rendering, logic, input)
- **Modular Design**: Reusable functions and classes
- **Error Handling**: Graceful error management
- **Performance**: Optimized for smooth gameplay
- **Accessibility**: Keyboard navigation, screen reader support

## 🚀 Deployment

### Heroku
The game is ready for deployment on Heroku:

1. **Create Heroku app**
   ```bash
   heroku create your-tetris-app
   ```

2. **Deploy**
   ```bash
   git push heroku main
   ```

3. **Open app**
   ```bash
   heroku open
   ```

### Other Platforms
- **Netlify**: Drag and drop the project folder
- **Vercel**: Connect your GitHub repository
- **GitHub Pages**: Enable in repository settings
- **Any Node.js hosting**: Deploy with `npm start`

## 🎮 Game States

### Ready
Initial state, waiting to start. Shows main menu with instructions.

### Playing
Active gameplay with all controls enabled. Game loop running at 60fps.

### Paused
Game paused, can resume. All game state preserved.

### Game Over
Game ended, shows final stats with option to play again.

## 🔧 Customization

### Colors
Modify CSS custom properties in `styles.css`:
```css
:root {
    --accent-glow: #00ffff;
    --neon-pink: #ff00ff;
    --neon-green: #00ff00;
    /* ... more colors */
}
```

### Game Speed
Adjust drop intervals in `tetris.js`:
```javascript
this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
```

### Sound
Modify sound frequencies in the `initSounds()` method:
```javascript
move: () => createTone(200, 0.1, 'square'),
rotate: () => createTone(300, 0.1, 'square'),
```

## 🐛 Troubleshooting

### Common Issues

**Game not loading**
- Check browser console for errors
- Ensure JavaScript is enabled
- Verify all files are present

**Controls not working**
- Click on game area to focus
- Check if game is paused
- Try refreshing the page

**Mobile controls not showing**
- Check if device is detected as mobile
- Ensure viewport meta tag is present
- Try landscape orientation

**Performance issues**
- Close other browser tabs
- Check if hardware acceleration is enabled
- Try a different browser

### Browser Support
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 12+)
- **Edge**: Full support
- **Internet Explorer**: Not supported

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use ES6+ features
- Follow existing naming conventions
- Add comments for complex logic
- Test on multiple devices

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Tetris**: Created by Alexey Pajitnov
- **Fonts**: Google Fonts (Orbitron, Share Tech Mono)
- **Inspiration**: 80s arcade games and retro aesthetics
- **Community**: Thanks to all contributors and testers

## 📞 Support

If you encounter any issues or have questions:

1. **Check the troubleshooting section**
2. **Search existing issues**
3. **Create a new issue** with detailed information
4. **Contact**: [Your contact information]

---

**Enjoy playing TETRIS - 80s Minimalism Edition!** 🎮✨

*Built with ❤️ for the retro gaming community*