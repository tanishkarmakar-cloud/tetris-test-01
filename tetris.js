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
        
        const containerWidth = gameViewport.clientWidth - 32; // Account for padding
        const containerHeight = gameViewport.clientHeight - 32;
        
        // Calculate optimal canvas size
        const aspectRatio = this.BOARD_WIDTH / this.BOARD_HEIGHT;
        let canvasWidth, canvasHeight;
        
        if (containerWidth / containerHeight > aspectRatio) {
            // Container is wider than needed
            canvasHeight = Math.min(containerHeight, 600);
            canvasWidth = canvasHeight * aspectRatio;
        } else {
            // Container is taller than needed
            canvasWidth = Math.min(containerWidth, 300);
            canvasHeight = canvasWidth / aspectRatio;
        }
        
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
            const nextSize = Math.min(nextContainer.clientWidth - 16, nextContainer.clientHeight - 16, 120);
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
        document.getElementById('playBtn').addEventListener('click', () => this.showGameScreen());
        document.getElementById('instructionsBtn').addEventListener('click', () => this.showInstructions());
        document.getElementById('closeInstructions').addEventListener('click', () => this.hideInstructions());
        document.getElementById('backToMenu').addEventListener('click', () => this.showMainMenu());
        
        // Game control events
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        
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
    
    // UI Management Methods
    showMainMenu() {
        this.mainMenu.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.hideInstructions();
        this.pauseGame();
    }
    
    showGameScreen() {
        this.mainMenu.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.resizeCanvas();
        this.canvas.focus();
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
        if (!this.gameRunning || !this.currentPiece) return;
        
        switch(e.code) {
            case 'ArrowLeft':
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                this.rotatePiece();
                break;
            case 'Space':
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
            this.updateDisplay();
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
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
        
        // Create gradient for spaceship terminal effect
        const gradient = this.ctx.createLinearGradient(pixelX, pixelY, pixelX + this.BLOCK_SIZE, pixelY + this.BLOCK_SIZE);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, this.lightenColor(color, 20));
        gradient.addColorStop(1, this.darkenColor(color, 20));
        
        // Draw main block with gradient
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // Add spaceship terminal border
        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // Add inner glow
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
        
        // Add terminal-style highlights
        this.ctx.fillStyle = 'rgba(0, 212, 255, 0.4)';
        this.ctx.fillRect(pixelX + 2, pixelY + 2, this.BLOCK_SIZE - 4, 2);
        
        // Add terminal-style shadows
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(pixelX + 2, pixelY + this.BLOCK_SIZE - 4, this.BLOCK_SIZE - 4, 2);
        
        // Add corner highlights for terminal effect
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
        this.ctx.fillRect(pixelX + 1, pixelY + 1, 2, 2);
        this.ctx.fillRect(pixelX + this.BLOCK_SIZE - 3, pixelY + 1, 2, 2);
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
        
        // Draw spaceship terminal grid
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
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
        
        // Add spaceship terminal border with glow
        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, 0, this.BOARD_WIDTH * this.BLOCK_SIZE, this.BOARD_HEIGHT * this.BLOCK_SIZE);
        
        // Add inner glow border
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(1, 1, this.BOARD_WIDTH * this.BLOCK_SIZE - 2, this.BOARD_HEIGHT * this.BLOCK_SIZE - 2);
        
        // Add corner highlights for terminal effect
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        this.ctx.fillRect(0, 0, 4, 4);
        this.ctx.fillRect(this.BOARD_WIDTH * this.BLOCK_SIZE - 4, 0, 4, 4);
        this.ctx.fillRect(0, this.BOARD_HEIGHT * this.BLOCK_SIZE - 4, 4, 4);
        this.ctx.fillRect(this.BOARD_WIDTH * this.BLOCK_SIZE - 4, this.BOARD_HEIGHT * this.BLOCK_SIZE - 4, 4, 4);
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
                        
                        // Create gradient for spaceship terminal effect
                        const gradient = this.nextCtx.createLinearGradient(pixelX, pixelY, pixelX + blockSize, pixelY + blockSize);
                        gradient.addColorStop(0, this.nextPiece.color);
                        gradient.addColorStop(0.5, this.lightenColor(this.nextPiece.color, 20));
                        gradient.addColorStop(1, this.darkenColor(this.nextPiece.color, 20));
                        
                        // Draw main block with gradient
                        this.nextCtx.fillStyle = gradient;
                        this.nextCtx.fillRect(pixelX, pixelY, blockSize, blockSize);
                        
                        // Add spaceship terminal border
                        this.nextCtx.strokeStyle = '#00d4ff';
                        this.nextCtx.lineWidth = 1;
                        this.nextCtx.strokeRect(pixelX, pixelY, blockSize, blockSize);
                        
                        // Add inner glow
                        this.nextCtx.strokeStyle = '#00ffff';
                        this.nextCtx.lineWidth = 0.5;
                        this.nextCtx.strokeRect(pixelX + 0.5, pixelY + 0.5, blockSize - 1, blockSize - 1);
                        
                        // Add terminal-style highlights
                        this.nextCtx.fillStyle = 'rgba(0, 212, 255, 0.4)';
                        this.nextCtx.fillRect(pixelX + 1, pixelY + 1, blockSize - 2, 1);
                        
                        // Add terminal-style shadows
                        this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                        this.nextCtx.fillRect(pixelX + 1, pixelY + blockSize - 2, blockSize - 2, 1);
                        
                        // Add corner highlights for terminal effect
                        this.nextCtx.fillStyle = 'rgba(0, 255, 255, 0.6)';
                        this.nextCtx.fillRect(pixelX + 0.5, pixelY + 0.5, 1, 1);
                        this.nextCtx.fillRect(pixelX + blockSize - 1.5, pixelY + 0.5, 1, 1);
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
        alert(`Game Over! Final Score: ${this.score}`);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TetrisGame();
});
