/**
 * Tetris Game - 80s Minimalism Edition
 * Comprehensive Tetris implementation with modern features
 * Features: Hold piece, ghost piece, proper scoring, visual effects, mobile support
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
        this.highScore = this.loadHighScore();
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameLoopId = null;
        this.dropTime = 0;
        this.dropInterval = 1000;
        this.lastMoveTime = 0;
        this.moveDelay = 50; // Prevent rapid movement
        
        // UI elements
        this.mainMenu = document.getElementById('mainMenu');
        this.instructionsScreen = document.getElementById('instructionsScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.gameContainer = document.querySelector('.game-container');
        this.particleContainer = document.getElementById('particleContainer');
        this.explosionContainer = document.getElementById('explosionContainer');
        this.scorePopupContainer = document.getElementById('scorePopupContainer');
        this.mobileControls = document.getElementById('mobileControls');
        
        // Effects and audio
        this.sounds = this.initSounds();
        this.isMobile = this.detectMobile();
        
        // Tetris pieces (Tetrominoes) - Standard Tetris piece definitions with colors
        this.pieces = [
            {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#ff00ff', // T piece - Magenta
                name: 'T'
            },
            {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#ffff00', // O piece - Yellow
                name: 'O'
            },
            {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0],
                    [0, 0, 0]
                ],
                color: '#00ff00', // S piece - Green
                name: 'S'
            },
            {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1],
                    [0, 0, 0]
                ],
                color: '#ff0000', // Z piece - Red
                name: 'Z'
            },
            {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#0000ff', // J piece - Blue
                name: 'J'
            },
            {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#ff8000', // L piece - Orange
                name: 'L'
            },
            {
                shape: [
                    [1, 1, 1, 1]
                ],
                color: '#00ffff', // I piece - Cyan
                name: 'I'
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
        this.showMobileControls();
    }
    
    /**
     * Detect if device is mobile
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.innerWidth <= 768);
    }
    
    /**
     * Show/hide mobile controls based on device
     */
    showMobileControls() {
        if (this.isMobile) {
            this.mobileControls.classList.remove('hidden');
        } else {
            this.mobileControls.classList.add('hidden');
        }
    }
    
    /**
     * Setup responsive canvas sizing
     */
    setupResponsiveCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.isMobile = this.detectMobile();
            this.showMobileControls();
        });
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
            this.initAudioContext();
            this.sounds.button();
            this.showGameScreen();
        });
        
        document.getElementById('instructionsBtn').addEventListener('click', () => {
            this.initAudioContext();
            this.sounds.button();
            this.showInstructionsScreen();
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.initAudioContext();
            this.sounds.button();
            this.showMainMenu();
        });
        
        document.getElementById('menuBtn').addEventListener('click', () => {
            this.initAudioContext();
            this.sounds.button();
            this.showMainMenu();
        });
        
        // Game control events
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.initAudioContext();
            this.sounds.button();
            this.resetGame();
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.initAudioContext();
            this.sounds.button();
            this.togglePause();
        });
        
        // Game over screen events
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.initAudioContext();
            this.sounds.button();
            this.showGameScreen();
        });
        
        document.getElementById('backToMenuFromGameOverBtn').addEventListener('click', () => {
            this.initAudioContext();
            this.sounds.button();
            this.showMainMenu();
        });
        
        // Mobile control events
        document.getElementById('mobileLeft').addEventListener('click', () => this.handleMobileInput('left'));
        document.getElementById('mobileRight').addEventListener('click', () => this.handleMobileInput('right'));
        document.getElementById('mobileDown').addEventListener('click', () => this.handleMobileInput('down'));
        document.getElementById('mobileRotate').addEventListener('click', () => this.handleMobileInput('rotate'));
        document.getElementById('mobileHold').addEventListener('click', () => this.handleMobileInput('hold'));
        document.getElementById('mobileDrop').addEventListener('click', () => this.handleMobileInput('drop'));
        
        // Test audio button
        document.getElementById('testAudioBtn').addEventListener('click', () => {
            this.initAudioContext();
            this.sounds.test();
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyC', 'KeyP'].includes(e.code)) {
                e.preventDefault();
            }
            this.handleKeyPress(e);
        });
        
        // Touch events for mobile
        this.setupTouchEvents();
        
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
     * Setup touch events for mobile
     */
    setupTouchEvents() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            touchEndX = touch.clientX;
            touchEndY = touch.clientY;
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
        });
    }
    
    /**
     * Handle swipe gestures
     */
    handleSwipe(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const minSwipeDistance = 30;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    this.handleMobileInput('right');
                } else {
                    this.handleMobileInput('left');
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    this.handleMobileInput('down');
                } else {
                    this.handleMobileInput('rotate');
                }
            }
        }
    }
    
    /**
     * Handle mobile input
     */
    handleMobileInput(action) {
        // Initialize audio on first user interaction
        this.initAudioContext();
        
        if (!this.gameRunning || this.gamePaused || !this.currentPiece) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastMoveTime < this.moveDelay) return;
        this.lastMoveTime = currentTime;
        
        switch(action) {
            case 'left':
                this.sounds.move();
                this.movePiece(-1, 0);
                break;
            case 'right':
                this.sounds.move();
                this.movePiece(1, 0);
                break;
            case 'down':
                this.sounds.drop();
                this.movePiece(0, 1);
                break;
            case 'rotate':
                this.sounds.rotate();
                this.rotatePiece();
                break;
            case 'hold':
                this.sounds.button();
                this.holdCurrentPiece();
                break;
            case 'drop':
                this.sounds.drop();
                this.hardDrop();
                break;
        }
    }
    
    /**
     * Initialize simple techno sound system with metronome and reverb
     */
    initSounds() {
        try {
            // Audio context will be created on first user interaction
            this.audioContext = null;
            this.audioInitialized = false;
            
            // Initialize audio context on first user interaction
            this.initAudioContext = () => {
                if (this.audioInitialized && this.audioContext) return;
                
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    
                    // Resume audio context if suspended
                    if (this.audioContext.state === 'suspended') {
                        this.audioContext.resume().then(() => {
                            this.updateAudioStatus();
                        });
                    } else {
                        this.updateAudioStatus();
                    }
                    
                    this.audioInitialized = true;
                } catch (error) {
                    console.warn('Failed to initialize audio context:', error);
                }
            };
            
            // Create reverb effect
            this.createReverb = () => {
                const convolver = this.audioContext.createConvolver();
                const reverbGain = this.audioContext.createGain();
                
                // Create impulse response for reverb
                const length = this.audioContext.sampleRate * 2;
                const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
                
                for (let channel = 0; channel < 2; channel++) {
                    const channelData = impulse.getChannelData(channel);
                    for (let i = 0; i < length; i++) {
                        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
                    }
                }
                
                convolver.buffer = impulse;
                reverbGain.gain.value = 0.3;
                
                convolver.connect(reverbGain);
                reverbGain.connect(this.audioContext.destination);
                
                return { convolver, reverbGain };
            };
            
            // Create metronome
            this.metronomeInterval = null;
            this.beatCount = 0;
            this.bpm = 120; // 80s techno tempo
            
            this.startMetronome = () => {
                if (this.metronomeInterval) return;
                
                const beatInterval = 60000 / this.bpm; // Convert BPM to milliseconds
                this.metronomeInterval = setInterval(() => {
                    this.playMetronomeBeat();
                    this.beatCount++;
                }, beatInterval);
            };
            
            this.stopMetronome = () => {
                if (this.metronomeInterval) {
                    clearInterval(this.metronomeInterval);
                    this.metronomeInterval = null;
                }
            };
            
            this.playMetronomeBeat = () => {
                const isStrongBeat = this.beatCount % 4 === 0;
                const frequency = isStrongBeat ? 80 : 60;
                const volume = isStrongBeat ? 0.15 : 0.08;
                
                this.createTechnoSound(frequency, 0.1, 'sine', volume, true);
                this.updateMetronomeVisual(this.beatCount % 4);
            };
            
            // Create techno sound with reverb
            this.createTechnoSound = (frequency, duration, type = 'sine', volume = 0.1, isMetronome = false) => {
                if (!this.audioInitialized || !this.audioContext) {
                    this.initAudioContext();
                    if (!this.audioInitialized || !this.audioContext) return;
                }
                
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                const reverb = this.createReverb();
                
                // Connect audio chain with reverb
                oscillator.connect(gainNode);
                gainNode.connect(reverb.convolver);
                
                // Set oscillator properties
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                oscillator.type = type;
                
                // Simple envelope
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + duration);
            };
            
            // 80s German New Age Techno scales
            // Simple techno frequencies
            this.technoFreqs = [100, 150, 200, 250, 300, 400, 500, 600];
            
            this.getNextTechnoFreq = () => {
                const freq = this.technoFreqs[Math.floor(Math.random() * this.technoFreqs.length)];
                return freq;
            };
            
            return {
                test: () => {
                    this.createTechnoSound(440, 0.5, 'sine', 0.3);
                },
                move: () => {
                    const freq = this.getNextTechnoFreq();
                    this.createTechnoSound(freq, 0.1, 'square', 0.1);
                },
                rotate: () => {
                    const freq = this.getNextTechnoFreq() * 1.5;
                    this.createTechnoSound(freq, 0.15, 'triangle', 0.12);
                },
                drop: () => {
                    const freq = this.getNextTechnoFreq() * 0.5;
                    this.createTechnoSound(freq, 0.2, 'sawtooth', 0.15);
                },
                lineClear: () => {
                    // Simple chord
                    this.createTechnoSound(400, 0.3, 'triangle', 0.2);
                    setTimeout(() => this.createTechnoSound(500, 0.3, 'triangle', 0.2), 100);
                    setTimeout(() => this.createTechnoSound(600, 0.3, 'triangle', 0.2), 200);
                },
                gameOver: () => {
                    // Descending sound
                    this.createTechnoSound(400, 0.3, 'sawtooth', 0.2);
                    setTimeout(() => this.createTechnoSound(300, 0.3, 'sawtooth', 0.2), 150);
                    setTimeout(() => this.createTechnoSound(200, 0.3, 'sawtooth', 0.2), 300);
                },
                button: () => {
                    this.createTechnoSound(800, 0.1, 'square', 0.1);
                },
                levelUp: () => {
                    this.createTechnoSound(600, 0.4, 'triangle', 0.2);
                },
                tetris: () => {
                    // Special Tetris sound
                    this.createTechnoSound(400, 0.2, 'triangle', 0.25);
                    setTimeout(() => this.createTechnoSound(500, 0.2, 'triangle', 0.25), 100);
                    setTimeout(() => this.createTechnoSound(600, 0.2, 'triangle', 0.25), 200);
                    setTimeout(() => this.createTechnoSound(800, 0.2, 'triangle', 0.25), 300);
                },
                startMetronome: () => this.startMetronome(),
                stopMetronome: () => this.stopMetronome()
            };
        } catch (error) {
            console.warn('Audio context not available:', error);
            return {
                move: () => {},
                rotate: () => {},
                drop: () => {},
                lineClear: () => {},
                gameOver: () => {},
                button: () => {},
                levelUp: () => {},
                tetris: () => {},
                startMetronome: () => {},
                stopMetronome: () => {}
            };
        }
    }
    
    /**
     * Handle keyboard input
     */
    handleKeyPress(e) {
        // Initialize audio on first user interaction
        this.initAudioContext();
        
        if (e.code === 'KeyP') {
            this.sounds.button();
            this.togglePause();
            return;
        }
        
        if (!this.gameRunning || this.gamePaused || !this.currentPiece) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastMoveTime < this.moveDelay) return;
        this.lastMoveTime = currentTime;
        
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
     * Hard drop piece
     */
    hardDrop() {
        let dropDistance = 0;
        while (!this.checkCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            dropDistance++;
        }
        
        if (dropDistance > 0) {
            this.score += dropDistance * 2; // Bonus points for hard drop
            this.updateDisplay();
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
            // Try wall kicks
            const kicks = this.getWallKicks(this.currentPiece);
            let canRotate = false;
            
            for (const kick of kicks) {
                if (!this.checkCollision(this.currentPiece, kick.x, kick.y)) {
                    this.currentPiece.x += kick.x;
                    this.currentPiece.y += kick.y;
                    canRotate = true;
                    break;
                }
            }
            
            if (!canRotate) {
                this.currentPiece.shape = originalShape;
            }
        }
        
        this.draw();
        this.addScreenShake(0.1);
    }
    
    /**
     * Get wall kicks for piece rotation
     */
    getWallKicks(piece) {
        // Basic wall kicks - can be expanded for more sophisticated kicks
        return [
            { x: 0, y: 0 },
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: -1, y: -1 },
            { x: 1, y: -1 }
        ];
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
        const linesToClear = [];
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                linesToClear.push(y);
                linesCleared++;
            }
        }
        
        if (linesCleared > 0) {
            // Remove cleared lines
            for (const lineIndex of linesToClear) {
                this.board.splice(lineIndex, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
            }
            
            this.lines += linesCleared;
            
            // Calculate score based on lines cleared
            let lineScore = 0;
            switch(linesCleared) {
                case 1: lineScore = 100; break;
                case 2: lineScore = 300; break;
                case 3: lineScore = 500; break;
                case 4: lineScore = 800; break;
            }
            
            this.score += lineScore * this.level;
            const oldLevel = this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            
            // Enhanced visual effects
            this.addScreenShake(linesCleared > 2 ? 3 : 2);
            this.addLineClearFlash();
            this.addScreenFlicker();
            this.createExplosion(
                this.canvas.offsetLeft + this.canvas.width / 2,
                this.canvas.offsetTop + this.canvas.height / 2,
                linesCleared
            );
            
            // Score popup with enhanced animation
            this.createScorePopup(lineScore * this.level, this.canvas.offsetLeft + this.canvas.width / 2, this.canvas.offsetTop + this.canvas.height / 2);
            
            // Sound effects
            if (linesCleared === 4) {
                this.sounds.tetris();
            } else {
                this.sounds.lineClear();
            }
            
            // Level up celebration
            if (this.level > oldLevel) {
                this.sounds.levelUp();
                this.addLevelUpCelebration();
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
        document.getElementById('highScore').textContent = this.highScore.toString().padStart(6, '0');
        
        // Update game status
        const statusElement = document.getElementById('gameStatus');
        if (this.gamePaused) {
            statusElement.textContent = 'PAUSED';
        } else if (this.gameRunning) {
            statusElement.textContent = 'PLAYING';
        } else {
            statusElement.textContent = 'READY';
        }
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
        
        // Draw main block with color
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // Add border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // Add highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, 2);
        
        // Add shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(pixelX + 1, pixelY + this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2, 2);
        
        // Add glow effect
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 5;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
        this.ctx.shadowBlur = 0;
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
                    this.nextCtx.fillStyle = this.nextPiece.color;
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
                    this.holdCtx.fillStyle = this.holdPiece.color;
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
        if (!this.gameRunning || this.gamePaused) return;
        
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
        this.gamePaused = false;
        this.dropTime = Date.now();
        this.sounds.startMetronome();
        this.gameLoop();
    }
    
    /**
     * Pause game
     */
    pauseGame() {
        this.gamePaused = true;
        this.sounds.stopMetronome();
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }
    
    /**
     * Toggle pause
     */
    togglePause() {
        if (this.gamePaused) {
            this.startGame();
        } else {
            this.pauseGame();
        }
        this.updateDisplay();
    }
    
    /**
     * Reset game
     */
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.sounds.stopMetronome();
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
        this.gamePaused = false;
        this.sounds.stopMetronome();
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // Check for high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            document.getElementById('finalHighScore').style.display = 'block';
        } else {
            document.getElementById('finalHighScore').style.display = 'none';
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
        this.instructionsScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.pauseGame();
    }
    
    showInstructionsScreen() {
        this.mainMenu.classList.add('hidden');
        this.instructionsScreen.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
    }
    
    showGameScreen() {
        this.mainMenu.classList.add('hidden');
        this.instructionsScreen.classList.add('hidden');
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
    
    createScorePopup(score, x, y) {
        const popup = document.createElement('div');
        popup.className = 'score-popup score-popup-bounce';
        popup.textContent = '+' + score;
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
        this.scorePopupContainer.appendChild(popup);
        
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 1500);
    }
    
    
    addLineClearFlash() {
        const gameBoard = document.querySelector('.game-board');
        gameBoard.classList.add('line-clear-flash');
        setTimeout(() => gameBoard.classList.remove('line-clear-flash'), 600);
    }
    
    addLevelUpCelebration() {
        const gameContainer = document.querySelector('.game-container');
        gameContainer.classList.add('level-up-celebration');
        setTimeout(() => gameContainer.classList.remove('level-up-celebration'), 800);
    }
    
    addScreenFlicker() {
        const gameScreen = document.getElementById('gameScreen');
        gameScreen.classList.add('screen-flicker');
        setTimeout(() => gameScreen.classList.remove('screen-flicker'), 100);
    }
    
    updateMetronomeVisual(beatIndex) {
        const metronomeIndicator = document.getElementById('metronomeIndicator');
        if (!metronomeIndicator) return;
        
        const dots = metronomeIndicator.querySelectorAll('.beat-dot');
        dots.forEach((dot, index) => {
            dot.classList.remove('active');
            if (index === beatIndex) {
                dot.classList.add('active');
            }
        });
    }
    
    updateAudioStatus() {
        const audioStatus = document.getElementById('audioStatus');
        if (!audioStatus) return;
        
        if (this.audioInitialized && this.audioContext && this.audioContext.state === 'running') {
            audioStatus.textContent = '🔊';
            audioStatus.className = 'audio-status ready';
        } else {
            audioStatus.textContent = '🔇';
            audioStatus.className = 'audio-status muted';
        }
    }
    
    // High score management
    loadHighScore() {
        try {
            return parseInt(localStorage.getItem('tetrisHighScore') || '0');
        } catch (error) {
            console.warn('Could not load high score:', error);
            return 0;
        }
    }
    
    saveHighScore() {
        try {
            localStorage.setItem('tetrisHighScore', this.highScore.toString());
        } catch (error) {
            console.warn('Could not save high score:', error);
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TetrisGame();
});