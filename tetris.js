/**
 * Tetris Game - 80s Minimalism Edition
 * Features: Hold piece, ghost piece, proper Tetris mechanics, visual effects
 */

class TetrisGame {
    constructor() {
        // Canvas and rendering
        this.canvas = document.getElementById('gameCanvas');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.holdCanvas = document.getElementById('holdCanvas');
        
        if (!this.canvas || !this.nextCanvas || !this.holdCanvas) {
            console.error('Canvas elements not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        // Set canvas properties for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        this.nextCtx.imageSmoothingEnabled = false;
        this.holdCtx.imageSmoothingEnabled = false;
        
        // Game constants
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 20;
        
        // Game state
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gameLoopId = null;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        // UI elements
        this.mainMenu = document.getElementById('mainMenu');
        this.gameScreen = document.getElementById('gameScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.gameContainer = document.getElementById('gameContainer');
        this.particleContainer = document.getElementById('particleContainer');
        this.explosionContainer = document.getElementById('explosionContainer');
        
        // Effects and audio
        this.sounds = this.initSounds();
        this.metronomeInterval = null;
        this.beatCount = 0;
        
        // Tetris pieces (Tetrominoes) - Standard Tetris piece definitions
        this.pieces = [
            {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#ffffff' // T piece
            },
            {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#ffffff' // O piece
            },
            {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0],
                    [0, 0, 0]
                ],
                color: '#ffffff' // S piece
            },
            {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1],
                    [0, 0, 0]
                ],
                color: '#ffffff' // Z piece
            },
            {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#ffffff' // J piece
            },
            {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#ffffff' // L piece
            },
            {
                shape: [
                    [1, 1, 1, 1]
                ],
                color: '#ffffff' // I piece
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
        this.updateDisplay();
    }
    
    /**
     * Setup responsive canvas sizing
     */
    setupResponsiveCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        const gameBoard = document.querySelector('.game-board');
        if (!gameBoard) {
            console.warn('Game board not found, using fallback sizing');
            this.BLOCK_SIZE = 20;
            this.canvas.width = this.BLOCK_SIZE * this.BOARD_WIDTH;
            this.canvas.height = this.BLOCK_SIZE * this.BOARD_HEIGHT;
            this.canvas.style.width = this.canvas.width + 'px';
            this.canvas.style.height = this.canvas.height + 'px';
            return;
        }
        
        const containerWidth = gameBoard.clientWidth - 20; // Account for padding
        const containerHeight = gameBoard.clientHeight - 20; // Account for padding
        
        // Calculate block size based on container
        const maxBlockSize = Math.min(
            Math.floor(containerWidth / this.BOARD_WIDTH),
            Math.floor(containerHeight / this.BOARD_HEIGHT)
        );
        
        this.BLOCK_SIZE = Math.max(maxBlockSize, 8);
        
        // Set canvas dimensions
        const canvasWidth = this.BLOCK_SIZE * this.BOARD_WIDTH;
        const canvasHeight = this.BLOCK_SIZE * this.BOARD_HEIGHT;
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
        
        // Resize other canvases
        this.resizeNextCanvas();
        this.resizeHoldCanvas();
        
        // Redraw if game is running
        if (this.gameRunning) {
            this.draw();
            this.drawNextPiece();
            this.drawHoldPiece();
        }
    }
    
    /**
     * Resize next piece canvas
     */
    resizeNextCanvas() {
        const nextBox = document.querySelector('.next-box');
        if (nextBox) {
            const size = Math.min(nextBox.clientWidth - 20, nextBox.clientHeight - 20, 80);
            this.nextCanvas.width = size;
            this.nextCanvas.height = size;
            this.nextCanvas.style.width = size + 'px';
            this.nextCanvas.style.height = size + 'px';
        }
    }
    
