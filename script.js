const loginScreen = document.getElementById('login-screen');
const playScreen = document.getElementById('play-screen');
const loginBtn = document.getElementById('login-btn');
const homeBtn = document.getElementById('home-btn');
const soundBtn = document.getElementById('sound-btn');
const usernameInput = document.getElementById('username');
const playerNameDisplay = document.getElementById('player-name');

let currentUsername = 'Player 1';
let isSoundEnabled = true;

// Audio Context setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol = 0.1) {
    if (!isSoundEnabled || audioCtx.state === 'suspended') return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

const sounds = {
    move: () => playTone(300, 'square', 0.1, 0.05),
    rotate: () => playTone(400, 'square', 0.1, 0.05),
    drop: () => playTone(150, 'sawtooth', 0.1, 0.1),
    clear: () => {
        playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => playTone(800, 'sine', 0.2, 0.15), 100);
    },
    gameOver: () => {
        playTone(300, 'sawtooth', 0.3, 0.2);
        setTimeout(() => playTone(250, 'sawtooth', 0.3, 0.2), 300);
        setTimeout(() => playTone(200, 'sawtooth', 0.5, 0.2), 600);
    }
};

soundBtn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    soundBtn.classList.toggle('active', isSoundEnabled);
    if (isSoundEnabled && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
});

loginBtn.addEventListener('click', () => {
    currentUsername = usernameInput.value.trim() || 'Player 1';
    playerNameDisplay.textContent = currentUsername;
    
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    // Transition screens
    loginScreen.classList.remove('active');
    playScreen.classList.add('active');
    
    // Start game
    initGame();
});

homeBtn.addEventListener('click', () => {
    // Stop game
    cancelAnimationFrame(animationFrameId);
    
    // Transition screens
    playScreen.classList.remove('active');
    loginScreen.classList.add('active');
});

// ==========================================
// TETRIS GAME LOGIC
// ==========================================
const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');

const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const linesElement = document.getElementById('lines');
const gameOverlay = document.getElementById('game-overlay');
const restartBtn = document.getElementById('restart-btn');
const canvasContainer = document.querySelector('.canvas-container');

ctx.scale(30, 30); // 300x600 canvas -> 10x20 grid
nextCtx.scale(30, 30); // 120x120 canvas -> 4x4 grid

const ROWS = 20;
const COLS = 10;
let board = [];
let score = 0;
let highScore = 0;
let lines = 0;
let animationFrameId;
let gameOver = false;

// Tetromino definitions
// I, J, L, O, S, T, Z
const SHAPES = [
    [],
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I (cyan)
    [[2,0,0], [2,2,2], [0,0,0]], // J (blue)
    [[0,0,3], [3,3,3], [0,0,0]], // L (orange)
    [[4,4], [4,4]], // O (yellow)
    [[0,5,5], [5,5,0], [0,0,0]], // S (green)
    [[0,6,0], [6,6,6], [0,0,0]], // T (purple)
    [[7,7,0], [0,7,7], [0,0,0]]  // Z (red)
];

const COLORS = [
    'transparent',
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#a855f7', // purple
    '#ef4444'  // red
];

let player = {
    pos: {x: 0, y: 0},
    matrix: null,
    nextMatrix: null
};

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece() {
    // Start at index 1 to skip empty shape
    const typeId = Math.floor(Math.random() * 7) + 1;
    return SHAPES[typeId];
}

function getGhostPos() {
    const ghost = {
        matrix: player.matrix,
        pos: { x: player.pos.x, y: player.pos.y }
    };
    while (!collide(board, ghost)) {
        ghost.pos.y++;
    }
    ghost.pos.y--;
    return ghost.pos;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMatrix(board, {x: 0, y: 0}, ctx);
    
    // Draw ghost piece
    if (player.matrix) {
        const ghostPos = getGhostPos();
        drawMatrix(player.matrix, ghostPos, ctx, true); // true = isGhost
    }
    
    drawMatrix(player.matrix, player.pos, ctx);
}

