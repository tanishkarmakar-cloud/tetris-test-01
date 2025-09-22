/**
 * Tetris Game - Professional Implementation
 * Features: 4:3 aspect ratio, ghost piece, rhythmic music, monochrome aesthetic
 */

class TetrisGame {
    constructor() {
        // Canvas and rendering
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // Game constants
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        // Game state
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gameLoop = null;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        // UI elements
        this.mainMenu = document.getElementById('mainMenu');
        this.gameScreen = document.getElementById('gameScreen');
        this.instructionsModal = document.getElementById('instructionsModal');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.gameContainer = document.getElementById('gameContainer');
        this.particleContainer = document.getElementById('particleContainer');
        this.explosionContainer = document.getElementById('explosionContainer');
        
        // Effects and audio
        this.sounds = this.initSounds();
        this.metronomeInterval = null;
        this.beatCount = 0;
        
        // Performance optimization
        this.lastFrameTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        
        // Tetris pieces (Tetrominoes) - using standard Tetris piece definitions
        this.pieces = [
            {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#800080' // T piece
            },
            {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#ffff00' // O piece
            },
            {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0],
                    [0, 0, 0]
                ],
                color: '#00ff00' // S piece
            },
            {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1],
                    [0, 0, 0]
                ],
                color: '#ff0000' // Z piece
            },
            {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#ffa500' // J piece
            },
            {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#0000ff' // L piece
            },
            {
                shape: [
                    [1, 1, 1, 1]
                ],
                color: '#00ffff' // I piece
            }
        ];
        
        this.init();
    }
    
    /**
     * Initialize the game
     */
    init() {
        this.setupEventListeners();
        this.setupResponsiveCanvas();
        this.generateNextPiece();
        this.spawnPiece();
        this.updateDisplay();
        this.draw();
        
        // Debug: Log next piece info
        console.log('Next piece generated:', this.nextPiece);
        console.log('Next canvas size:', this.nextCanvas.width, 'x', this.nextCanvas.height);
    }
    
    /**
     * Setup responsive canvas sizing
     */
    setupResponsiveCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    /**
     * Resize canvas to maintain 4:3 aspect ratio
     */
    resizeCanvas() {
        const gameBoard = document.querySelector('.game-board');
        if (!gameBoard) return;
        
        const containerWidth = gameBoard.clientWidth - 20; // Account for padding
        const containerHeight = gameBoard.clientHeight - 20; // Account for padding
        
        // Calculate optimal canvas size for 4:3 aspect ratio
        const targetAspectRatio = 4 / 3;
        const containerAspectRatio = containerWidth / containerHeight;
        
        let canvasWidth, canvasHeight;
        
        if (containerAspectRatio > targetAspectRatio) {
            canvasHeight = containerHeight;
            canvasWidth = canvasHeight * targetAspectRatio;
        } else {
            canvasWidth = containerWidth;
            canvasHeight = canvasWidth / targetAspectRatio;
        }
        
        // Ensure canvas dimensions are integers
        canvasWidth = Math.floor(canvasWidth);
        canvasHeight = Math.floor(canvasHeight);

        // Calculate block size first
        this.BLOCK_SIZE = Math.floor(canvasWidth / this.BOARD_WIDTH);
        
        // Recalculate canvas size based on actual block size to ensure perfect fit
        const actualCanvasWidth = this.BLOCK_SIZE * this.BOARD_WIDTH;
        const actualCanvasHeight = this.BLOCK_SIZE * this.BOARD_HEIGHT;
        
        // Ensure the canvas fits within the container
        if (actualCanvasWidth > containerWidth) {
            this.BLOCK_SIZE = Math.floor(containerWidth / this.BOARD_WIDTH);
        }
        if (actualCanvasHeight > containerHeight) {
            this.BLOCK_SIZE = Math.floor(containerHeight / this.BOARD_HEIGHT);
        }
        
        // Final canvas dimensions
        const finalCanvasWidth = this.BLOCK_SIZE * this.BOARD_WIDTH;
        const finalCanvasHeight = this.BLOCK_SIZE * this.BOARD_HEIGHT;
        
        this.canvas.width = finalCanvasWidth;
        this.canvas.height = finalCanvasHeight;
        this.canvas.style.width = finalCanvasWidth + 'px';
        this.canvas.style.height = finalCanvasHeight + 'px';
        
        // Resize next piece canvas
        this.resizeNextCanvas();
        
        // Redraw if game is initialized
        if (this.currentPiece !== null) {
            this.draw();
            this.drawNextPiece();
        }
    }
    
    /**
     * Resize next piece canvas
     */
    resizeNextCanvas() {
        const nextContainer = document.querySelector('.next-piece-container');
        if (nextContainer) {
            const containerWidth = nextContainer.clientWidth;
            const containerHeight = nextContainer.clientHeight;
            const nextSize = Math.min(containerWidth - 8, containerHeight - 8, 100);
            
            // Ensure minimum size
            const finalSize = Math.max(nextSize, 40);
            
            this.nextCanvas.width = finalSize;
            this.nextCanvas.height = finalSize;
            this.nextCanvas.style.width = finalSize + 'px';
            this.nextCanvas.style.height = finalSize + 'px';
            
            // Force redraw
            this.drawNextPiece();
        }
    }
    
    /**
     * Setup event listeners
     */
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
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.sounds.button();
            this.resetGame();
        });
        
        // Game over screen events
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.sounds.button();
            this.showGameScreen();
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
            this.handleKeyPress(e);
        });
        
        // Focus management
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();
        
        document.addEventListener('click', (e) => {
            if (this.gameScreen && !this.gameScreen.classList.contains('hidden')) {
                this.canvas.focus();
            }
        });
        
        // Modal events
        this.instructionsModal.addEventListener('click', (e) => {
            if (e.target === this.instructionsModal) {
                this.hideInstructions();
            }
        });
    }
    
    /**
     * Initialize sound system
     */
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
            },
            metronome: () => createTone(440, 0.05, 'sine'),
            // Rhythmic music tones
            kick: () => createTone(60, 0.2, 'sawtooth'),
            snare: () => createTone(200, 0.1, 'square'),
            hihat: () => createTone(800, 0.05, 'square'),
            bass: () => createTone(80, 0.3, 'sawtooth'),
            lead: () => createTone(440, 0.2, 'sine')
        };
    }
    
    /**
     * Start rhythmic metronome
     */
    startMetronome() {
        if (this.metronomeInterval) return;
        
        this.metronomeInterval = setInterval(() => {
            this.beatCount++;
            
            // Create rhythmic pattern
            if (this.beatCount % 4 === 1) {
                this.sounds.kick();
                this.sounds.metronome();
            } else if (this.beatCount % 4 === 3) {
                this.sounds.snare();
                this.sounds.metronome();
            } else {
                this.sounds.metronome();
            }
            
            // Add hihat on off-beats
            if (this.beatCount % 2 === 0) {
                setTimeout(() => this.sounds.hihat(), 250);
            }
        }, 500);
    }
    
    /**
     * Stop metronome
     */
    stopMetronome() {
        if (this.metronomeInterval) {
            clearInterval(this.metronomeInterval);
            this.metronomeInterval = null;
        }
    }
    
    /**
     * Handle keyboard input
     */
    handleKeyPress(e) {
        if (e.code === 'KeyP') {
            this.sounds.button();
            this.togglePause();
            return;
        }
        
        if (!this.gameRunning || !this.currentPiece) return;
        
        switch(e.code) {
            case 'ArrowLeft':
                this.sounds.hihat();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.sounds.hihat();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                this.sounds.bass();
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                this.sounds.lead();
                this.rotatePiece();
                break;
            case 'Space':
                this.sounds.kick();
                this.hardDrop();
                break;
        }
    }
    
    /**
     * Generate next piece
     */
    generateNextPiece() {
        const randomIndex = Math.floor(Math.random() * this.pieces.length);
        this.nextPiece = {
            ...this.pieces[randomIndex],
            x: Math.floor((this.BOARD_WIDTH - this.pieces[randomIndex].shape[0].length) / 2),
            y: 0
        };
        // Draw the next piece immediately
        this.drawNextPiece();
    }
    
    /**
     * Spawn current piece
     */
    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.generateNextPiece();
        
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.gameOver();
        }
        this.drawNextPiece();
    }
    
    /**
     * Check collision for piece movement
     */
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
                        (boardY >= 0 && this.board[boardY][boardX] !== 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    /**
     * Move piece
     */
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
    
    /**
     * Rotate piece
     */
    rotatePiece() {
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        
        this.currentPiece.shape = rotated;
        
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.currentPiece.shape = originalShape;
        } else {
            this.draw();
            this.addScreenShake(0.3);
        }
    }
    
    /**
     * Rotate matrix 90 degrees clockwise
     */
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                rotated[x][rows - 1 - y] = matrix[y][x];
            }
        }
        
        return rotated;
    }
    
    /**
     * Hard drop piece
     */
    hardDrop() {
        while (!this.checkCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
        }
        this.placePiece();
        this.addScreenShake(1);
        this.flashScreen();
    }
    
    /**
     * Place piece on board
     */
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
        
        this.addScreenShake(0.7);
        this.createSnazzyParticles(
            this.canvas.offsetLeft + this.canvas.width / 2,
            this.canvas.offsetTop + this.canvas.height / 2,
            10
        );
        
        this.clearLines();
        this.spawnPiece();
    }
    
    /**
     * Clear completed lines
     */
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
            
            // Add bombastic explosion effects
            this.addScreenShake(linesCleared > 2 ? 3 : 2);
            this.flashScreen();
            this.createBombasticExplosion(
                this.canvas.offsetLeft + this.canvas.width / 2,
                this.canvas.offsetTop + this.canvas.height / 2,
                linesCleared
            );
            
            this.createSnazzyParticles(
                this.canvas.offsetLeft + this.canvas.width / 2,
                this.canvas.offsetTop + this.canvas.height / 2,
                linesCleared * 20
            );
            
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
    
    /**
     * Update display elements
     */
    updateDisplay() {
        document.getElementById('score').textContent = this.score.toString().padStart(7, '0');
        document.getElementById('level').textContent = this.level.toString().padStart(2, '0');
        document.getElementById('lines').textContent = this.lines.toString().padStart(3, '0');
    }
    
    /**
     * Main draw function
     */
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x] !== 0) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }
        
        // Draw ghost piece
        if (this.currentPiece) {
            const ghostY = this.getGhostPieceY();
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawGhostBlock(this.currentPiece.x + x, ghostY + y);
                    }
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
    
    /**
     * Draw a game block
     */
    drawBlock(x, y, color) {
        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;
        
        this.ctx.imageSmoothingEnabled = false;
        const monochromeColor = this.convertToMonochrome(color);
        
        // Draw main block
        this.ctx.fillStyle = monochromeColor;
        this.ctx.fillRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // Add border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // Add highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, 1);
        
        // Add shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(pixelX + 1, pixelY + this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2, 1);
    }
    
    /**
     * Draw ghost block
     */
    drawGhostBlock(x, y) {
        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;
        
        this.ctx.imageSmoothingEnabled = false;
        
        // Draw ghost block with dashed border
        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([4, 4]);
        this.ctx.strokeRect(pixelX + 2, pixelY + 2, this.BLOCK_SIZE - 4, this.BLOCK_SIZE - 4);
        this.ctx.setLineDash([]);
        
        // Add subtle fill
        this.ctx.fillStyle = 'rgba(102, 102, 102, 0.1)';
        this.ctx.fillRect(pixelX + 2, pixelY + 2, this.BLOCK_SIZE - 4, this.BLOCK_SIZE - 4);
    }
    
    /**
     * Get ghost piece Y position
     */
    getGhostPieceY() {
        if (!this.currentPiece) return 0;
        
        let ghostY = this.currentPiece.y;
        while (this.isValidMove(0, 1, this.currentPiece.shape, ghostY + 1)) {
            ghostY++;
        }
        return ghostY;
    }
    
    /**
     * Check if move is valid
     */
    isValidMove(offsetX, offsetY, shape, testY = null) {
        const testX = this.currentPiece.x + offsetX;
        const testYPos = testY !== null ? testY : this.currentPiece.y + offsetY;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardX = testX + x;
                    const boardY = testYPos + y;
                    
                    if (boardX < 0 || boardX >= this.BOARD_WIDTH ||
                        boardY < 0 || boardY >= this.BOARD_HEIGHT ||
                        (boardY >= 0 && this.board[boardY][boardX] !== 0)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    /**
     * Convert color to monochrome
     */
    convertToMonochrome(color) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
        const gray = Math.round(brightness);
        const grayHex = gray.toString(16).padStart(2, '0');
        
        return `#${grayHex}${grayHex}${grayHex}`;
    }
    
    /**
     * Draw game grid
     */
    drawGrid() {
        this.ctx.imageSmoothingEnabled = false;
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
        
        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.BOARD_WIDTH * this.BLOCK_SIZE, this.BOARD_HEIGHT * this.BLOCK_SIZE);
    }
    
    /**
     * Draw next piece
     */
    drawNextPiece() {
        if (!this.nextCtx || !this.nextCanvas) return;
        
        this.nextCtx.imageSmoothingEnabled = false;
        this.nextCtx.fillStyle = '#000000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const canvasSize = Math.min(this.nextCanvas.width, this.nextCanvas.height);
            const blockSize = Math.max(canvasSize / 4, 8); // Larger minimum block size
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        const pixelX = Math.floor(offsetX + x * blockSize);
                        const pixelY = Math.floor(offsetY + y * blockSize);
                        const blockWidth = Math.max(blockSize - 2, 2);
                        const blockHeight = Math.max(blockSize - 2, 2);
                        
                        const monochromeColor = this.convertToMonochrome(this.nextPiece.color);
                        
                        // Draw main block
                        this.nextCtx.fillStyle = monochromeColor;
                        this.nextCtx.fillRect(pixelX, pixelY, blockWidth, blockHeight);
                        
                        // Draw border
                        this.nextCtx.strokeStyle = '#ffffff';
                        this.nextCtx.lineWidth = 1;
                        this.nextCtx.strokeRect(pixelX, pixelY, blockWidth, blockHeight);
                        
                        // Draw highlight
                        this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        this.nextCtx.fillRect(pixelX + 1, pixelY + 1, blockWidth - 2, 1);
                        
                        // Draw shadow
                        this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                        this.nextCtx.fillRect(pixelX + 1, pixelY + blockHeight - 1, blockWidth - 2, 1);
                    }
                }
            }
        }
    }
    
    /**
     * Start game
     */
    startGame() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.gameLoop = setInterval(() => this.update(), 16);
            this.startMetronome();
        }
    }
    
    /**
     * Toggle pause
     */
    togglePause() {
        if (this.gameRunning) {
            this.gameRunning = false;
            clearInterval(this.gameLoop);
            this.stopMetronome();
        } else {
            this.startGame();
        }
    }
    
    /**
     * Reset game
     */
    resetGame() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        this.stopMetronome();
        
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
    
    /**
     * Game update loop
     */
    update() {
        if (!this.gameRunning) return;
        
        this.dropTime += 16;
        
        if (this.dropTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = 0;
        }
    }
    
    /**
     * Game over
     */
    gameOver() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        
        this.addScreenShake(3);
        this.flashScreen();
        this.createBombasticExplosion(
            this.canvas.offsetLeft + this.canvas.width / 2,
            this.canvas.offsetTop + this.canvas.height / 2,
            3
        );
        
        this.sounds.gameOver();
        
        setTimeout(() => {
            this.showGameOverScreen();
        }, 1500);
    }
    
    /**
     * Show game over screen
     */
    showGameOverScreen() {
        this.gameScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        
        document.getElementById('finalScore').textContent = this.score.toString().padStart(7, '0');
        document.getElementById('finalLevel').textContent = this.level.toString().padStart(2, '0');
        document.getElementById('finalLines').textContent = this.lines.toString().padStart(3, '0');
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
        
        // Reset game state when showing game screen
        this.resetGame();
        this.startGame();
        
        // Ensure next piece is drawn
        setTimeout(() => {
            this.drawNextPiece();
        }, 100);
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
            this.stopMetronome();
        }
    }
    
    // Juice Effects
    addScreenShake(intensity = 1) {
        this.gameContainer.classList.remove('shake', 'shake-strong', 'shake-explosion');
        if (intensity > 2) {
            this.gameContainer.classList.add('shake-explosion');
        } else if (intensity > 1) {
            this.gameContainer.classList.add('shake-strong');
        } else {
            this.gameContainer.classList.add('shake');
        }
        
        setTimeout(() => {
            this.gameContainer.classList.remove('shake', 'shake-strong', 'shake-explosion');
        }, intensity > 2 ? 1200 : intensity > 1 ? 800 : 500);
    }
    
    createSnazzyParticles(x, y, count = 15) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const velocity = 30 + Math.random() * 80;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.setProperty('--vx', vx + 'px');
            particle.style.setProperty('--vy', vy + 'px');
            
            const size = 2 + Math.random() * 4;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.opacity = 0.6 + Math.random() * 0.4;
            
            this.particleContainer.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 800 + Math.random() * 400);
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
            
            const colors = ['#ffffff', '#cccccc', '#999999', '#666666'];
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
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TetrisGame();
});