    /**
     * Resize hold piece canvas
     */
    resizeHoldCanvas() {
        const holdBox = document.querySelector('.hold-box');
        if (holdBox) {
            const size = Math.min(holdBox.clientWidth - 20, holdBox.clientHeight - 20, 80);
            this.holdCanvas.width = size;
            this.holdCanvas.height = size;
            this.holdCanvas.style.width = size + 'px';
            this.holdCanvas.style.height = size + 'px';
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
        
        document.getElementById('menuBtn').addEventListener('click', () => {
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
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyC', 'KeyP'].includes(e.code)) {
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
            case 'KeyC':
                this.sounds.button();
                this.holdCurrentPiece();
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
        this.drawNextPiece();
    }
    
    /**
     * Spawn current piece
     */
    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.generateNextPiece();
        this.canHold = true;
        
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.gameOver();
        }
        this.draw();
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
     * Hold current piece
     */
    holdCurrentPiece() {
        if (!this.canHold) return;
        
        if (this.holdPiece === null) {
            this.holdPiece = {
                ...this.currentPiece,
                x: Math.floor((this.BOARD_WIDTH - this.currentPiece.shape[0].length) / 2),
                y: 0
            };
            this.spawnPiece();
        } else {
            const temp = this.holdPiece;
            this.holdPiece = {
                ...this.currentPiece,
                x: Math.floor((this.BOARD_WIDTH - this.currentPiece.shape[0].length) / 2),
                y: 0
            };
            this.currentPiece = temp;
        }
        
        this.canHold = false;
        this.draw();
        this.drawHoldPiece();
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
        this.createParticles(
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
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            
            this.addScreenShake(linesCleared > 2 ? 3 : 2);
            this.flashScreen();
            this.createExplosion(
                this.canvas.offsetLeft + this.canvas.width / 2,
                this.canvas.offsetTop + this.canvas.height / 2,
                linesCleared
            );
            
            this.sounds.lineClear();
            
            if (this.level > Math.floor((this.lines - linesCleared) / 10) + 1) {
                this.sounds.levelUp();
            }
            
            this.updateDisplay();
        }
    }
    
    /**
     * Update display elements
     */
    updateDisplay() {
        document.getElementById('score').textContent = this.score.toString().padStart(6, '0');
        document.getElementById('level').textContent = this.level.toString().padStart(2, '0');
        document.getElementById('lines').textContent = this.lines.toString().padStart(3, '0');
    }
    
    /**
     * Main draw function
     */
    draw() {
        if (!this.ctx || !this.canvas) {
            console.error('Canvas context not available');
            return;
        }
        
        // Clear canvas
        this.ctx.fillStyle = '#000000';
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
        
        // Draw main block
        this.ctx.fillStyle = '#ffffff';
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
        while (!this.checkCollision(this.currentPiece, 0, ghostY - this.currentPiece.y + 1)) {
            ghostY++;
        }
        return ghostY;
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
    }
    
    /**
     * Draw next piece
     */
    drawNextPiece() {
        if (!this.nextCtx || !this.nextCanvas || !this.nextPiece) return;
        
        this.nextCtx.imageSmoothingEnabled = false;
        this.nextCtx.fillStyle = '#000000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const canvasSize = Math.min(this.nextCanvas.width, this.nextCanvas.height);
        const blockSize = Math.max(canvasSize / 4, 8);
        const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
        
        for (let y = 0; y < this.nextPiece.shape.length; y++) {
            for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                if (this.nextPiece.shape[y][x]) {
                    const pixelX = Math.floor(offsetX + x * blockSize);
                    const pixelY = Math.floor(offsetY + y * blockSize);
                    const blockWidth = Math.max(blockSize - 2, 2);
                    const blockHeight = Math.max(blockSize - 2, 2);
                    
                    // Draw main block
                    this.nextCtx.fillStyle = '#ffffff';
                    this.nextCtx.fillRect(pixelX, pixelY, blockWidth, blockHeight);
                    
                    // Draw border
                    this.nextCtx.strokeStyle = '#ffffff';
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.strokeRect(pixelX, pixelY, blockWidth, blockHeight);
                }
            }
        }
    }
    
    /**
     * Draw hold piece
     */
    drawHoldPiece() {
        if (!this.holdCtx || !this.holdCanvas) return;
        
        this.holdCtx.imageSmoothingEnabled = false;
        this.holdCtx.fillStyle = '#000000';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (!this.holdPiece) return;
        
        const canvasSize = Math.min(this.holdCanvas.width, this.holdCanvas.height);
        const blockSize = Math.max(canvasSize / 4, 8);
        const offsetX = (this.holdCanvas.width - this.holdPiece.shape[0].length * blockSize) / 2;
        const offsetY = (this.holdCanvas.height - this.holdPiece.shape.length * blockSize) / 2;
        
        for (let y = 0; y < this.holdPiece.shape.length; y++) {
            for (let x = 0; x < this.holdPiece.shape[y].length; x++) {
                if (this.holdPiece.shape[y][x]) {
                    const pixelX = Math.floor(offsetX + x * blockSize);
                    const pixelY = Math.floor(offsetY + y * blockSize);
                    const blockWidth = Math.max(blockSize - 2, 2);
                    const blockHeight = Math.max(blockSize - 2, 2);
                    
                    // Draw main block
                    this.holdCtx.fillStyle = '#ffffff';
                    this.holdCtx.fillRect(pixelX, pixelY, blockWidth, blockHeight);
                    
                    // Draw border
                    this.holdCtx.strokeStyle = '#ffffff';
                    this.holdCtx.lineWidth = 1;
                    this.holdCtx.strokeRect(pixelX, pixelY, blockWidth, blockHeight);
                }
            }
        }
    }
    
    /**
     * Game loop
     */
    gameLoop() {
        if (!this.gameRunning) return;
        
        const currentTime = Date.now();
        if (currentTime - this.dropTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = currentTime;
        }
        
        this.draw();
        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Start game
     */
    startGame() {
        this.gameRunning = true;
        this.dropTime = Date.now();
        this.gameLoop();
    }
    
    /**
     * Pause game
     */
    pauseGame() {
        this.gameRunning = false;
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }
    
    /**
     * Toggle pause
     */
    togglePause() {
        if (this.gameRunning) {
            this.pauseGame();
        } else {
            this.startGame();
        }
    }
    
    /**
     * Reset game
     */
    resetGame() {
        this.gameRunning = false;
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        this.updateDisplay();
        this.draw();
        this.drawNextPiece();
        this.drawHoldPiece();
    }
    
    /**
     * Game over
     */
    gameOver() {
        this.gameRunning = false;
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
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
        
        document.getElementById('finalScore').textContent = this.score.toString().padStart(6, '0');
        document.getElementById('finalLevel').textContent = this.level.toString().padStart(2, '0');
        document.getElementById('finalLines').textContent = this.lines.toString().padStart(3, '0');
    }
    
    // UI Management Methods
    showMainMenu() {
        this.mainMenu.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.pauseGame();
    }
    
    showGameScreen() {
        this.mainMenu.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
        
        // Wait for DOM to update, then resize and start
        setTimeout(() => {
            this.resizeCanvas();
            this.canvas.focus();
            
            this.resetGame();
            this.generateNextPiece();
            this.spawnPiece();
            this.startGame();
        }, 100);
    }
    
    // Effects
    addScreenShake(intensity) {
        this.gameContainer.classList.add('shake');
        setTimeout(() => this.gameContainer.classList.remove('shake'), 300 * intensity);
    }
    
    flashScreen() {
        const gameBoard = document.querySelector('.game-board');
        gameBoard.classList.add('flash');
        setTimeout(() => gameBoard.classList.remove('flash'), 400);
    }
    
    createParticles(x, y, count) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            this.particleContainer.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1200);
        }
    }
    
    createExplosion(x, y, intensity) {
        for (let i = 0; i < intensity * 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.setProperty('--vx', (Math.random() - 0.5) * 200 + 'px');
            particle.style.setProperty('--vy', (Math.random() - 0.5) * 200 + 'px');
            this.explosionContainer.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1800);
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TetrisGame();
});