function drawMatrix(matrix, offset, context, isGhost = false) {
    if (!matrix) return;
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                if (isGhost) {
                    context.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    context.fillRect(x + offset.x, y + offset.y, 1, 1);
                    context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    context.lineWidth = 0.05;
                    context.strokeRect(x + offset.x, y + offset.y, 1, 1);
                } else {
                    context.fillStyle = COLORS[value];
                    context.fillRect(x + offset.x, y + offset.y, 1, 1);
                    
                    // Add inner styling for blocks
                    context.fillStyle = 'rgba(255,255,255,0.3)';
                    context.fillRect(x + offset.x, y + offset.y, 1, 0.1);
                    context.fillStyle = 'rgba(0,0,0,0.3)';
                    context.fillRect(x + offset.x, y + offset.y + 0.9, 1, 0.1);
                    context.fillRect(x + offset.x + 0.9, y + offset.y, 0.1, 1);
                }
            }
        });
    });
}

function drawNext() {
    nextCtx.fillStyle = 'transparent';
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // Center the piece in the 4x4 next canvas
    const offset = {
        x: player.nextMatrix[0].length === 4 ? 0 : 0.5,
        y: player.nextMatrix.length === 2 ? 1 : 0.5
    };
    
    drawMatrix(player.nextMatrix, offset, nextCtx);
}

function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function collide(board, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function triggerShake() {
    canvasContainer.classList.add('shake');
    setTimeout(() => canvasContainer.classList.remove('shake'), 200);
}

function triggerFlash() {
    canvas.classList.add('flash');
    setTimeout(() => canvas.classList.remove('flash'), 100);
}

function playerDrop() {
    player.pos.y++;
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        sounds.drop();
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerHardDrop() {
    while (!collide(board, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    merge(board, player);
    sounds.drop();
    triggerShake();
    playerReset();
    arenaSweep();
    updateScore();
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(board, player)) {
        player.pos.x -= dir;
    } else {
        sounds.move();
    }
}

function playerReset() {
    if (!player.nextMatrix) {
        player.nextMatrix = createPiece();
    }
    player.matrix = player.nextMatrix;
    player.nextMatrix = createPiece();
    drawNext();
    
    player.pos.y = 0;
    player.pos.x = (Math.floor(COLS / 2)) - (Math.floor(player.matrix[0].length / 2));
    
    if (collide(board, player)) {
        gameOver = true;
        sounds.gameOver();
        gameOverlay.classList.remove('hidden');
        saveHighScore();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(board, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
    sounds.rotate();
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function arenaSweep() {
    let rowCount = 1;
    let linesCleared = 0;
    outer: for (let y = board.length - 1; y >= 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        
        linesCleared++;
    }
    
    if (linesCleared > 0) {
        sounds.clear();
        triggerFlash();
        // More points for more lines at once
        score += linesCleared === 1 ? 100 : linesCleared === 2 ? 300 : linesCleared === 3 ? 500 : 800;
        lines += linesCleared;
        
        if (score > highScore) {
            highScore = score;
        }
        
        // Make it faster
        dropInterval -= linesCleared * 5;
        if(dropInterval < 100) dropInterval = 100;
    }
}

function updateScore() {
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    linesElement.textContent = lines;
}

function loadHighScore() {
    const stored = localStorage.getItem(`tetris_high_score_${currentUsername}`);
    highScore = stored ? parseInt(stored, 10) : 0;
}

function saveHighScore() {
    localStorage.setItem(`tetris_high_score_${currentUsername}`, highScore.toString());
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
    if (gameOver) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    
    draw();
    animationFrameId = requestAnimationFrame(update);
}

function initGame() {
    loadHighScore();
    board = createMatrix(COLS, ROWS);
    score = 0;
    lines = 0;
    dropInterval = 1000;
    gameOver = false;
    updateScore();
    gameOverlay.classList.add('hidden');
    player.nextMatrix = null;
    playerReset();
    lastTime = performance.now();
    update();
}

restartBtn.addEventListener('click', initGame);

document.addEventListener('keydown', event => {
    if (gameOver && event.keyCode !== 13) return; // Only allow Enter to restart
    if (!playScreen.classList.contains('active')) return;
    
    switch (event.keyCode) {
        case 37: // Left
            playerMove(-1);
            break;
        case 39: // Right
            playerMove(1);
            break;
        case 40: // Down
            playerDrop();
            break;
        case 38: // Up (Rotate)
            playerRotate(1);
            break;
        case 32: // Space (Hard Drop)
            playerHardDrop();
            break;
        case 13: // Enter (Restart if game over)
           if(gameOver) {
               initGame();
           }
           break;
    }
});
