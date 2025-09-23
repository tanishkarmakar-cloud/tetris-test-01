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
        
        // Start metronome immediately for continuous beat
        this.sounds.startMetronome();
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
                        this.audioContext.resume();
                    }
                    
                    this.audioInitialized = true;
                } catch (error) {
                    console.warn('Failed to initialize audio context:', error);
                }
            };
            
            // Create heavy reverb effect
            this.createReverb = () => {
                const convolver = this.audioContext.createConvolver();
                const reverbGain = this.audioContext.createGain();
                
                // Create impulse response for heavy reverb
                const length = this.audioContext.sampleRate * 4; // 4 seconds for heavy reverb
                const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
                
                for (let channel = 0; channel < 2; channel++) {
                    const channelData = impulse.getChannelData(channel);
                    for (let i = 0; i < length; i++) {
                        // More complex reverb pattern for heavier effect
                        const decay = Math.pow(1 - i / length, 1.5);
                        const noise = (Math.random() * 2 - 1) * 0.8;
                        const echo = Math.sin(i * 0.01) * 0.3;
                        channelData[i] = (noise + echo) * decay;
                    }
                }
                
                convolver.buffer = impulse;
                reverbGain.gain.value = 0.8; // Much higher reverb level
                
                convolver.connect(reverbGain);
                reverbGain.connect(this.audioContext.destination);
                
                return { convolver, reverbGain };
            };
            
            // Create techno beat system
            this.metronomeInterval = null;
            this.beatCount = 0;
            this.bpm = 128; // Classic techno tempo
            this.barCount = 0; // Track 4-beat bars
            this.sidechainGain = null; // For sidechain compression effect
            this.arpeggiator = {
                active: false,
                pattern: [0, 2, 4, 2, 0, 4, 2, 0],
                index: 0,
                interval: null
            };
            
            // Binaural beats for brainwave entrainment
            this.binauralBeats = {
                active: false,
                baseFreq: 40, // Alpha waves (8-12 Hz)
                beatFreq: 10, // Binaural beat frequency
                leftOsc: null,
                rightOsc: null,
                interval: null
            };
            
            // Spatial audio system
            this.spatialAudio = {
                panner: null,
                distance: 1,
                panning: 0,
                elevation: 0
            };
            
            // Granular synthesis
            this.granular = {
                active: false,
                grainSize: 0.1,
                overlap: 0.5,
                pitch: 1,
                interval: null
            };
            
            // Ambient pads
            this.ambientPads = {
                active: false,
                oscillators: [],
                interval: null
            };
            
            // Steve Reich-inspired phasing system
            this.phasingSystem = {
                active: false,
                patterns: [],
                phaseOffset: 0,
                interval: null,
                basePattern: [1, 0, 1, 0, 1, 1, 0, 1], // Basic ostinato
                phaseRate: 0.001 // How fast patterns phase
            };
            
            // Minimalist ostinato system
            this.ostinatoSystem = {
                active: false,
                layers: [],
                intervals: [],
                baseFrequencies: [220, 246.94, 277.18, 329.63], // A minor arpeggio
                phaseOffsets: [0, 0.125, 0.25, 0.375] // Staggered entries
            };
            
            // Canon and imitation system
            this.canonSystem = {
                active: false,
                voices: [],
                imitationDelay: 0.5, // Half beat delay
                interval: null
            };
            
            // Classical music system
            this.classicalSystem = {
                active: false,
                key: 'A minor', // Tonal center
                scale: [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00], // A minor scale
                chordProgressions: [
                    [220, 261.63, 329.63], // Am (i)
                    [246.94, 293.66, 349.23], // Bdim (ii°)
                    [261.63, 329.63, 392.00], // C (III)
                    [293.66, 349.23, 440.00], // Dm (iv)
                    [329.63, 392.00, 493.88], // E (V)
                    [349.23, 440.00, 523.25], // F (VI)
                    [392.00, 493.88, 587.33]  // G (VII)
                ],
                currentChord: 0,
                theme: [220, 261.63, 329.63, 392.00, 349.23, 329.63, 261.63, 220], // Main theme
                themeIndex: 0,
                interval: null,
                dynamics: 0.5, // Current dynamic level
                phraseLength: 8, // 8-beat phrases
                phraseCount: 0,
                intensity: 0, // Progressive intensity
                level: 1, // Current level for progression
                momentum: 0, // Audio momentum (0-1)
                tension: 0, // Musical tension (0-1)
                energy: 0, // Overall energy level (0-1)
                adaptiveTempo: 128, // Adaptive BPM
                adaptiveVolume: 1.0, // Adaptive volume scaling
                frequencySpectrum: {
                    bass: 0.8,    // 60-250 Hz
                    lowMid: 0.6,  // 250-2000 Hz
                    mid: 0.7,     // 2000-4000 Hz
                    highMid: 0.5, // 4000-8000 Hz
                    treble: 0.3   // 8000+ Hz
                }
            };
            
            this.startMetronome = () => {
                if (this.metronomeInterval) return;
                
                // Create sidechain compression gain node
                this.sidechainGain = this.audioContext.createGain();
                this.sidechainGain.connect(this.audioContext.destination);
                
                // Master gain node to prevent clipping when sounds layer
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.setValueAtTime(0.6, this.audioContext.currentTime); // Increased for better sound effect prominence
                
                // Dynamic range compressor for professional sound
                this.compressor = this.audioContext.createDynamicsCompressor();
                this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
                this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
                this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
                this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
                this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);
                
                // Frequency spectrum analyzer for adaptive EQ
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 2048;
                this.analyser.smoothingTimeConstant = 0.8;
                
                // Connect audio chain: Master Gain -> Compressor -> Analyser -> Destination
                this.masterGain.connect(this.compressor);
                this.compressor.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                this.sidechainGain.gain.setValueAtTime(1, this.audioContext.currentTime);
                
                // Use adaptive tempo for dynamic BPM
                const adaptiveBPM = this.classicalSystem ? this.classicalSystem.adaptiveTempo : this.bpm;
                const beatInterval = 60000 / adaptiveBPM; // Convert BPM to milliseconds
                this.metronomeInterval = setInterval(() => {
                    this.playMetronomeBeat();
                    this.beatCount++;
                }, beatInterval);
                
                // Start arpeggiator
                this.startArpeggiator();
                
                // Start binaural beats
                this.startBinauralBeats();
                
                // Start ambient pads
                this.startAmbientPads();
                
                // Initialize spatial audio
                this.initSpatialAudio();
                
                // Start Reich-inspired systems
                this.startPhasingSystem();
                this.startOstinatoSystem();
                this.startCanonSystem();
                
                // Start classical music system
                this.startClassicalSystem();
            };
            
            this.stopMetronome = () => {
                if (this.metronomeInterval) {
                    clearInterval(this.metronomeInterval);
                    this.metronomeInterval = null;
                }
                this.stopArpeggiator();
                this.stopBinauralBeats();
                this.stopAmbientPads();
                this.stopPhasingSystem();
                this.stopOstinatoSystem();
                this.stopCanonSystem();
                this.stopClassicalSystem();
            };
            
            // Start arpeggiator for melodic sequences
            this.startArpeggiator = () => {
                if (this.arpeggiator.interval) return;
                
                const arpInterval = 60000 / (this.bpm * 2); // 16th notes
                this.arpeggiator.interval = setInterval(() => {
                    this.playArpeggiatorNote();
                }, arpInterval);
            };
            
            this.stopArpeggiator = () => {
                if (this.arpeggiator.interval) {
                    clearInterval(this.arpeggiator.interval);
                    this.arpeggiator.interval = null;
                }
            };
            
            this.playArpeggiatorNote = () => {
                const scale = [220, 246.94, 277.18, 311.13, 349.23, 392.00, 440.00, 493.88]; // C major scale
                const noteIndex = this.arpeggiator.pattern[this.arpeggiator.index % this.arpeggiator.pattern.length];
                const frequency = scale[noteIndex];
                
                this.createArpeggiatorSound(frequency, 0.1, 'triangle', 0.05);
                this.arpeggiator.index++;
            };
            
            // Sidechain compression effect
            this.triggerSidechain = () => {
                if (!this.sidechainGain || !this.masterGain) return;
                
                const now = this.audioContext.currentTime;
                this.sidechainGain.gain.setValueAtTime(0.3, now);
                this.sidechainGain.gain.exponentialRampToValueAtTime(1, now + 0.2);
                
                // Also duck the master gain slightly for breathing effect
                this.masterGain.gain.setValueAtTime(0.4, now);
                this.masterGain.gain.linearRampToValueAtTime(0.6, now + 0.15);
            };
            
            // Rhythmic gating effect
            this.addRhythmicGate = (frequency, duration, volume = 0.1) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const gateGain = this.audioContext.createGain();
                    const gateOsc = this.audioContext.createOscillator();
                    
                    // Gate oscillator (stutter pattern)
                    gateOsc.frequency.setValueAtTime(16, this.audioContext.currentTime); // 16th note gates
                    gateOsc.type = 'square';
                    
                    // Gate gain control
                    gateGain.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gateGain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.001);
                    
                    // Connect gate
                    gateOsc.connect(gateGain);
                    gateGain.connect(gainNode.gain);
                    
                    // Main oscillator
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sawtooth';
                    
                    // Connect audio chain
            oscillator.connect(gainNode);
                    gainNode.connect(this.sidechainGain || this.audioContext.destination);
                    
                    // Envelope
                    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
                    
                    oscillator.start(this.audioContext.currentTime);
                    gateOsc.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + duration);
                    gateOsc.stop(this.audioContext.currentTime + duration);
                } catch (error) {
                    console.warn('Rhythmic gate error:', error);
                }
            };
            
            this.playMetronomeBeat = () => {
                const beatInBar = this.beatCount % 4;
                
                // Ambient pad progression - A minor chord (reduced volume)
                const padFreqs = [220, 330, 440, 660]; // A, E, A, E
                const padFreq = padFreqs[beatInBar];
                this.createAmbientBacking(padFreq, 2.0, 0.04);
                
                // Gentle kick on beats 1 and 3 (reduced volume)
                if (beatInBar === 0 || beatInBar === 2) {
                    this.createAmbientBacking(60, 0.5, 0.06);
                }
                
                // Soft snare on beat 3 (reduced volume)
                if (beatInBar === 2) {
                    this.createAmbientBacking(200, 0.3, 0.04);
                }
                
                // Gentle hi-hats on beats 2 and 4 (reduced volume)
                if (beatInBar === 1 || beatInBar === 3) {
                    this.createAmbientBacking(800, 0.2, 0.025);
                }
                
                // Bass line - simple and clean (reduced volume)
                const bassFreq = beatInBar === 0 ? 55 : (beatInBar === 2 ? 73.42 : 65.4); // A, D, C#
                this.createAmbientBacking(bassFreq, 1.0, 0.05);
                
                // Track bars for simple progression
                if (beatInBar === 0) {
                    this.barCount++;
                }
            };
            
            // Add techno fill every 8 bars
            this.addTechnoFill = () => {
                // Hi-hat roll
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        this.createAmbientBacking(1000 + i * 100, 0.05, 0.1);
                    }, i * 50);
                }
                
                // Bass drop
                setTimeout(() => {
                    this.createAmbientBacking(40, 0.5, 0.3);
                }, 400);
            };
            
            // Add polyrhythmic elements (3 against 4)
            this.addPolyrhythmicElement = () => {
                const tripletFreqs = [440, 554.37, 659.25]; // A, C#, E
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        this.createArpeggiatorSound(tripletFreqs[i], 0.2, 'triangle', 0.08);
                    }, i * 133); // 3 notes in 400ms (triplets)
                }
            };
            
            // Add tempo variations for trance effect
            this.addTempoVariation = () => {
                // Subtle tempo increase for build-up effect
                const originalBPM = this.bpm;
                this.bpm = Math.min(132, this.bpm + 2);
                
                setTimeout(() => {
                    this.bpm = originalBPM;
                }, 2000);
            };
            
            // Add Reich-style ethereal textures
            this.addEtherealTexture = () => {
                // Create floating, ethereal sounds
                const etherealFreqs = [220, 330, 440, 660]; // A minor chord
                
                etherealFreqs.forEach((freq, index) => {
                    setTimeout(() => {
                        this.createEtherealSound(freq, 2.0, 0.05);
                    }, index * 100);
                });
            };
            
            // Create ethereal sound with Reich-inspired characteristics
            this.createEtherealSound = (frequency, duration, volume = 0.1) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    
                    // LFO for ethereal movement
                    lfo.frequency.setValueAtTime(0.2, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.1, this.audioContext.currentTime);
                    
                    // Filter setup for ethereal quality
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(3, this.audioContext.currentTime);
                    
                    // Connect LFO to filter
                    lfo.connect(lfoGain);
                    lfoGain.connect(filter.frequency);
                    
                    // Main oscillator
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Connect audio chain
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(this.sidechainGain || this.audioContext.destination);
                    
                    // Ethereal envelope - slow attack, long sustain
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.5);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.5, this.audioContext.currentTime + duration * 0.8);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
                    
                    // Start oscillators
                    oscillator.start(this.audioContext.currentTime);
                    lfo.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + duration);
                    lfo.stop(this.audioContext.currentTime + duration);
                } catch (error) {
                    console.warn('Ethereal sound error:', error);
                }
            };
            
            // Binaural beats for brainwave entrainment
            this.startBinauralBeats = () => {
                if (this.binauralBeats.active) return;
                
                try {
                    // Create stereo panner for binaural effect
                    const panner = this.audioContext.createStereoPanner();
                    panner.pan.setValueAtTime(-1, this.audioContext.currentTime); // Left ear
                    
                    // Left ear oscillator
                    this.binauralBeats.leftOsc = this.audioContext.createOscillator();
                    this.binauralBeats.leftOsc.frequency.setValueAtTime(this.binauralBeats.baseFreq, this.audioContext.currentTime);
                    this.binauralBeats.leftOsc.type = 'sine';
                    
                    // Right ear oscillator (slightly different frequency)
                    this.binauralBeats.rightOsc = this.audioContext.createOscillator();
                    this.binauralBeats.rightOsc.frequency.setValueAtTime(this.binauralBeats.baseFreq + this.binauralBeats.beatFreq, this.audioContext.currentTime);
                    this.binauralBeats.rightOsc.type = 'sine';
                    
                    // Gain nodes for volume control
                    const leftGain = this.audioContext.createGain();
                    const rightGain = this.audioContext.createGain();
                    leftGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
                    rightGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
                    
                    // Connect to stereo output
                    this.binauralBeats.leftOsc.connect(leftGain);
                    this.binauralBeats.rightOsc.connect(rightGain);
                    leftGain.connect(this.audioContext.destination);
                    rightGain.connect(this.audioContext.destination);
                    
                    // Start oscillators
                    this.binauralBeats.leftOsc.start();
                    this.binauralBeats.rightOsc.start();
                    this.binauralBeats.active = true;
                    
                    // Gradually change beat frequency for entrainment
                    this.binauralBeats.interval = setInterval(() => {
                        const newBeatFreq = 8 + Math.sin(Date.now() * 0.001) * 4; // 4-12 Hz range
                        this.binauralBeats.rightOsc.frequency.setValueAtTime(
                            this.binauralBeats.baseFreq + newBeatFreq, 
                            this.audioContext.currentTime
                        );
                    }, 100);
                } catch (error) {
                    console.warn('Binaural beats error:', error);
                }
            };
            
            this.stopBinauralBeats = () => {
                if (this.binauralBeats.leftOsc) {
                    this.binauralBeats.leftOsc.stop();
                    this.binauralBeats.leftOsc = null;
                }
                if (this.binauralBeats.rightOsc) {
                    this.binauralBeats.rightOsc.stop();
                    this.binauralBeats.rightOsc = null;
                }
                if (this.binauralBeats.interval) {
                    clearInterval(this.binauralBeats.interval);
                    this.binauralBeats.interval = null;
                }
                this.binauralBeats.active = false;
            };
            
            // Spatial audio system
            this.initSpatialAudio = () => {
                try {
                    this.spatialAudio.panner = this.audioContext.createPanner();
                    this.spatialAudio.panner.panningModel = 'HRTF';
                    this.spatialAudio.panner.distanceModel = 'exponential';
                    this.spatialAudio.panner.refDistance = 1;
                    this.spatialAudio.panner.maxDistance = 10;
                    this.spatialAudio.panner.rolloffFactor = 1;
                    this.spatialAudio.panner.coneInnerAngle = 360;
                    this.spatialAudio.panner.coneOuterAngle = 0;
                    this.spatialAudio.panner.coneOuterGain = 0;
                } catch (error) {
                    console.warn('Spatial audio error:', error);
                }
            };
            
            // Ambient pads for atmospheric background
            this.startAmbientPads = () => {
                if (this.ambientPads.active) return;
                
                try {
                    const padFrequencies = [55, 73.42, 98, 130.81]; // A minor chord
                    
                    padFrequencies.forEach((freq, index) => {
                        const oscillator = this.audioContext.createOscillator();
                        const gainNode = this.audioContext.createGain();
                        const filter = this.audioContext.createBiquadFilter();
                        const lfo = this.audioContext.createOscillator();
                        const lfoGain = this.audioContext.createGain();
                        
                        // LFO for evolving sound
                        lfo.frequency.setValueAtTime(0.1 + index * 0.05, this.audioContext.currentTime);
                        lfo.type = 'sine';
                        lfoGain.gain.setValueAtTime(freq * 0.1, this.audioContext.currentTime);
                        
                        // Filter setup
                        filter.type = 'lowpass';
                        filter.frequency.setValueAtTime(freq * 4, this.audioContext.currentTime);
                        filter.Q.setValueAtTime(1, this.audioContext.currentTime);
                        
                        // Connect LFO to filter
                        lfo.connect(lfoGain);
                        lfoGain.connect(filter.frequency);
                        
                        // Main audio chain
                        oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                        oscillator.type = 'triangle';
                        oscillator.connect(filter);
                        filter.connect(gainNode);
                        gainNode.connect(this.sidechainGain || this.audioContext.destination);
                        
                        // Very low volume for ambient effect
                        gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime);
                        
                        // Start oscillators
                        oscillator.start();
                        lfo.start();
                        
                        this.ambientPads.oscillators.push({ oscillator, lfo, gainNode });
                    });
                    
                    this.ambientPads.active = true;
                } catch (error) {
                    console.warn('Ambient pads error:', error);
                }
            };
            
            this.stopAmbientPads = () => {
                this.ambientPads.oscillators.forEach(({ oscillator, lfo, gainNode }) => {
                    try {
                        oscillator.stop();
                        lfo.stop();
                    } catch (e) {}
                });
                this.ambientPads.oscillators = [];
                this.ambientPads.active = false;
            };
            
            // Steve Reich-inspired phasing system
            this.startPhasingSystem = () => {
                if (this.phasingSystem.active) return;
                
                try {
                    // Create multiple phasing patterns
                    const patternCount = 4;
                    const baseFreq = 440; // A4
                    
                    for (let i = 0; i < patternCount; i++) {
                        const oscillator = this.audioContext.createOscillator();
                        const gainNode = this.audioContext.createGain();
                        const filter = this.audioContext.createBiquadFilter();
                        
                        // Each pattern has slightly different frequency
                        const freq = baseFreq * (1 + i * 0.01);
                        oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                        oscillator.type = 'sine';
                        
                        // Filter for ethereal quality
                        filter.type = 'lowpass';
                        filter.frequency.setValueAtTime(800 + i * 200, this.audioContext.currentTime);
                        filter.Q.setValueAtTime(2, this.audioContext.currentTime);
                        
                        // Connect audio chain
                        oscillator.connect(filter);
                        filter.connect(gainNode);
                        gainNode.connect(this.sidechainGain || this.audioContext.destination);
                        
                        // Very low volume for subtle effect
                        gainNode.gain.setValueAtTime(0.03, this.audioContext.currentTime);
                        
                        // Start oscillator
                        oscillator.start();
                        
                        this.phasingSystem.patterns.push({ oscillator, gainNode, filter, index: i });
                    }
                    
                    // Phasing interval - gradually shift patterns
                    this.phasingSystem.interval = setInterval(() => {
                        this.updatePhasingPatterns();
                    }, 50); // Update every 50ms for smooth phasing
                    
                    this.phasingSystem.active = true;
                } catch (error) {
                    console.warn('Phasing system error:', error);
                }
            };
            
            this.updatePhasingPatterns = () => {
                this.phasingSystem.phaseOffset += this.phasingSystem.phaseRate;
                if (this.phasingSystem.phaseOffset >= 1) {
                    this.phasingSystem.phaseOffset = 0;
                }
                
                // Update each pattern's volume based on phasing
                this.phasingSystem.patterns.forEach((pattern, index) => {
                    const phase = (this.phasingSystem.phaseOffset + index * 0.25) % 1;
                    const volume = Math.sin(phase * Math.PI * 2) * 0.03 + 0.01;
                    pattern.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
                });
            };
            
            this.stopPhasingSystem = () => {
                if (this.phasingSystem.interval) {
                    clearInterval(this.phasingSystem.interval);
                    this.phasingSystem.interval = null;
                }
                this.phasingSystem.patterns.forEach(({ oscillator }) => {
                    try {
                        oscillator.stop();
                    } catch (e) {}
                });
                this.phasingSystem.patterns = [];
                this.phasingSystem.active = false;
            };
            
            // Minimalist ostinato system (Reich-style repetitive patterns)
            this.startOstinatoSystem = () => {
                if (this.ostinatoSystem.active) return;
                
                try {
                    // Create multiple ostinato layers with staggered entries
                    this.ostinatoSystem.baseFrequencies.forEach((freq, index) => {
                        const oscillator = this.audioContext.createOscillator();
                        const gainNode = this.audioContext.createGain();
                        const filter = this.audioContext.createBiquadFilter();
                        const lfo = this.audioContext.createOscillator();
                        const lfoGain = this.audioContext.createGain();
                        
                        // LFO for subtle variation
                        lfo.frequency.setValueAtTime(0.1 + index * 0.05, this.audioContext.currentTime);
                        lfo.type = 'sine';
                        lfoGain.gain.setValueAtTime(freq * 0.02, this.audioContext.currentTime);
                        
                        // Filter setup
                        filter.type = 'lowpass';
                        filter.frequency.setValueAtTime(freq * 3, this.audioContext.currentTime);
                        filter.Q.setValueAtTime(1, this.audioContext.currentTime);
                        
                        // Connect LFO to filter
                        lfo.connect(lfoGain);
                        lfoGain.connect(filter.frequency);
                        
                        // Main oscillator
                        oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                        oscillator.type = 'triangle';
                        
                        // Connect audio chain
                        oscillator.connect(filter);
                        filter.connect(gainNode);
                        gainNode.connect(this.sidechainGain || this.audioContext.destination);
                        
                        // Volume with phase offset
                        const phaseOffset = this.ostinatoSystem.phaseOffsets[index];
                        gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime);
                        
                        // Start oscillators
                        oscillator.start();
                        lfo.start();
                        
                        this.ostinatoSystem.layers.push({ oscillator, lfo, gainNode, filter, index });
                    });
                    
                    // Ostinato pattern interval
                    this.ostinatoSystem.interval = setInterval(() => {
                        this.updateOstinatoPatterns();
                    }, 100); // Update every 100ms
                    
                    this.ostinatoSystem.active = true;
                } catch (error) {
                    console.warn('Ostinato system error:', error);
                }
            };
            
            this.updateOstinatoPatterns = () => {
                // Create Reich-style phasing by varying volumes
                this.ostinatoSystem.layers.forEach((layer, index) => {
                    const time = Date.now() * 0.001;
                    const phase = (time * 0.5 + index * 0.25) % 1;
                    const volume = Math.sin(phase * Math.PI * 2) * 0.02 + 0.01;
                    layer.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
                });
            };
            
            this.stopOstinatoSystem = () => {
                if (this.ostinatoSystem.interval) {
                    clearInterval(this.ostinatoSystem.interval);
                    this.ostinatoSystem.interval = null;
                }
                this.ostinatoSystem.layers.forEach(({ oscillator, lfo }) => {
                    try {
                        oscillator.stop();
                        lfo.stop();
                    } catch (e) {}
                });
                this.ostinatoSystem.layers = [];
                this.ostinatoSystem.active = false;
            };
            
            // Canon and imitation system (Reich-style delayed imitation)
            this.startCanonSystem = () => {
                if (this.canonSystem.active) return;
                
                try {
                    // Create canon voices with different delays
                    const canonFrequencies = [330, 440, 554.37, 659.25]; // E, A, C#, E
                    const delays = [0, 0.25, 0.5, 0.75]; // Staggered entries
                    
                    canonFrequencies.forEach((freq, index) => {
                        const oscillator = this.audioContext.createOscillator();
                        const gainNode = this.audioContext.createGain();
                        const filter = this.audioContext.createBiquadFilter();
                        const delay = this.audioContext.createDelay();
                        const delayGain = this.audioContext.createGain();
                        
                        // Set up delay
                        delay.delayTime.setValueAtTime(delays[index], this.audioContext.currentTime);
                        delayGain.gain.setValueAtTime(0.7, this.audioContext.currentTime);
                        
                        // Filter for ethereal quality
                        filter.type = 'lowpass';
                        filter.frequency.setValueAtTime(freq * 2, this.audioContext.currentTime);
                        filter.Q.setValueAtTime(1, this.audioContext.currentTime);
                        
                        // Main oscillator
                        oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                        oscillator.type = 'sine';
                        
                        // Connect audio chain with delay
                        oscillator.connect(filter);
                        filter.connect(gainNode);
                        gainNode.connect(delay);
                        delay.connect(delayGain);
                        delayGain.connect(this.sidechainGain || this.audioContext.destination);
                        
                        // Volume with gradual fade-in
                        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0.02, this.audioContext.currentTime + delays[index] * 2);
                        
                        // Start oscillator
                        oscillator.start();
                        
                        this.canonSystem.voices.push({ oscillator, gainNode, filter, delay, index });
                    });
                    
                    // Canon pattern interval
                    this.canonSystem.interval = setInterval(() => {
                        this.updateCanonPatterns();
                    }, 200); // Update every 200ms
                    
                    this.canonSystem.active = true;
                } catch (error) {
                    console.warn('Canon system error:', error);
                }
            };
            
            this.updateCanonPatterns = () => {
                // Create Reich-style imitation by varying volumes
                this.canonSystem.voices.forEach((voice, index) => {
                    const time = Date.now() * 0.001;
                    const phase = (time * 0.3 + index * 0.5) % 1;
                    const volume = Math.sin(phase * Math.PI * 2) * 0.02 + 0.01;
                    voice.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
                });
            };
            
            this.stopCanonSystem = () => {
                if (this.canonSystem.interval) {
                    clearInterval(this.canonSystem.interval);
                    this.canonSystem.interval = null;
                }
                this.canonSystem.voices.forEach(({ oscillator }) => {
                    try {
                        oscillator.stop();
                    } catch (e) {}
                });
                this.canonSystem.voices = [];
                this.canonSystem.active = false;
            };
            
            // Classical music system with proper harmony
            this.startClassicalSystem = () => {
                if (this.classicalSystem.active) return;
                
                try {
                    // Create harmonic foundation
                    this.createHarmonicFoundation();
                    
                    // Start thematic development
                    this.startThematicDevelopment();
                    
                    // Start dynamic phrasing
                    this.startDynamicPhrasing();
                    
                    this.classicalSystem.active = true;
                } catch (error) {
                    console.warn('Classical system error:', error);
                }
            };
            
            this.createHarmonicFoundation = () => {
                // Create sustained chord tones for harmonic foundation
                const currentChord = this.classicalSystem.chordProgressions[this.classicalSystem.currentChord];
                
                currentChord.forEach((freq, index) => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    
                    // Set up oscillator
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Filter for warmth
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(freq * 3, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(1, this.audioContext.currentTime);
                    
                    // Connect audio chain
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(this.sidechainGain || this.audioContext.destination);
                    
                    // Volume based on voice (bass louder, higher voices softer) - balanced
                    const volume = (3 - index) * 0.015;
                    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
                    
                    // Start oscillator
                    oscillator.start();
                    
                    // Store for later control
                    if (!this.classicalSystem.harmonicVoices) {
                        this.classicalSystem.harmonicVoices = [];
                    }
                    this.classicalSystem.harmonicVoices.push({ oscillator, gainNode, filter, freq });
                });
            };
            
            this.startThematicDevelopment = () => {
                // Play main theme with variations
                this.classicalSystem.interval = setInterval(() => {
                    this.playThemeNote();
                }, 300); // Theme notes every 300ms
            };
            
            this.playThemeNote = () => {
                const themeNote = this.classicalSystem.theme[this.classicalSystem.themeIndex];
                const duration = 0.4;
                const volume = 0.08; // Balanced for harmony
                
                // Create theme note with classical characteristics
                this.createClassicalNote(themeNote, duration, volume, 'triangle');
                
                // Move to next note
                this.classicalSystem.themeIndex = (this.classicalSystem.themeIndex + 1) % this.classicalSystem.theme.length;
                
                // Change chord every 4 notes (classical phrase structure)
                if (this.classicalSystem.themeIndex === 0) {
                    this.progressToNextChord();
                }
            };
            
            this.progressToNextChord = () => {
                // Classical chord progression: i - iv - V - i
                const progression = [0, 3, 4, 0]; // Am - Dm - E - Am
                this.classicalSystem.currentChord = progression[this.classicalSystem.phraseCount % progression.length];
                this.classicalSystem.phraseCount++;
                
                // Update harmonic foundation
                this.updateHarmonicFoundation();
            };
            
            this.updateHarmonicFoundation = () => {
                if (!this.classicalSystem.harmonicVoices) return;
                
                const currentChord = this.classicalSystem.chordProgressions[this.classicalSystem.currentChord];
                
                this.classicalSystem.harmonicVoices.forEach((voice, index) => {
                    if (index < currentChord.length) {
                        const newFreq = currentChord[index];
                        const now = this.audioContext.currentTime;
                        
                        // Smooth voice leading - gradual frequency change
                        voice.oscillator.frequency.setValueAtTime(voice.freq, now);
                        voice.oscillator.frequency.linearRampToValueAtTime(newFreq, now + 0.5);
                        voice.freq = newFreq;
                    }
                });
            };
            
            this.startDynamicPhrasing = () => {
                // Create dynamic phrasing based on game state
                setInterval(() => {
                    this.updateDynamics();
                }, 1000);
            };
            
            this.updateDynamics = () => {
                // Dynamic changes based on game intensity
                const baseDynamics = 0.3 + (this.classicalSystem.intensity * 0.4);
                const intensity = Math.min(this.level / 10, 1); // Scale with game level
                this.classicalSystem.dynamics = baseDynamics + (intensity * 0.4);
                
                // Update all voices with new dynamics
                if (this.classicalSystem.harmonicVoices) {
                    this.classicalSystem.harmonicVoices.forEach((voice, index) => {
                        const volume = (3 - index) * 0.02 * this.classicalSystem.dynamics;
                        voice.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
                    });
                }
            };
            
            this.createClassicalNote = (frequency, duration, volume, type = 'triangle') => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    
                    // Set up oscillator
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
                    // Filter for classical warmth
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 4, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(2, this.audioContext.currentTime);
                    
                    // Connect audio chain
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(this.sidechainGain || this.audioContext.destination);
                    
                    // Classical envelope - smooth attack and decay
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.1);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.7, this.audioContext.currentTime + duration * 0.7);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
                    
                    // Start oscillator
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + duration);
                } catch (error) {
                    console.warn('Classical note error:', error);
                }
            };
            
            // Enhanced musical note with articulations and musical phrasing
            this.createMusicalNote = (frequency, duration, volume, type = 'triangle', articulation = 'legato') => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    const reverb = this.createEtherealReverb();
                    
                    // Set up oscillator
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = type;
                    
                    // Add vibrato for musical expression
                    lfo.frequency.setValueAtTime(5, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.01, this.audioContext.currentTime);
                    
                    // Connect vibrato
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    
                    // Filter for ethereal warmth with musical character
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 2.5, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(4, this.audioContext.currentTime);
                    
                    // Connect audio chain with heavy reverb
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.sidechainGain || this.audioContext.destination);
                    
                    // Musical articulations
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    
                    // Extended duration for ethereal effect
                    const etherealDuration = duration * 2.5;
                    
                    switch (articulation) {
                        case 'staccato':
                            // Short, detached notes with ethereal tail
                            gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
                            gainNode.gain.linearRampToValueAtTime(volume * 0.6, now + duration * 0.2);
                            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + etherealDuration);
                            break;
                        case 'accent':
                            // Accented notes with ethereal emphasis
                            gainNode.gain.linearRampToValueAtTime(volume * 1.2, now + 0.01);
                            gainNode.gain.linearRampToValueAtTime(volume * 0.8, now + 0.05);
                            gainNode.gain.linearRampToValueAtTime(volume * 0.4, now + duration * 0.6);
                            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + etherealDuration);
                            break;
                        case 'marcato':
                            // Strong, marked notes with ethereal power
                            gainNode.gain.linearRampToValueAtTime(volume * 1.3, now + 0.005);
                            gainNode.gain.linearRampToValueAtTime(volume * 0.9, now + 0.08);
                            gainNode.gain.linearRampToValueAtTime(volume * 0.5, now + duration * 0.5);
                            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + etherealDuration);
                            break;
                        case 'legato':
                        default:
                            // Smooth, connected notes with ethereal flow
                            gainNode.gain.linearRampToValueAtTime(volume, now + 0.1);
                            gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + duration * 0.6);
                            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + etherealDuration);
                            break;
                    }
                    
                    // Start oscillators
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + etherealDuration);
                    lfo.stop(now + etherealDuration);
                } catch (error) {
                    console.warn('Musical note error:', error);
                }
            };
            
            this.stopClassicalSystem = () => {
                if (this.classicalSystem.interval) {
                    clearInterval(this.classicalSystem.interval);
                    this.classicalSystem.interval = null;
                }
                if (this.classicalSystem.harmonicVoices) {
                    this.classicalSystem.harmonicVoices.forEach(({ oscillator }) => {
                        try {
                            oscillator.stop();
                        } catch (e) {}
                    });
                    this.classicalSystem.harmonicVoices = [];
                }
                this.classicalSystem.active = false;
            };
            
            // Apply adaptive EQ based on frequency spectrum and current energy
            this.applyAdaptiveEQ = (filter, frequency) => {
                if (!this.classicalSystem) return;
                
                const spectrum = this.classicalSystem.frequencySpectrum;
                const energy = this.classicalSystem.energy;
                const tension = this.classicalSystem.tension;
                
                // Determine frequency band
                let bandMultiplier = 1;
                if (frequency < 250) {
                    bandMultiplier = spectrum.bass + (energy * 0.3);
                } else if (frequency < 2000) {
                    bandMultiplier = spectrum.lowMid + (tension * 0.2);
                } else if (frequency < 4000) {
                    bandMultiplier = spectrum.mid + (energy * 0.4);
                } else if (frequency < 8000) {
                    bandMultiplier = spectrum.highMid + (tension * 0.3);
                } else {
                    bandMultiplier = spectrum.treble + (energy * 0.2);
                }
                
                // Apply adaptive filtering
                const baseFreq = frequency * 3;
                const adaptiveFreq = baseFreq * (0.5 + bandMultiplier * 0.5);
                const adaptiveQ = 1 + (tension * 2);
                
                filter.frequency.setValueAtTime(adaptiveFreq, this.audioContext.currentTime);
                filter.Q.setValueAtTime(adaptiveQ, this.audioContext.currentTime);
            };
            
            // Update audio momentum and energy based on gameplay
            this.updateAudioMomentum = () => {
                if (!this.classicalSystem) return;
                
                // Calculate momentum based on recent actions
                const recentActions = this.recentActions || [];
                const now = Date.now();
                const recentThreshold = 2000; // 2 seconds
                
                // Count recent actions
                const recentCount = recentActions.filter(action => now - action.time < recentThreshold).length;
                
                // Update momentum (0-1)
                this.classicalSystem.momentum = Math.min(1, recentCount / 10);
                
                // Update energy based on momentum and level
                this.classicalSystem.energy = (this.classicalSystem.momentum * 0.6) + (this.classicalSystem.intensity * 0.4);
                
                // Update tension based on game state
                const linesNearTop = this.getLinesNearTop();
                this.classicalSystem.tension = Math.min(1, linesNearTop / 5);
                
                // Update adaptive tempo
                const baseTempo = 128;
                const tempoBoost = this.classicalSystem.energy * 20;
                this.classicalSystem.adaptiveTempo = baseTempo + tempoBoost;
                
                // Update adaptive volume
                const baseVolume = 0.7;
                const volumeBoost = this.classicalSystem.energy * 0.3;
                this.classicalSystem.adaptiveVolume = baseVolume + volumeBoost;
            };
            
            // Get number of lines near the top for tension calculation
            this.getLinesNearTop = () => {
                if (!this.board) return 0;
                let linesNearTop = 0;
                for (let y = 0; y < 5; y++) {
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        if (this.board[y][x] !== 0) {
                            linesNearTop++;
                            break;
                        }
                    }
                }
                return linesNearTop;
            };
            
            // Track recent actions for momentum calculation
            this.trackAction = (actionType) => {
                if (!this.recentActions) this.recentActions = [];
                this.recentActions.push({
                    type: actionType,
                    time: Date.now()
                });
                
                // Keep only recent actions
                this.recentActions = this.recentActions.filter(action => Date.now() - action.time < 5000);
                
                // Update momentum
                this.updateAudioMomentum();
            };
            
            // Update master gain with adaptive volume
            this.updateMasterGain = () => {
                if (!this.masterGain || !this.classicalSystem) return;
                
                const now = this.audioContext.currentTime;
                const targetVolume = this.classicalSystem.adaptiveVolume;
                
                // Smooth transition to adaptive volume
                this.masterGain.gain.linearRampToValueAtTime(targetVolume, now + 0.1);
            };
            
            // Update frequency spectrum based on current audio
            this.updateFrequencySpectrum = () => {
                if (!this.analyser || !this.classicalSystem) return;
                
                const bufferLength = this.analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                this.analyser.getByteFrequencyData(dataArray);
                
                // Analyze frequency bands
                const bass = this.getFrequencyBand(dataArray, 0, 10); // 0-250 Hz
                const lowMid = this.getFrequencyBand(dataArray, 10, 40); // 250-2000 Hz
                const mid = this.getFrequencyBand(dataArray, 40, 80); // 2000-4000 Hz
                const highMid = this.getFrequencyBand(dataArray, 80, 160); // 4000-8000 Hz
                const treble = this.getFrequencyBand(dataArray, 160, 256); // 8000+ Hz
                
                // Update spectrum with smoothing
                const smoothing = 0.8;
                this.classicalSystem.frequencySpectrum.bass = 
                    (this.classicalSystem.frequencySpectrum.bass * smoothing) + (bass * (1 - smoothing));
                this.classicalSystem.frequencySpectrum.lowMid = 
                    (this.classicalSystem.frequencySpectrum.lowMid * smoothing) + (lowMid * (1 - smoothing));
                this.classicalSystem.frequencySpectrum.mid = 
                    (this.classicalSystem.frequencySpectrum.mid * smoothing) + (mid * (1 - smoothing));
                this.classicalSystem.frequencySpectrum.highMid = 
                    (this.classicalSystem.frequencySpectrum.highMid * smoothing) + (highMid * (1 - smoothing));
                this.classicalSystem.frequencySpectrum.treble = 
                    (this.classicalSystem.frequencySpectrum.treble * smoothing) + (treble * (1 - smoothing));
            };
            
            // Get average amplitude for a frequency band
            this.getFrequencyBand = (dataArray, start, end) => {
                let sum = 0;
                for (let i = start; i < end && i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                return sum / (end - start) / 255; // Normalize to 0-1
            };
            
            // Create percussive click for tactile feedback
            this.createPercussiveClick = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    
                    // Sharp, percussive sound
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'square';
                    
                    // High-pass filter for click character
                    filter.type = 'highpass';
                    filter.frequency.setValueAtTime(frequency * 0.8, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(2, this.audioContext.currentTime);
                    
                    // Connect audio chain
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(this.masterGain || this.audioContext.destination);
                    
                    // Sharp attack and quick decay
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.001);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    oscillator.stop(now + duration);
                } catch (error) {
                    console.warn('Percussive click error:', error);
                }
            };
            
            // Create impact thump for low-frequency impact
            this.createImpactThump = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    
                    // Deep, resonant sound
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sawtooth';
                    
                    // Low-pass filter for thump character
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 3, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);
                    
                    // Connect audio chain
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(this.masterGain || this.audioContext.destination);
                    
                    // Quick attack, slow decay
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    oscillator.stop(now + duration);
                } catch (error) {
                    console.warn('Impact thump error:', error);
                }
            };
            
            // Create sparkle for high-frequency responsiveness
            this.createSparkle = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    
                    // Bright, sparkling sound
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'triangle';
                    
                    // Add vibrato for sparkle effect
                    lfo.frequency.setValueAtTime(15, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.1, this.audioContext.currentTime);
                    
                    // Band-pass filter for sparkle character
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(3, this.audioContext.currentTime);
                    
                    // Connect audio chain
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(this.masterGain || this.audioContext.destination);
                    
                    // Quick attack, quick decay
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.005);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + duration);
                    lfo.stop(now + duration);
                } catch (error) {
                    console.warn('Sparkle error:', error);
                }
            };
            
            // Create mechanical whir for rotation feel
            this.createMechanicalWhir = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    
                    // Mechanical whirring sound
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sawtooth';
                    
                    // Add slow modulation for whir effect
                    lfo.frequency.setValueAtTime(3, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.05, this.audioContext.currentTime);
                    
                    // Low-pass filter for mechanical character
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(1, this.audioContext.currentTime);
                    
                    // Connect audio chain
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(this.masterGain || this.audioContext.destination);
                    
                    // Gradual attack and decay
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + duration * 0.7);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + duration);
                    lfo.stop(now + duration);
                } catch (error) {
                    console.warn('Mechanical whir error:', error);
                }
            };
            
            // Create gear click for mechanical feedback
            this.createGearClick = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    
                    // Sharp gear click
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'square';
                    
                    // Band-pass filter for click character
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(5, this.audioContext.currentTime);
                    
                    // Connect audio chain
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(this.masterGain || this.audioContext.destination);
                    
                    // Very sharp attack and quick decay
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.0005);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    oscillator.stop(now + duration);
                } catch (error) {
                    console.warn('Gear click error:', error);
                }
            };
            
            // Create gravity whoosh for falling motion
            this.createGravityWhoosh = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    
                    // Whooshing sound
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sawtooth';
                    
                    // Add frequency sweep for whoosh effect
                    lfo.frequency.setValueAtTime(0.5, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.3, this.audioContext.currentTime);
                    
                    // High-pass filter for whoosh character
                    filter.type = 'highpass';
                    filter.frequency.setValueAtTime(frequency * 0.5, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(1, this.audioContext.currentTime);
                    
                    // Connect audio chain
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(this.masterGain || this.audioContext.destination);
                    
                    // Gradual attack and decay
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.1);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.2, now + duration * 0.8);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + duration);
                    lfo.stop(now + duration);
                } catch (error) {
                    console.warn('Gravity whoosh error:', error);
                }
            };
            
            // Create resonance for depth and sustain
            this.createResonance = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const reverb = this.createReverb();
                    
                    // Resonant tone
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Resonant filter
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 1.5, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(8, this.audioContext.currentTime);
                    
                    // Connect audio chain with reverb
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.masterGain || this.audioContext.destination);
                    
                    // Slow attack, long sustain, slow decay
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.2);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.8, now + duration * 0.3);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.4, now + duration * 0.7);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    oscillator.stop(now + duration);
                } catch (error) {
                    console.warn('Resonance error:', error);
                }
            };
            
            // Create anticipation sound for building tension
            this.createAnticipation = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    
                    // Rising anticipation tone
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Add rising frequency for anticipation
                    lfo.frequency.setValueAtTime(2, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.2, this.audioContext.currentTime);
                    
                    // Band-pass filter for anticipation character
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(2, this.audioContext.currentTime);
                    
                    // Connect audio chain
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(this.masterGain || this.audioContext.destination);
                    
                    // Rising volume for anticipation
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + duration * 0.3);
                    gainNode.gain.linearRampToValueAtTime(volume, now + duration);
                    
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + duration);
                    lfo.stop(now + duration);
                } catch (error) {
                    console.warn('Anticipation error:', error);
                }
            };
            
            // Create micro-interaction sound for subtle feedback
            this.createMicroInteraction = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    
                    // Subtle micro-interaction
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'triangle';
                    
                    // High-pass filter for subtlety
                    filter.type = 'highpass';
                    filter.frequency.setValueAtTime(frequency * 0.8, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(1, this.audioContext.currentTime);
                    
                    // Connect audio chain
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(this.masterGain || this.audioContext.destination);
                    
                    // Very quick, subtle envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    oscillator.stop(now + duration);
                } catch (error) {
                    console.warn('Micro interaction error:', error);
                }
            };
            
            // Create ethereal tone for trance-like atmosphere
            this.createEtherealTone = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    const reverb = this.createReverb();
                    
                    // Ethereal tone with gentle vibrato
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Gentle vibrato for ethereal character
                    lfo.frequency.setValueAtTime(3, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.02, this.audioContext.currentTime);
                    
                    // Soft low-pass filter for warmth
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);
                    
                    // Connect audio chain with reverb
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.masterGain || this.audioContext.destination);
                    
                    // Gentle envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.1);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.6, now + duration * 0.7);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + duration);
                    lfo.stop(now + duration);
                } catch (error) {
                    console.warn('Ethereal tone error:', error);
                }
            };
            
            // Create ethereal pad for atmospheric background
            this.createEtherealPad = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    const reverb = this.createReverb();
                    
                    // Ethereal pad with slow modulation
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Slow modulation for pad character
                    lfo.frequency.setValueAtTime(0.5, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.05, this.audioContext.currentTime);
                    
                    // Soft low-pass filter
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 1.5, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(0.3, this.audioContext.currentTime);
                    
                    // Connect audio chain with reverb
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.masterGain || this.audioContext.destination);
                    
                    // Very gentle envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.3);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.8, now + duration * 0.5);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + duration);
                    lfo.stop(now + duration);
                } catch (error) {
                    console.warn('Ethereal pad error:', error);
                }
            };
            
            // Create gentle sparkle for ethereal responsiveness
            this.createGentleSparkle = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    
                    // Gentle sparkle
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'triangle';
                    
                    // Gentle vibrato
                    lfo.frequency.setValueAtTime(8, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.05, this.audioContext.currentTime);
                    
                    // Soft band-pass filter
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(1, this.audioContext.currentTime);
                    
                    // Connect audio chain
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(this.masterGain || this.audioContext.destination);
                    
                    // Gentle envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.4, now + duration * 0.6);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + duration);
                    lfo.stop(now + duration);
                } catch (error) {
                    console.warn('Gentle sparkle error:', error);
                }
            };
            
            // Create ethereal sweep for rotation feel
            this.createEtherealSweep = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    const reverb = this.createReverb();
                    
                    // Ethereal sweep
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Gentle frequency sweep
                    lfo.frequency.setValueAtTime(1, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.1, this.audioContext.currentTime);
                    
                    // Soft low-pass filter
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 1.8, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(0.4, this.audioContext.currentTime);
                    
                    // Connect audio chain with reverb
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.masterGain || this.audioContext.destination);
                    
                    // Gentle envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.1);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.5, now + duration * 0.8);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + duration);
                    lfo.stop(now + duration);
                } catch (error) {
                    console.warn('Ethereal sweep error:', error);
                }
            };
            
            // Create ethereal descent for falling motion
            this.createEtherealDescent = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    const reverb = this.createReverb();
                    
                    // Ethereal descent
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Gentle frequency descent
                    lfo.frequency.setValueAtTime(0.8, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.15, this.audioContext.currentTime);
                    
                    // Soft low-pass filter
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 1.2, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(0.3, this.audioContext.currentTime);
                    
                    // Connect audio chain with reverb
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.masterGain || this.audioContext.destination);
                    
                    // Gentle envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.2);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.6, now + duration * 0.7);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + duration);
                    lfo.stop(now + duration);
                } catch (error) {
                    console.warn('Ethereal descent error:', error);
                }
            };
            
            // Create gentle resonance for depth
            this.createGentleResonance = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const reverb = this.createReverb();
                    
                    // Gentle resonance
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Soft resonant filter
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 1.2, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(2, this.audioContext.currentTime);
                    
                    // Connect audio chain with reverb
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.masterGain || this.audioContext.destination);
                    
                    // Very gentle envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.3);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + duration * 0.4);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + duration * 0.8);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    oscillator.stop(now + duration);
                } catch (error) {
                    console.warn('Gentle resonance error:', error);
                }
            };
            
            // Create prominent trance tone with heavy reverb
            this.createTranceTone = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    const reverb = this.createReverb();
                    
                    // Prominent trance tone
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Rich vibrato for trance character
                    lfo.frequency.setValueAtTime(4, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.05, this.audioContext.currentTime);
                    
                    // Warm low-pass filter
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 2.5, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(1, this.audioContext.currentTime);
                    
                    // Connect audio chain with heavy reverb
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.masterGain || this.audioContext.destination);
                    
                    // Prominent envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.8, now + duration * 0.6);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + duration);
                    lfo.stop(now + duration);
                } catch (error) {
                    console.warn('Trance tone error:', error);
                }
            };
            
            // Create floating pad with slow modulation
            this.createFloatingPad = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    const reverb = this.createReverb();
                    
                    // Floating pad
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Slow modulation for floating character
                    lfo.frequency.setValueAtTime(0.3, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.1, this.audioContext.currentTime);
                    
                    // Soft low-pass filter
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 1.8, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);
                    
                    // Connect audio chain with heavy reverb
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.masterGain || this.audioContext.destination);
                    
                    // Floating envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.4);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.9, now + duration * 0.3);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.6, now + duration * 0.7);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + duration);
                    lfo.stop(now + duration);
                } catch (error) {
                    console.warn('Floating pad error:', error);
                }
            };
            
            // Create trance sparkle with frequency sweep
            this.createTranceSparkle = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    const reverb = this.createReverb();
                    
                    // Trance sparkle
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'triangle';
                    
                    // Fast vibrato for sparkle
                    lfo.frequency.setValueAtTime(12, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.08, this.audioContext.currentTime);
                    
                    // Band-pass filter for sparkle character
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(2, this.audioContext.currentTime);
                    
                    // Connect audio chain with reverb
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.masterGain || this.audioContext.destination);
                    
                    // Sparkle envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + duration * 0.4);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + duration);
                    lfo.stop(now + duration);
                } catch (error) {
                    console.warn('Trance sparkle error:', error);
                }
            };
            
            // Create bass pulse for impact
            this.createBassPulse = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const reverb = this.createReverb();
                    
                    // Bass pulse
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Low-pass filter for bass character
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(0.3, this.audioContext.currentTime);
                    
                    // Connect audio chain with reverb
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.masterGain || this.audioContext.destination);
                    
                    // Pulse envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.1);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.8, now + duration * 0.3);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.4, now + duration * 0.7);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    oscillator.stop(now + duration);
                } catch (error) {
                    console.warn('Bass pulse error:', error);
                }
            };
            
            // Create dramatic sweep for rotation
            this.createDramaticSweep = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    const reverb = this.createReverb();
                    
                    // Dramatic sweep
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Dramatic frequency sweep
                    lfo.frequency.setValueAtTime(2, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.3, this.audioContext.currentTime);
                    
                    // Low-pass filter
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 2.2, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(0.6, this.audioContext.currentTime);
                    
                    // Connect audio chain with reverb
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.masterGain || this.audioContext.destination);
                    
                    // Dramatic envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.1);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.6, now + duration * 0.8);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + duration);
                    lfo.stop(now + duration);
                } catch (error) {
                    console.warn('Dramatic sweep error:', error);
                }
            };
            
            // Create sparkle cascade for ethereal effect
            this.createSparkleCascade = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    // Create multiple sparkles in cascade
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            this.createTranceSparkle(frequency * (1 + i * 0.3), duration * 0.6, volume * 0.7);
                        }, i * 100);
                    }
                } catch (error) {
                    console.warn('Sparkle cascade error:', error);
                }
            };
            
            // Create dramatic descent for drop
            this.createDramaticDescent = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    const reverb = this.createReverb();
                    
                    // Dramatic descent
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Dramatic frequency descent
                    lfo.frequency.setValueAtTime(1.5, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.4, this.audioContext.currentTime);
                    
                    // Low-pass filter
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 1.5, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(0.4, this.audioContext.currentTime);
                    
                    // Connect audio chain with reverb
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.masterGain || this.audioContext.destination);
                    
                    // Dramatic envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.2);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + duration * 0.6);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + duration);
                    lfo.stop(now + duration);
                } catch (error) {
                    console.warn('Dramatic descent error:', error);
                }
            };
            
            // Create deep resonance for impact
            this.createDeepResonance = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const reverb = this.createReverb();
                    
                    // Deep resonance
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Resonant filter
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 1.3, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(4, this.audioContext.currentTime);
                    
                    // Connect audio chain with reverb
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.masterGain || this.audioContext.destination);
                    
                    // Deep envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.3);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.9, now + duration * 0.4);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.5, now + duration * 0.8);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    oscillator.stop(now + duration);
                } catch (error) {
                    console.warn('Deep resonance error:', error);
                }
            };
            
            // Create clean tone with reverb - simple and clean
            this.createCleanTone = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const reverb = this.createReverb();
                    
                    // Clean tone
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Soft low-pass filter for warmth
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);
                    
                    // Connect audio chain with reverb
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.masterGain || this.audioContext.destination);
                    
                    // Clean envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + duration * 0.6);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    oscillator.stop(now + duration);
                } catch (error) {
                    console.warn('Clean tone error:', error);
                }
            };
            
            // Create harmonious note - simple, clean, and musical with natural layering
            this.createHarmoniousNote = (frequency, duration, volume, type = 'sine') => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const reverb = this.createReverb();
                    
                    // Set up oscillator
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = type;
                    
                    // Simple filter for warmth
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 3, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(1, this.audioContext.currentTime);
                    
                    // Connect audio chain with moderate reverb
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.masterGain || this.audioContext.destination);
                    
                    // Apply adaptive frequency response based on current spectrum
                    this.applyAdaptiveEQ(filter, frequency);
                    
                    // Natural envelope with extended fade for layering
                    const now = this.audioContext.currentTime;
                    const extendedDuration = duration * 2; // Allow sounds to layer longer
                    
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.4, now + duration * 0.6);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.1, now + duration);
                    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + extendedDuration);
                    
                    // Start oscillator and let it fade naturally
                    oscillator.start(now);
                    oscillator.stop(now + extendedDuration);
                } catch (error) {
                    console.warn('Harmonious note error:', error);
                }
            };
            
            // Create arpeggiator sound with FM synthesis
            this.createArpeggiatorSound = (frequency, duration, type = 'triangle', volume = 0.1) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    // Carrier oscillator
                    const carrier = this.audioContext.createOscillator();
                    const modulator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const modGain = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    
                    // FM synthesis setup
                    carrier.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    carrier.type = type;
                    
                    modulator.frequency.setValueAtTime(frequency * 0.5, this.audioContext.currentTime);
                    modulator.type = 'sine';
                    
                    modGain.gain.setValueAtTime(frequency * 0.3, this.audioContext.currentTime);
                    
                    // Connect FM synthesis
                    modulator.connect(modGain);
                    modGain.connect(carrier.frequency);
                    carrier.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(this.sidechainGain || this.audioContext.destination);
                    
                    // Filter for ethereal sound
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 3, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(2, this.audioContext.currentTime);
                    
                    // Envelope
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
                    
                    carrier.start(this.audioContext.currentTime);
                    modulator.start(this.audioContext.currentTime);
                    carrier.stop(this.audioContext.currentTime + duration);
                    modulator.stop(this.audioContext.currentTime + duration);
                } catch (error) {
                    console.warn('Arpeggiator audio error:', error);
                }
            };
            
            // Create ambient progressive backing track
            this.createAmbientBacking = (frequency, duration, volume) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    const reverb = this.createReverb();
                    
                    // Ambient backing
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    // Slow modulation for ambient character
                    lfo.frequency.setValueAtTime(0.2, this.audioContext.currentTime);
                    lfo.type = 'sine';
                    lfoGain.gain.setValueAtTime(frequency * 0.05, this.audioContext.currentTime);
                    
                    // Soft low-pass filter for warmth
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(frequency * 1.2, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(0.3, this.audioContext.currentTime);
                    
                    // Connect audio chain with reverb
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(reverb.convolver);
                    reverb.reverbGain.connect(this.audioContext.destination);
                    
                    // Ambient envelope
                    const now = this.audioContext.currentTime;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(volume, now + 0.5);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.8, now + duration * 0.3);
                    gainNode.gain.linearRampToValueAtTime(volume * 0.6, now + duration * 0.7);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    lfo.start(now);
                    oscillator.stop(now + duration);
                    lfo.stop(now + duration);
                } catch (error) {
                    console.warn('Ambient backing error:', error);
                }
            };
            
            // Granular synthesis for textural sounds
            this.createGranularSound = (frequency, duration, volume = 0.1) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const grainCount = Math.floor(duration / this.granular.grainSize);
                    
                    for (let i = 0; i < grainCount; i++) {
                        setTimeout(() => {
                            const oscillator = this.audioContext.createOscillator();
                            const gainNode = this.audioContext.createGain();
                            const filter = this.audioContext.createBiquadFilter();
                            
                            // Random frequency variation for granular texture
                            const freqVariation = frequency + (Math.random() - 0.5) * frequency * 0.1;
                            oscillator.frequency.setValueAtTime(freqVariation, this.audioContext.currentTime);
                            oscillator.type = 'sawtooth';
                            
                            // Filter for texture
                            filter.type = 'bandpass';
                            filter.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime);
                            filter.Q.setValueAtTime(10, this.audioContext.currentTime);
                            
                            // Granular envelope
                            const grainDuration = this.granular.grainSize * (0.5 + Math.random() * 0.5);
                            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                            gainNode.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.001);
                            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + grainDuration);
                            
                            // Connect audio chain
                            oscillator.connect(filter);
                            filter.connect(gainNode);
                            gainNode.connect(this.sidechainGain || this.audioContext.destination);
                            
                            oscillator.start(this.audioContext.currentTime);
                            oscillator.stop(this.audioContext.currentTime + grainDuration);
                        }, i * this.granular.grainSize * 1000 * this.granular.overlap);
                    }
                } catch (error) {
                    console.warn('Granular synthesis error:', error);
                }
            };
            
            // Spectral filtering and formant synthesis
            this.createSpectralSound = (frequency, duration, volume = 0.1) => {
                if (!this.audioInitialized || !this.audioContext) return;
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    // Multiple formant filters for vocal-like quality
                    const formant1 = this.audioContext.createBiquadFilter();
                    const formant2 = this.audioContext.createBiquadFilter();
                    const formant3 = this.audioContext.createBiquadFilter();
                    
                    // Formant frequencies (vowel-like)
                    formant1.type = 'bandpass';
                    formant1.frequency.setValueAtTime(800, this.audioContext.currentTime);
                    formant1.Q.setValueAtTime(5, this.audioContext.currentTime);
                    
                    formant2.type = 'bandpass';
                    formant2.frequency.setValueAtTime(1200, this.audioContext.currentTime);
                    formant2.Q.setValueAtTime(5, this.audioContext.currentTime);
                    
                    formant3.type = 'bandpass';
                    formant3.frequency.setValueAtTime(2500, this.audioContext.currentTime);
                    formant3.Q.setValueAtTime(5, this.audioContext.currentTime);
                    
                    // Connect formant chain
                    oscillator.connect(formant1);
                    formant1.connect(formant2);
                    formant2.connect(formant3);
                    formant3.connect(gainNode);
                    gainNode.connect(this.sidechainGain || this.audioContext.destination);
                    
                    // Set oscillator properties
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sawtooth';
                    
                    // Envelope
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + duration);
                } catch (error) {
                    console.warn('Spectral synthesis error:', error);
                }
            };
            
            // Create techno sound with heavy reverb and layering
            this.createTechnoSound = (frequency, duration, type = 'sine', volume = 0.1, isMetronome = false) => {
                if (!this.audioInitialized || !this.audioContext) {
                    this.initAudioContext();
                    if (!this.audioInitialized || !this.audioContext) return;
                }
                
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const reverb = this.createReverb();
                    
                    // Connect with heavy reverb
            oscillator.connect(gainNode);
                    gainNode.connect(reverb.convolver);
            
                    // Set oscillator properties
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
                    // Add some detuning for more character
                    if (!isMetronome) {
                        oscillator.detune.setValueAtTime(Math.random() * 20 - 10, this.audioContext.currentTime);
                    }
                    
                    // Longer duration for layering effect
                    const extendedDuration = duration * 3;
                    
                    // Envelope with stretched falloff for layering
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + extendedDuration);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + extendedDuration);
                } catch (error) {
                    console.warn('Audio playback error:', error);
                }
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
                    // Clean move sound with reverb
                    const currentChord = this.classicalSystem.chordProgressions[this.classicalSystem.currentChord];
                    const freq = currentChord[1]; // Use middle voice of current chord
                    
                    // Track action for momentum
                    this.trackAction('move');
                    
                    // Increased volume for prominence
                    const adaptiveVolume = 0.8 * this.classicalSystem.adaptiveVolume;
                    
                    // Simple clean tone with reverb
                    this.createCleanTone(freq, 0.3, adaptiveVolume);
                    
                    this.triggerSidechain();
                },
                rotate: () => {
                    // Clean rotate sound with reverb
                    const currentChord = this.classicalSystem.chordProgressions[this.classicalSystem.currentChord];
                    const freq = currentChord[2]; // Use top voice of current chord
                    
                    // Track action for momentum
                    this.trackAction('rotate');
                    
                    // Increased volume with tension boost
                    const adaptiveVolume = 1.0 * this.classicalSystem.adaptiveVolume * (1 + this.classicalSystem.tension * 0.3);
                    
                    // Simple clean tone with reverb
                    this.createCleanTone(freq, 0.4, adaptiveVolume);
                    
                    this.triggerSidechain();
                },
                drop: () => {
                    // Clean drop sound with reverb
                    const currentChord = this.classicalSystem.chordProgressions[this.classicalSystem.currentChord];
                    const freq = currentChord[0]; // Bass note
                    
                    // Track action for momentum
                    this.trackAction('drop');
                    
                    // Increased volume with energy boost
                    const adaptiveVolume = 1.2 * this.classicalSystem.adaptiveVolume * (1 + this.classicalSystem.energy * 0.4);
                    
                    // Simple clean tone with reverb
                    this.createCleanTone(freq, 0.5, adaptiveVolume);
                    
                    this.triggerSidechain();
                },
            lineClear: () => {
                    // Multi-layered celebration for line clear
                    const currentChord = this.classicalSystem.chordProgressions[this.classicalSystem.currentChord];
                    
                    // Track action for momentum
                    this.trackAction('lineClear');
                    
                    // Boost energy and momentum on line clear
                    this.classicalSystem.energy = Math.min(1, this.classicalSystem.energy + 0.2);
                    this.classicalSystem.momentum = Math.min(1, this.classicalSystem.momentum + 0.3);
                    
                    // Adaptive volume with celebration boost
                    const adaptiveVolume = 0.6 * this.classicalSystem.adaptiveVolume * (1 + this.classicalSystem.energy * 0.5);
                    
                    // Layer 1: Chord arpeggio
                    currentChord.forEach((freq, index) => {
                        setTimeout(() => {
                            this.createHarmoniousNote(freq, 0.4, adaptiveVolume, 'triangle');
                        }, index * 100);
                    });
                    
                    // Layer 2: Celebration sparkles
                    setTimeout(() => {
                        for (let i = 0; i < 3; i++) {
                            setTimeout(() => {
                                this.createSparkle(currentChord[0] * (2 + i), 0.3, adaptiveVolume * 0.4);
                            }, i * 50);
                        }
                    }, 200);
                    
                    // Layer 3: Impact celebration
                    setTimeout(() => {
                        this.createImpactThump(currentChord[0] * 0.5, 0.5, adaptiveVolume * 0.8);
                    }, 300);
                    
                    // Layer 4: Resonance celebration
                    setTimeout(() => {
                        this.createResonance(currentChord[0] * 0.75, 1.0, adaptiveVolume * 0.6);
                    }, 400);
                    
                    this.triggerSidechain();
            },
            gameOver: () => {
                    // Descending layered sound
                    this.createTechnoSound(400, 0.5, 'sawtooth', 0.25);
                    setTimeout(() => this.createTechnoSound(300, 0.5, 'sawtooth', 0.25), 100);
                    setTimeout(() => this.createTechnoSound(200, 0.5, 'sawtooth', 0.25), 200);
                    setTimeout(() => this.createTechnoSound(100, 0.5, 'sawtooth', 0.25), 300);
                },
                button: () => {
                    this.createTechnoSound(800, 0.15, 'square', 0.12);
                },
            levelUp: () => {
                    this.createTechnoSound(600, 0.4, 'triangle', 0.25);
                },
                tetris: () => {
                    // Progressive Tetris - ascending scale for triumph
                    const scale = this.classicalSystem.scale;
                    const ascendingScale = scale.slice(0, 4).concat(scale.slice(0, 4).map(f => f * 2));
                    
                    ascendingScale.forEach((freq, index) => {
                        setTimeout(() => {
                            this.createHarmoniousNote(freq, 0.5, 0.8, 'triangle');
                        }, index * 80); // Faster, more rhythmic
                    });
                },
                landing: () => {
                    // Harmonious landing sound
                    const currentChord = this.classicalSystem.chordProgressions[this.classicalSystem.currentChord];
                    const bassFreq = currentChord[0]; // Bass note
                    
                    this.createHarmoniousNote(bassFreq, 0.4, 0.6, 'sine');
                },
                contact: () => {
                    // Harmonious contact sound
                    const currentChord = this.classicalSystem.chordProgressions[this.classicalSystem.currentChord];
                    const freq = currentChord[1]; // Middle voice
                    
                    this.createHarmoniousNote(freq, 0.1, 0.2, 'triangle');
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
        } else {
            // Collision detected - add subtle contact sound
            if (dx !== 0) {
                this.sounds.contact();
            }
            
            if (dy > 0) {
                // Add anticipation sound before placing piece
                const currentChord = this.classicalSystem.chordProgressions[this.classicalSystem.currentChord];
                this.createAnticipation(currentChord[0] * 0.8, 0.1, 0.15);
                
                this.placePiece();
            }
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
        
        // Add contact/landing sound effect
        this.sounds.landing();
        
        // Add micro-interaction for subtle feedback
        const currentChord = this.classicalSystem.chordProgressions[this.classicalSystem.currentChord];
        this.createMicroInteraction(currentChord[1] * 1.5, 0.05, 0.1);
        
        this.clearLines();
        this.spawnPiece();
    }
    
    /**
     * Spawn a new piece
     */
    spawnPiece() {
        // If no next piece, generate one
        if (!this.nextPiece) {
            this.nextPiece = this.getRandomPiece();
        }
        
        // Set current piece to next piece
        this.currentPiece = {
            ...this.nextPiece,
            x: Math.floor((this.BOARD_WIDTH - this.nextPiece.shape[0].length) / 2),
            y: 0
        };
        
        // Generate new next piece
        this.nextPiece = this.getRandomPiece();
        
        // Reset hold ability
        this.canHold = true;
        
        // Check for game over
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.gameOver();
            return;
        }
        
        // Update displays
        this.drawNextPiece();
        this.updateDisplay();
    }
    
    /**
     * Get a random piece
     */
    getRandomPiece() {
        const randomIndex = Math.floor(Math.random() * this.pieces.length);
        return { ...this.pieces[randomIndex] };
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
            
            // Update classical system intensity based on level
            if (this.sounds && this.sounds.classicalSystem) {
                this.sounds.classicalSystem.level = this.level;
                this.sounds.classicalSystem.intensity = Math.min(1, (this.level - 1) * 0.2);
            }
            
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
        
        // Update audio systems
        this.updateAudioMomentum();
        this.updateMasterGain();
        this.updateFrequencySpectrum();
        
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
        
        // Spawn the first piece
        this.spawnPiece();
        
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
        
        // Clear the board
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        
        // Reset all game state
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        this.dropTime = Date.now();
        this.lastMoveTime = 0;
        
        // Generate new pieces
        this.nextPiece = this.getRandomPiece();
        
        // Spawn the first piece immediately
        this.spawnPiece();
        
        // Start the game so pieces fall
        this.gameRunning = true;
        this.gamePaused = false;
        this.sounds.startMetronome();
        this.gameLoop();
        
        // Update displays
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
        this.sounds.gameOver();
        this.gameScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        
        document.getElementById('finalScore').textContent = this.score.toString().padStart(6, '0');
        document.getElementById('finalLevel').textContent = this.level.toString().padStart(2, '0');
        document.getElementById('finalLines').textContent = this.lines.toString().padStart(3, '0');
    }
    
    // UI Management Methods
    showMainMenu() {
        this.sounds.button();
        this.mainMenu.classList.remove('hidden');
        this.instructionsScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.pauseGame();
    }
    
    showInstructionsScreen() {
        this.sounds.button();
        this.mainMenu.classList.add('hidden');
        this.instructionsScreen.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
    }
    
    showGameScreen() {
        this.sounds.button();
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