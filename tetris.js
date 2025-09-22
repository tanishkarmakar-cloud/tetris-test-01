class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gameLoop = null;
        this.dropTime = 0;
        this.dropInterval = 1000; // 1 second
        
        // UI elements
        this.mainMenu = document.getElementById('mainMenu');
        this.gameScreen = document.getElementById('gameScreen');
        this.instructionsModal = document.getElementById('instructionsModal');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.gameContainer = document.getElementById('gameContainer');
        this.particleContainer = document.getElementById('particleContainer');
        this.explosionContainer = document.getElementById('explosionContainer');
        
        // Juice effects
        this.screenShakeIntensity = 0;
        this.particles = [];
        this.explosions = [];
        
        // Sound effects
        this.sounds = this.initSounds();
        
        // Responsive canvas sizing
        this.setupResponsiveCanvas();
        
        // Tetris pieces (Tetrominoes)
        this.pieces = [
            {
                shape: [
                    [1, 1, 1, 1]
                ],
                color: '#00f0f0' // I piece - cyan
            },
            {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#f0f000' // O piece - yellow
            },
            {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1]
                ],
                color: '#a000f0' // T piece - purple
            },
            {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0]
                ],
                color: '#00f000' // S piece - green
            },
            {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1]
                ],
                color: '#f00000' // Z piece - red
            },
            {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1]
                ],
                color: '#f0a000' // J piece - orange
            },
            {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1]
                ],
                color: '#0000f0' // L piece - blue
            }
        ];
        
        this.init();
    }
    
    setupResponsiveCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const gameViewport = document.querySelector('.game-viewport');
        if (!gameViewport) return;
        
        const containerWidth = gameViewport.clientWidth - 40; // Account for padding
        const containerHeight = gameViewport.clientHeight - 40; // Account for padding
        
        // Calculate optimal canvas size
        const aspectRatio = this.BOARD_WIDTH / this.BOARD_HEIGHT;
        let canvasWidth, canvasHeight;
        
        if (containerWidth / containerHeight > aspectRatio) {
            // Container is wider than needed
            canvasHeight = containerHeight;
            canvasWidth = canvasHeight * aspectRatio;
        } else {
            // Container is taller than needed
            canvasWidth = containerWidth;
            canvasHeight = canvasWidth / aspectRatio;
        }
        
        // Ensure canvas dimensions are integers to prevent rendering issues
        canvasWidth = Math.floor(canvasWidth);
        canvasHeight = Math.floor(canvasHeight);

        // Set canvas size
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
        
        // Update block size based on canvas size
        this.BLOCK_SIZE = canvasWidth / this.BOARD_WIDTH;
        
        // Resize next piece canvas
        const nextContainer = document.querySelector('.next-piece-container');
        if (nextContainer) {
            const nextSize = Math.min(nextContainer.clientWidth - 30, nextContainer.clientHeight - 30, 100);
            this.nextCanvas.width = nextSize;
            this.nextCanvas.height = nextSize;
            this.nextCanvas.style.width = nextSize + 'px';
            this.nextCanvas.style.height = nextSize + 'px';
        }
        
        // Redraw if game is initialized
        if (this.currentPiece !== null) {
            this.draw();
            this.drawNextPiece();
        }
    }
    
    init() {
        this.setupEventListeners();
        this.generateNextPiece();
        this.spawnPiece();
        this.updateDisplay();
        this.draw();
    }
    
    setupEventListeners() {
        // Main menu events
        document.getElementById('playBtn').addEventListener('click', () => {
            this.sounds.button();
            this.showGameScreen();
        });
        document.getElementById('closeInstructions').addEventListener('click', () => this.hideInstructions());
        document.getElementById('backToMenu').addEventListener('click', () => {
            this.sounds.button();
            this.showMainMenu();
        });
        
        // Game control events
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.sounds.button();
            this.togglePause();
        });
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.sounds.button();
            this.resetGame();
        });
        
        // Game over screen events
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.sounds.button();
            this.showGameScreen();
        });
        
        // Prevent default behavior for arrow keys and space
        document.addEventListener('keydown', (e) => {
            // Prevent scrolling for arrow keys and space
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
            this.handleKeyPress(e);
        });
        
        // Focus the game area to ensure keyboard input works
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();
        
        // Refocus on canvas when clicking anywhere in game screen
        document.addEventListener('click', (e) => {
            if (this.gameScreen && !this.gameScreen.classList.contains('hidden')) {
                this.canvas.focus();
            }
        });
        
        // Close modal when clicking outside
        this.instructionsModal.addEventListener('click', (e) => {
            if (e.target === this.instructionsModal) {
                this.hideInstructions();
            }
        });
    }
    
    // Sound Effects
    initSounds() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const createTone = (frequency, duration, type = 'square') => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
        
        return {
            move: () => createTone(200, 0.1, 'square'),
            rotate: () => createTone(300, 0.1, 'square'),
            drop: () => createTone(150, 0.2, 'sawtooth'),
            lineClear: () => {
                createTone(400, 0.1, 'square');
                setTimeout(() => createTone(500, 0.1, 'square'), 50);
                setTimeout(() => createTone(600, 0.1, 'square'), 100);
                setTimeout(() => createTone(700, 0.2, 'square'), 150);
            },
            explosion: () => {
                createTone(100, 0.3, 'sawtooth');
                setTimeout(() => createTone(80, 0.3, 'sawtooth'), 100);
                setTimeout(() => createTone(60, 0.3, 'sawtooth'), 200);
            },
            gameOver: () => {
                createTone(200, 0.5, 'sawtooth');
                setTimeout(() => createTone(150, 0.5, 'sawtooth'), 200);
                setTimeout(() => createTone(100, 0.5, 'sawtooth'), 400);
            },
            button: () => createTone(800, 0.1, 'square'),
            levelUp: () => {
                createTone(500, 0.2, 'square');
                setTimeout(() => createTone(600, 0.2, 'square'), 100);
                setTimeout(() => createTone(700, 0.2, 'square'), 200);
            }
        };
    }
    
    // Juice Effects
    addScreenShake(intensity = 1) {
        this.gameContainer.classList.remove('shake', 'shake-strong');
        if (intensity > 1) {
            this.gameContainer.classList.add('shake-strong');
        } else {
            this.gameContainer.classList.add('shake');
        }
        
        setTimeout(() => {
            this.gameContainer.classList.remove('shake', 'shake-strong');
        }, intensity > 1 ? 800 : 500);
    }
    
    createParticles(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const angle = (Math.PI * 2 * i) / count;
            const velocity = 50 + Math.random() * 50;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.setProperty('--vx', vx + 'px');
            particle.style.setProperty('--vy', vy + 'px');
            
            this.particleContainer.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }
    
    createBombasticExplosion(x, y, intensity = 1) {
        const explosionCount = 20 + (intensity * 30);
        
        for (let i = 0; i < explosionCount; i++) {
            const explosion = document.createElement('div');
            explosion.className = 'explosion-particle';
            
            const angle = (Math.PI * 2 * i) / explosionCount + (Math.random() - 0.5) * 0.5;
            const velocity = 100 + Math.random() * 100 + (intensity * 50);
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            explosion.style.left = x + 'px';
            explosion.style.top = y + 'px';
            explosion.style.setProperty('--vx', vx + 'px');
            explosion.style.setProperty('--vy', vy + 'px');
            
            // Random colors for explosion
            const colors = ['#ff0000', '#ff6600', '#ffaa00', '#ffff00'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            explosion.style.background = randomColor;
            explosion.style.boxShadow = `0 0 15px ${randomColor}`;
            
            this.explosionContainer.appendChild(explosion);
            
            setTimeout(() => {
                if (explosion.parentNode) {
                    explosion.parentNode.removeChild(explosion);
                }
            }, 1500);
        }
        
        // Add screen shake for explosion
        this.addScreenShake(intensity > 2 ? 3 : 2);
        this.sounds.explosion();
    }
    
    flashScreen() {
        const gameViewport = document.querySelector('.game-viewport');
        gameViewport.classList.add('flash');
        setTimeout(() => {
            gameViewport.classList.remove('flash');
        }, 300);
    }
    
    animateScore(element) {
        element.classList.add('animate');
        setTimeout(() => {
            element.classList.remove('animate');
        }, 500);
    }
    
    pulseElement(element) {
        element.classList.add('pulse');
        setTimeout(() => {
            element.classList.remove('pulse');
        }, 600);
    }
    
    // UI Management Methods
    showMainMenu() {
        this.mainMenu.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.hideInstructions();
        this.pauseGame();
    }
    
    showGameScreen() {
        this.mainMenu.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.resizeCanvas();
        this.canvas.focus();
        // Auto-start the game when entering game screen
        this.startGame();
    }
    
    showInstructions() {
        this.instructionsModal.classList.remove('hidden');
    }
    
    hideInstructions() {
        this.instructionsModal.classList.add('hidden');
    }
    
    pauseGame() {
        if (this.gameRunning) {
            this.gameRunning = false;
            clearInterval(this.gameLoop);
        }
    }
    
    handleKeyPress(e) {
        if (e.code === 'KeyP') {
            this.sounds.button();
            this.togglePause();
            return;
        }
        
        if (!this.gameRunning || !this.currentPiece) return;
        
        switch(e.code) {
            case 'ArrowLeft':
                this.sounds.move();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.sounds.move();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                this.sounds.drop();
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                this.sounds.rotate();
                this.rotatePiece();
                break;
            case 'Space':
                this.sounds.drop();
                this.hardDrop();
                break;
        }
    }
    
    generateNextPiece() {
        const randomIndex = Math.floor(Math.random() * this.pieces.length);
        this.nextPiece = {
            ...this.pieces[randomIndex],
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.pieces[randomIndex].shape[0].length / 2),
            y: 0
        };
    }
    
    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.generateNextPiece();
        this.drawNextPiece();
        
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.gameOver();
        }
    }
    
    movePiece(dx, dy) {
        if (!this.checkCollision(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            this.draw();
            
            // Add juice for movement
            if (dx !== 0) {
                this.addScreenShake(0.5);
            }
        } else if (dy > 0) {
            this.placePiece();
        }
    }
    
    rotatePiece() {
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        
        this.currentPiece.shape = rotated;
        
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.currentPiece.shape = originalShape;
        } else {
            this.draw();
            // Add juice for rotation
            this.addScreenShake(0.3);
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    hardDrop() {
        while (!this.checkCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
        }
        this.placePiece();
        // Add juice for hard drop
        this.addScreenShake(1);
        this.flashScreen();
    }
    
    checkCollision(piece, dx, dy) {
        const newX = piece.x + dx;
        const newY = piece.y + dy;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = newX + x;
                    const boardY = newY + y;
                    
                    if (boardX < 0 || boardX >= this.BOARD_WIDTH || 
                        boardY >= this.BOARD_HEIGHT || 
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    placePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // Add juice for piece placement
        this.addScreenShake(0.7);
        this.createParticles(
            this.canvas.offsetLeft + this.canvas.width / 2,
            this.canvas.offsetTop + this.canvas.height / 2,
            15
        );
        
        this.clearLines();
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // Check the same line again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            
            // Add bombastic explosion effects for line clears
            this.addScreenShake(linesCleared > 2 ? 3 : 2);
            this.flashScreen();
            this.createBombasticExplosion(
                this.canvas.offsetLeft + this.canvas.width / 2,
                this.canvas.offsetTop + this.canvas.height / 2,
                linesCleared
            );
            
            // Add regular particles too
            this.createParticles(
                this.canvas.offsetLeft + this.canvas.width / 2,
                this.canvas.offsetTop + this.canvas.height / 2,
                linesCleared * 15
            );
            
            // Play line clear sound
            this.sounds.lineClear();
            
            // Animate score elements
            this.animateScore(document.getElementById('score'));
            this.animateScore(document.getElementById('lines'));
            if (this.level > Math.floor((this.lines - linesCleared) / 10) + 1) {
                this.animateScore(document.getElementById('level'));
                this.pulseElement(document.querySelector('.game-viewport'));
                this.sounds.levelUp();
            }
            
            this.updateDisplay();
        }
    }
    
    updateDisplay() {
        // Format numbers with leading zeros for that retro feel
        document.getElementById('score').textContent = this.score.toString().padStart(7, '0');
        document.getElementById('level').textContent = this.level.toString().padStart(2, '0');
        document.getElementById('lines').textContent = this.lines.toString().padStart(3, '0');
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawBlock(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            this.currentPiece.color
                        );
                    }
                }
            }
        }
        
        // Draw grid
        this.drawGrid();
    }
    
    drawBlock(x, y, color) {
        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;
        
        // Enable pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        
        // Convert color to monochrome for 2001: A Space Odyssey aesthetic
        const monochromeColor = this.convertToMonochrome(color);
        
        // Draw main block
        this.ctx.fillStyle = monochromeColor;
        this.ctx.fillRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // Add minimal border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // Add subtle highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, 1);
        
        // Add subtle shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(pixelX + 1, pixelY + this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2, 1);
    }
    
    convertToMonochrome(color) {
        // Convert any color to a monochrome shade based on brightness
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate brightness
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
        
        // Convert to grayscale
        const gray = Math.round(brightness);
        const grayHex = gray.toString(16).padStart(2, '0');
        
        return `#${grayHex}${grayHex}${grayHex}`;
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }
    
    drawGrid() {
        // Enable pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        
        // Draw minimal grid for 2001: A Space Odyssey aesthetic
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.BOARD_HEIGHT * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.BOARD_WIDTH * this.BLOCK_SIZE, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        // Add minimal border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.BOARD_WIDTH * this.BLOCK_SIZE, this.BOARD_HEIGHT * this.BLOCK_SIZE);
    }
    
    drawNextPiece() {
        // Enable pixel-perfect rendering
        this.nextCtx.imageSmoothingEnabled = false;
        
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const canvasSize = Math.min(this.nextCanvas.width, this.nextCanvas.height);
            const blockSize = canvasSize / 6; // Scale based on canvas size
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        const pixelX = offsetX + x * blockSize;
                        const pixelY = offsetY + y * blockSize;
                        
                        // Convert to monochrome for 2001: A Space Odyssey aesthetic
                        const monochromeColor = this.convertToMonochrome(this.nextPiece.color);
                        
                        // Draw main block
                        this.nextCtx.fillStyle = monochromeColor;
                        this.nextCtx.fillRect(pixelX, pixelY, blockSize, blockSize);
                        
                        // Add minimal border
                        this.nextCtx.strokeStyle = '#ffffff';
                        this.nextCtx.lineWidth = 0.5;
                        this.nextCtx.strokeRect(pixelX, pixelY, blockSize, blockSize);
                        
                        // Add subtle highlight
                        this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                        this.nextCtx.fillRect(pixelX + 0.5, pixelY + 0.5, blockSize - 1, 0.5);
                        
                        // Add subtle shadow
                        this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                        this.nextCtx.fillRect(pixelX + 0.5, pixelY + blockSize - 1, blockSize - 1, 0.5);
                    }
                }
            }
        }
    }
    
    startGame() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.gameLoop = setInterval(() => this.update(), 16); // ~60 FPS
        }
    }
    
    togglePause() {
        if (this.gameRunning) {
            this.gameRunning = false;
            clearInterval(this.gameLoop);
        } else {
            this.startGame();
        }
    }
    
    resetGame() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        
        this.generateNextPiece();
        this.spawnPiece();
        this.updateDisplay();
        this.draw();
    }
    
    update() {
        if (!this.gameRunning) return;
        
        this.dropTime += 16;
        
        if (this.dropTime >= this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = 0;
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        
        // Add massive juice for game over
        this.addScreenShake(3);
        this.flashScreen();
        this.createBombasticExplosion(
            this.canvas.offsetLeft + this.canvas.width / 2,
            this.canvas.offsetTop + this.canvas.height / 2,
            3
        );
        
        // Play game over sound
        this.sounds.gameOver();
        
        // Show game over screen after effects
        setTimeout(() => {
            this.showGameOverScreen();
        }, 1500);
    }
    
    showGameOverScreen() {
        this.gameScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        
        // Update final score display
        document.getElementById('finalScore').textContent = this.score.toString().padStart(7, '0');
        document.getElementById('finalLevel').textContent = this.level.toString().padStart(2, '0');
        document.getElementById('finalLines').textContent = this.lines.toString().padStart(3, '0');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TetrisGame();
});
