// --- Asset Loading ---
const images = {
    mainDragon: new Image(),
    miniEvil: new Image(),
    bigEvil: new Image(),
    flashEvil: new Image(),
    wingedEvil: new Image(),
    cloud: new Image(),
    heart: new Image(),
    bomb: new Image(),
    bullet: new Image(),
    bg: new Image(),
    buffFast: new Image(),
    buffSpread: new Image()
};

let loadedImages = 0;
// We'll proceed even if some fail, but this helps track
const v = Date.now();
images.mainDragon.src = 'main_dragon.png?v=' + v;
images.miniEvil.src = 'mini_evil_dragon.png?v=' + v;
images.bigEvil.src = 'big_evil_dragon.png?v=' + v;
images.flashEvil.src = 'flash_dragon.png?v=' + v;
images.wingedEvil.src = 'winged_evil.png?v=' + v;
images.cloud.src = 'black_cloud.png?v=' + v;
images.heart.src = 'heart.png?v=' + v;
images.bomb.src = 'bomb.png?v=' + v;
images.bullet.src = 'bullet.png?v=' + v;
images.bg.src = 'background.png?v=' + v;
images.buffFast.src = 'buff_fast.png?v=' + v;
images.buffSpread.src = 'buff_spread.png?v=' + v;

// --- Game Setup ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 540;
const GAME_HEIGHT = 960;

function resizeCanvas() {
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
}
resizeCanvas();

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const hudTop = document.getElementById('hud-top');
const scoreText = document.getElementById('score-text');
const finalScoreText = document.getElementById('final-score');
const highScoreDisplay = document.getElementById('high-score-display');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const surrenderBtn = document.getElementById('surrender-btn');
const hpIcons = document.querySelectorAll('.hp-icon');

// --- Input Handling ---
const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// Touch Controls
let touchX = null;
let touchY = null;
let isTouching = false;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isTouching = true;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchX = (touch.clientX - rect.left) * (GAME_WIDTH / rect.width);
    touchY = (touch.clientY - rect.top) * (GAME_HEIGHT / rect.height);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isTouching) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchX = (touch.clientX - rect.left) * (GAME_WIDTH / rect.width);
    touchY = (touch.clientY - rect.top) * (GAME_HEIGHT / rect.height);
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isTouching = false;
});

// --- Highscore ---
let highscore = localStorage.getItem('dragonShooterHighscore') || 0;
if (highScoreDisplay) highScoreDisplay.innerText = `Highscore: ${Math.floor(highscore)}`;

function updateHighscore() {
    if (gameState.score > highscore) {
        highscore = gameState.score;
        localStorage.setItem('dragonShooterHighscore', highscore);
        if (highScoreDisplay) highScoreDisplay.innerText = `Highscore: ${Math.floor(highscore)}`;
    }
}

// --- Game State ---
let gameState = {
    active: false,
    score: 0,
    distancePushed: 0,
    bgY: 0,
    frame: 0,
    gameSpeed: 3,
    playerName: 'PLAYER',
    damageFlashTimer: 0, // Adding global hit flash duration
    wingedSpawned: 0 // Track how many Winged Evils have spawned
};

// --- Entities Arrays ---
let bullets = [];
let enemies = [];
let enemyBullets = [];
let obstacles = [];
let items = [];
let particles = [];
let floatingTexts = [];

// --- Helper Functions ---
function drawWithStroke(img, x, y, width, height, strokeColor, extraFilter = '') {
    // We use drop-shadow filter to create a stroke effect
    ctx.filter = `drop-shadow(2px 0px 0px ${strokeColor}) drop-shadow(-2px 0px 0px ${strokeColor}) drop-shadow(0px 2px 0px ${strokeColor}) drop-shadow(0px -2px 0px ${strokeColor}) ${extraFilter}`;
    ctx.drawImage(img, x, y, width, height);
    ctx.filter = 'none'; // reset filter
}

// --- Classes ---

class Player {
    constructor() {
        this.width = 128;   // 64 * 2
        this.height = 128; // 64 * 2
        this.x = GAME_WIDTH / 2 - this.width / 2;
        this.y = GAME_HEIGHT - 150;
        this.speed = 6;
        this.hp = 3;
        this.maxHp = 3;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.fireRate = 50; // Base fire rate halved (slower)
        this.fireTimer = 0;
        this.buff = null; // 'fast' or 'spread'
        this.buffTimer = 0;
    }

    update() {
        if (this.buffTimer > 0) {
            this.buffTimer--;
            if (this.buffTimer <= 0) {
                this.buff = null;
            }
        }
        // Movement
        if (keys.w || keys.ArrowUp) this.y -= this.speed;
        if (keys.s || keys.ArrowDown) this.y += this.speed;
        if (keys.a || keys.ArrowLeft) this.x -= this.speed;
        if (keys.d || keys.ArrowRight) this.x += this.speed;

        if (isTouching && touchX !== null && touchY !== null) {
            const dx = touchX - (this.x + this.width / 2);
            const dy = touchY - (this.y + this.height / 2);
            const dist = Math.hypot(dx, dy);
            if (dist > this.speed) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            } else {
                this.x = touchX - this.width / 2;
                this.y = touchY - this.height / 2;
            }
        }

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > GAME_WIDTH - this.width) this.x = GAME_WIDTH - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y > GAME_HEIGHT - this.height) this.y = GAME_HEIGHT - this.height;

        // Invincibility toggle
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // Auto Fire
        let currentFireRate = this.buff === 'fast' ? Math.floor(this.fireRate / 2) : this.fireRate;
        this.fireTimer++;
        if (this.fireTimer >= currentFireRate) {
            this.fireTimer = 0;
            this.fire();
        }
    }

    draw() {
        // Flashing effect if invincible
        if (this.invincible && Math.floor(this.invincibleTimer / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        if (images.mainDragon.complete && images.mainDragon.naturalWidth > 0) {
            drawWithStroke(images.mainDragon, this.x, this.y, this.width, this.height, 'white');
        } else {
            ctx.fillStyle = 'blue';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.globalAlpha = 1.0;
    }

    fire() {
        if (this.buff === 'spread') {
            bullets.push(new Bullet(this.x + this.width / 2 - 12, this.y - 20, 0));
            bullets.push(new Bullet(this.x + this.width / 2 - 12, this.y - 20, -3));
            bullets.push(new Bullet(this.x + this.width / 2 - 12, this.y - 20, 3));
        } else {
            // Adjust bullet spawn position for larger dragon
            bullets.push(new Bullet(this.x + this.width / 2 - 12, this.y - 20, 0));
        }
    }

    takeDamage(amount) {
        if (this.invincible) return;
        this.hp -= amount;
        updateHPUI();
        if (this.hp <= 0) {
            gameOver();
        } else {
            this.invincible = true;
            this.invincibleTimer = 90; // approx 1.5 seconds at 60fps
        }
    }

    heal(amount) {
        this.hp += amount;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
        updateHPUI();
    }
}

class Bullet {
    constructor(x, y, speedX = 0) {
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.width = 24;  // 12 * 2
        this.height = 48; // 24 * 2
        this.speed = 12;  // Slightly faster bullet for larger scale
        this.markedForDeletion = false;
    }
    update() {
        this.y -= this.speed;
        this.x += this.speedX;
        if (this.y + this.height < -200 || this.x < -200 || this.x > GAME_WIDTH + 200) this.markedForDeletion = true;
    }
    draw() {
        if (images.bullet.complete && images.bullet.naturalWidth > 0) {
            ctx.drawImage(images.bullet, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'yellow';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class EnemyBullet {
    constructor(x, y, speedX = 0) {
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.width = 16;
        this.height = 16;
        this.speed = 8;
        this.markedForDeletion = false;
    }
    update() {
        this.y += this.speed;
        this.x += this.speedX;
        if (this.y > GAME_HEIGHT + 200 || this.x < -200 || this.x > GAME_WIDTH + 200) this.markedForDeletion = true;
    }
    draw() {
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class Enemy {
    constructor(type) {
        this.type = type; // 'mini', 'big', 'flash', or 'winged'
        if (type === 'mini') {
            this.width = 96;   // 48 * 2
            this.height = 96;  // 48 * 2
            this.hp = 1;
            this.damage = 1;
            this.speed = Math.random() * 2 + 2 + (gameState.gameSpeed * 0.5);
        } else if (type === 'flash') {
            this.width = 96;
            this.height = 96;
            this.hp = 1;
            this.damage = 1;
            this.speed = (Math.random() * 2 + 2 + (gameState.gameSpeed * 0.5)) * 2; // 2x speed
        } else if (type === 'winged') {
            this.width = 192;
            this.height = 192;
            this.hp = 30;
            this.maxHp = 30;
            this.damage = 2; // high collision damage
            // Speed is 60% of big dragon
            let bigSpeed = Math.random() * 1.5 + 1 + (gameState.gameSpeed * 0.3);
            this.speed = bigSpeed * 0.6;
        } else {
            this.width = 192;  // 96 * 2
            this.height = 192; // 96 * 2
            this.hp = 4;
            this.damage = 2;
            this.speed = Math.random() * 1.5 + 1 + (gameState.gameSpeed * 0.3);
        }
        this.x = Math.random() * (GAME_WIDTH - this.width);
        this.y = -this.height;
        this.fireTimer = 0;
        this.markedForDeletion = false;
        // Pre-attack animation state for Winged Evil
        this.isPreparingAttack = false;
        this.attackAnimationTimer = 0;

        // Winged Evil specific movement
        this.wingedMovingRight = Math.random() > 0.5;
    }
    update() {
        // Winged Evil Movement Logic (Hover at top and move left/right)
        if (this.type === 'winged' && !this.isPreparingAttack) {
            if (this.y < GAME_HEIGHT * 0.15) {
                this.y += this.speed; // Move down until 15% of screen height
            } else {
                // Move horizontally
                if (this.wingedMovingRight) {
                    this.x += this.speed;
                    if (this.x > GAME_WIDTH - this.width) {
                        this.x = GAME_WIDTH - this.width;
                        this.wingedMovingRight = false;
                    }
                } else {
                    this.x -= this.speed;
                    if (this.x < 0) {
                        this.x = 0;
                        this.wingedMovingRight = true;
                    }
                }
            }
        }
        // Standard vertical movement for others
        else if (!this.isPreparingAttack && this.type !== 'winged') {
            this.y += this.speed;
        }

        if (this.y > GAME_HEIGHT + this.height) this.markedForDeletion = true;

        if (this.type === 'big' && !this.markedForDeletion) {
            this.fireTimer++;
            if (this.fireTimer >= 60) {
                // Shoot a black fireball with red stroke from the center
                enemyBullets.push(new EnemyBullet(this.x + this.width / 2 - 8, this.y + this.height - 10));
                this.fireTimer = 0;
            }
        }

        if (this.type === 'winged' && !this.markedForDeletion) {
            if (this.isPreparingAttack) {
                this.attackAnimationTimer++;
                // 1 second (60 frames) pre-attack animation
                if (this.attackAnimationTimer >= 60) {
                    this.isPreparingAttack = false;
                    this.attackAnimationTimer = 0;
                    // Fire 3-way spread
                    enemyBullets.push(new EnemyBullet(this.x + this.width / 2 - 8, this.y + this.height - 10, 0)); // straight
                    enemyBullets.push(new EnemyBullet(this.x + this.width / 2 - 8, this.y + this.height - 10, -2)); // left
                    enemyBullets.push(new EnemyBullet(this.x + this.width / 2 - 8, this.y + this.height - 10, 2)); // right
                }
            } else {
                this.fireTimer++;
                // Attacks every 2 seconds (120 frames)
                if (this.fireTimer >= 120) {
                    this.fireTimer = 0;
                    this.isPreparingAttack = true; // freeze and glow
                }
            }
        }
    }
    draw() {
        let img = this.type === 'mini' ? images.miniEvil : (this.type === 'flash' ? images.flashEvil : (this.type === 'winged' ? images.wingedEvil : images.bigEvil));
        if (img.complete && img.naturalWidth > 0) {
            let stroke = 'red';
            let extra = '';
            // Enrage visual effect when Big Evil is down to 1 HP
            if (this.type === 'big' && this.hp === 1) {
                stroke = 'darkred';
                extra = 'sepia(100%) saturate(1000%) hue-rotate(-50deg) brightness(80%)';
            }
            if (this.type === 'winged') {
                stroke = 'maroon';
                // Pre-attack glowing animation
                if (this.isPreparingAttack) {
                    // Pulse brightness
                    let pulse = Math.abs(Math.sin(this.attackAnimationTimer * 0.2)) * 100 + 100;
                    extra = `drop-shadow(0 0 10px red) brightness(${pulse}%)`;
                    // Shake effect
                    this.x += (Math.random() - 0.5) * 4;
                }
            }
            drawWithStroke(img, this.x, this.y, this.width, this.height, stroke, extra);
        } else {
            ctx.fillStyle = this.type === 'mini' ? 'purple' : (this.type === 'winged' ? 'white' : 'darkgreen');
            if (this.type === 'big' && this.hp === 1) ctx.fillStyle = 'darkred';
            if (this.type === 'winged' && this.isPreparingAttack) ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Draw HP text for Winged Evil
        if (this.type === 'winged') {
            ctx.fillStyle = 'red';
            ctx.font = '12px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`${this.hp}/${this.maxHp}`, this.x + this.width / 2, this.y - 10);
        }
    }
}

class Obstacle {
    constructor() {
        this.isLarge = Math.random() > 0.5;
        this.width = this.isLarge ? 96 : 64; // Mixed sizes: 1x (64) and 1.5x (96)
        this.height = this.isLarge ? 72 : 48; // Mixed sizes: 1x (48) and 1.5x (72)
        this.x = Math.random() * (GAME_WIDTH - this.width);
        this.y = -this.height;
        this.speed = gameState.gameSpeed * 0.5; // same speed as background
        this.markedForDeletion = false;
    }
    update() {
        this.y += this.speed;
        if (this.y > GAME_HEIGHT + 200) this.markedForDeletion = true;
    }
    draw() {
        if (images.cloud.complete && images.cloud.naturalWidth > 0) {
            drawWithStroke(images.cloud, this.x, this.y, this.width, this.height * 1.5, 'darkred'); // make cloud taller and add stroke
        } else {
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class Item {
    constructor(type) {
        this.type = type; // 'heart', 'bomb', 'buff_fast', 'buff_spread'
        // Halved buff sizes from 64 to 32
        this.width = type === 'heart' ? 48 : (type.startsWith('buff_') ? 32 : 64);
        this.height = type === 'heart' ? 48 : (type.startsWith('buff_') ? 32 : 64);

        // Prevent spawning at the very edge by adding a margin
        let edgeMargin = this.width;
        this.x = edgeMargin + Math.random() * (GAME_WIDTH - this.width - edgeMargin * 2);

        this.y = -this.height;
        this.speed = gameState.gameSpeed;
        this.markedForDeletion = false;
    }
    update() {
        this.y += this.speed;
        if (this.y > GAME_HEIGHT + 200) this.markedForDeletion = true;
    }

    draw() {
        let img;
        let stroke = 'lime'; // default green stroke for helpful items

        if (this.type === 'heart') img = images.heart;
        else if (this.type === 'bomb') img = images.bomb;
        else if (this.type === 'buff_fast') {
            img = images.buffFast;
            stroke = 'cyan';
        }
        else if (this.type === 'buff_spread') {
            img = images.buffSpread;
            stroke = 'blue';
        }

        if (img && img.complete && img.naturalWidth > 0) {
            drawWithStroke(img, this.x, this.y, this.width, this.height, stroke);
        } else {
            // Fallback
            ctx.fillStyle = this.type === 'heart' ? 'red' : (this.type === 'bomb' ? 'black' : (this.type === 'buff_fast' ? 'cyan' : 'blue'));
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
            if (this.type === 'buff_fast' || this.type === 'buff_spread') {
                ctx.fillStyle = 'white';
                ctx.font = '24px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.type === 'buff_fast' ? 'F' : 'S', this.x + this.width / 2, this.y + this.height / 2);
            }
        }
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.speedY = -1.5;
        this.markedForDeletion = false;
    }
    update() {
        this.y += this.speedY;
        this.life -= 0.02; // fades out in ~50 frames
        if (this.life <= 0) this.markedForDeletion = true;
    }
    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.font = '16px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Add text shadow for readability
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(this.text, this.x, this.y);
        // Reset shadow
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.globalAlpha = 1.0;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 4;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.color = color;
        this.life = 1.0;
        this.markedForDeletion = false;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.05;
        if (this.life <= 0) this.markedForDeletion = true;
    }
    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

let player;

function updateHPUI() {
    for (let i = 0; i < hpIcons.length; i++) {
        if (i < player.hp) {
            hpIcons[i].classList.remove('lost');
        } else {
            hpIcons[i].classList.add('lost');
        }
    }
}

// Advanced Hitbox Logic. We narrow down the hit-box by 35% on all sides so pixel collisions are forgiving
function getHitbox(entity) {
    let paddingX = entity.width * 0.35;
    let paddingY = entity.height * 0.35;
    if (entity instanceof Bullet || entity instanceof EnemyBullet) {
        paddingX = entity.width * 0.15; // Projectiles have smaller padding reduction
        paddingY = entity.height * 0.15;
    }
    return {
        x: entity.x + paddingX,
        y: entity.y + paddingY,
        width: entity.width - paddingX * 2,
        height: entity.height - paddingY * 2
    };
}

function checkCollision(rect1, rect2) {
    const r1 = rect1;
    const r2 = rect2;
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.height + r1.y > r2.y
    );
}

// Global safe check for spawning entities uses raw coords
function isPositionSafe(x, y, width, height, buffer = 50) {
    const rect1 = { x: x - buffer, y: y - buffer, width: width + buffer * 2, height: height + buffer * 2 };
    const allEntities = [...enemies, ...obstacles, ...items];
    for (let e of allEntities) {
        if (checkCollision(rect1, { x: e.x, y: e.y, width: e.width, height: e.height })) return false;
    }
    return true;
}

function spawnEntities() {
    // Enemy density scaling: +30% every 2000 points for regular enemies
    let densityScale = 1 + Math.floor(gameState.score / 2000) * 0.3;
    // Every 3000 points, flash dragon density DOUBLES (2x), obstacle density increases by 30% (+30%)
    let advancedScale = Math.floor(gameState.score / 3000);
    let flashDensityScale = densityScale * Math.pow(2, advancedScale); // double every 3k
    let obstacleDensityScale = 1 + advancedScale * 0.3; // +30% every 3k

    let miniInterval = Math.max(20, Math.floor(100 / densityScale));
    let bigInterval = Math.max(60, Math.floor(300 / densityScale));
    let flashInterval = Math.max(20, Math.floor(200 / flashDensityScale));
    let obstacleInterval = Math.max(50, Math.floor(250 / obstacleDensityScale));

    // Helper to attempt spawn a few times to find safe spot
    function attemptSpawn(createFunc) {
        for (let i = 0; i < 5; i++) {
            let entity = createFunc();
            if (isPositionSafe(entity.x, entity.y, entity.width, entity.height)) {
                return entity;
            }
        }
        return null; // gave up finding safe spot
    }

    let wingedExists = enemies.some(e => e.type === 'winged');

    // Spawn Enemies only if Boss is not present
    if (!wingedExists) {
        if (gameState.frame % miniInterval === 0) {
            let e = attemptSpawn(() => new Enemy('mini'));
            if (e) enemies.push(e);
        }
        if (gameState.frame % bigInterval === 0) {
            let e = attemptSpawn(() => new Enemy('big'));
            if (e) enemies.push(e);
        }
        if (gameState.frame % flashInterval === 0) {
            let e = attemptSpawn(() => new Enemy('flash'));
            if (e) enemies.push(e);
        }
    }

    // Spawn Boss
    let expectedWinged = Math.floor(gameState.score / 5000);
    if (expectedWinged > gameState.wingedSpawned) {
        if (!wingedExists) {
            // Force Spawn Boss completely bypassing safe checks
            let e = new Enemy('winged');
            e.x = GAME_WIDTH / 2 - e.width / 2; // Fixed start center

            // Wipe the area
            enemies.forEach(en => {
                en.markedForDeletion = true;
                createExplosion(en.x + en.width / 2, en.y + en.height / 2, 'red', 10);
            });
            obstacles.forEach(o => {
                o.markedForDeletion = true;
                createExplosion(o.x + o.width / 2, o.y + o.height / 2, 'gray', 5);
            });
            enemyBullets.forEach(eb => {
                eb.markedForDeletion = true;
            });

            enemies.push(e);
            gameState.wingedSpawned++;
            floatingTexts.push(new FloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2, `BOSS APPROACHING!`, 'red'));
        }
    }

    // Spawn Obstacles (Clouds)
    if (gameState.frame % obstacleInterval === 0) {
        let e = attemptSpawn(() => new Obstacle());
        if (e) obstacles.push(e);
    }
    // Spawn Items
    if (gameState.frame % 800 === 0) {
        let i = attemptSpawn(() => new Item('heart'));
        if (i) items.push(i);
    }
    if (gameState.frame % 1500 === 0) {
        let i = attemptSpawn(() => new Item('bomb'));
        if (i) items.push(i);
    }
    // Buffs spawn rate increased (interval 900 -> 500)
    if (gameState.frame % 500 === 0) {
        let i = attemptSpawn(() => new Item(Math.random() > 0.5 ? 'buff_fast' : 'buff_spread'));
        if (i) items.push(i);
    }
}

// --- Main Game Loop ---
function animate(timestamp) {
    if (!gameState.active) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background (Vertical scroll down proportionally)
    let bgRenderHeight = GAME_HEIGHT;
    if (images.bg.complete && images.bg.naturalWidth > 0) {
        // Calculate proportional height to keep pixel aspect ratio without stretching
        bgRenderHeight = (images.bg.naturalHeight / images.bg.naturalWidth) * GAME_WIDTH;
    }

    gameState.bgY += gameState.gameSpeed * 0.5;
    if (gameState.bgY >= bgRenderHeight) gameState.bgY %= bgRenderHeight;

    if (images.bg.complete && images.bg.naturalWidth > 0) {
        // Draw the main background fragment sliding down
        ctx.drawImage(images.bg, 0, gameState.bgY, GAME_WIDTH, bgRenderHeight);
        // Draw the second background fragment directly above to fill the gap seamlessly
        ctx.drawImage(images.bg, 0, gameState.bgY - bgRenderHeight, GAME_WIDTH, bgRenderHeight);
    } else {
        // Fallback simple drawn bg
        ctx.fillStyle = '#1e90ff';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, GAME_HEIGHT - 100, GAME_WIDTH, 100);
    }

    // Update & Draw Player
    player.update();
    player.draw();

    // Bullets
    bullets.forEach(bullet => {
        bullet.update();
        bullet.draw();

        // Check collision with enemies
        enemies.forEach(enemy => {
            if (!bullet.markedForDeletion && !enemy.markedForDeletion && checkCollision(bullet, enemy)) {
                bullet.markedForDeletion = true;
                enemy.hp -= 1;
                createExplosion(bullet.x, bullet.y, 'orange', 5); // hit vfx
                if (enemy.hp <= 0) {
                    enemy.markedForDeletion = true;
                    let gainedScore = enemy.type === 'winged' ? 1000 : (enemy.type === 'mini' ? 50 : 150);
                    gameState.score += gainedScore;
                    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'red', 15); // death vfx
                    floatingTexts.push(new FloatingText(enemy.x + enemy.width / 2, enemy.y, `+${gainedScore}`, 'yellow'));
                }
            }
        });
    });
    bullets = bullets.filter(b => !b.markedForDeletion);

    // Enemy Bullets
    enemyBullets.forEach(eb => {
        eb.update();
        eb.draw();
        if (!eb.markedForDeletion && !player.invincible && checkCollision(getHitbox(player), getHitbox(eb))) {
            eb.markedForDeletion = true;
            player.takeDamage(1);
            createExplosion(player.x + player.width / 2, player.y + player.height / 2, 'red', 20); // hurt vfx
        }
    });
    enemyBullets = enemyBullets.filter(eb => !eb.markedForDeletion);

    // Enemies
    enemies.forEach(enemy => {
        enemy.update();
        enemy.draw();
        // Collision with player
        if (!enemy.markedForDeletion && !player.invincible && checkCollision(getHitbox(player), getHitbox(enemy))) {
            player.takeDamage(enemy.damage);
            createExplosion(player.x + player.width / 2, player.y + player.height / 2, 'white', 20); // player hurt vfx
        }
    });
    enemies = enemies.filter(e => !e.markedForDeletion);

    // Obstacles
    obstacles.forEach(obs => {
        obs.update();
        obs.draw();
        if (!obs.markedForDeletion && !player.invincible && checkCollision(getHitbox(player), getHitbox(obs))) {
            player.takeDamage(1);
            createExplosion(player.x + player.width / 2, player.y + player.height / 2, 'gray', 20); // hurt vfx
        }
    });
    obstacles = obstacles.filter(o => !o.markedForDeletion);

    // Items
    items.forEach(item => {
        item.update();
        item.draw();
        if (!item.markedForDeletion && !player.invincible && checkCollision(getHitbox(player), getHitbox(item))) {
            item.markedForDeletion = true;
            if (item.type === 'heart') {
                player.heal(1);
                createExplosion(item.x + item.width / 2, item.y + item.height / 2, 'lime', 15); // heal vfx
            } else if (item.type === 'bomb') {
                createExplosion(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'yellow', 50); // huge bomb vfx
                // clear all enemies (except winged) and obstacles, awarding points for enemies
                enemies.forEach(e => {
                    if (e.type === 'winged') return; // Boss immune to bomb
                    e.markedForDeletion = true; // Instantly kill
                    let gainedScore = e.type === 'winged' ? 1000 : (e.type === 'mini' ? 50 : 150);
                    gameState.score += gainedScore;
                    createExplosion(e.x + e.width / 2, e.y + e.height / 2, 'red', 15);
                    floatingTexts.push(new FloatingText(e.x + e.width / 2, e.y, `+${gainedScore}`, 'yellow'));
                });
                obstacles.forEach(o => {
                    o.markedForDeletion = true;
                    createExplosion(o.x + o.width / 2, o.y + o.height / 2, 'gray', 10);
                });
                enemyBullets.forEach(eb => {
                    eb.markedForDeletion = true;
                    createExplosion(eb.x + eb.width / 2, eb.y + eb.height / 2, 'black', 5);
                });
                gameState.score += 100; // bonus for bomb
                floatingTexts.push(new FloatingText(item.x + item.width / 2, item.y, `+100 BOMBBBB!`, 'cyan'));
            } else if (item.type === 'buff_fast') {
                player.buff = 'fast';
                player.buffTimer = 600; // 10 seconds at 60fps
                createExplosion(item.x + item.width / 2, item.y + item.height / 2, 'cyan', 20); // buff vfx
            } else if (item.type === 'buff_spread') {
                player.buff = 'spread';
                player.buffTimer = 600; // 10 seconds at 60fps
                createExplosion(item.x + item.width / 2, item.y + item.height / 2, 'magenta', 20); // buff vfx
            }
        }
    });
    items = items.filter(i => !i.markedForDeletion);

    // Particles
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    particles = particles.filter(p => !p.markedForDeletion);

    // Floating Texts
    floatingTexts.forEach(ft => {
        ft.update();
        ft.draw();
    });
    floatingTexts = floatingTexts.filter(ft => !ft.markedForDeletion);

    // Spawn new entities
    spawnEntities();

    // Game Logic Increments
    gameState.frame++;
    gameState.distancePushed += gameState.gameSpeed;
    if (gameState.frame % 10 === 0) {
        gameState.score += 1; // distance based score
    }

    // Increase difficulty slowly
    if (gameState.frame % 1000 === 0 && gameState.gameSpeed < 10) {
        gameState.gameSpeed += 0.5;
    }

    scoreText.innerText = `SCORE: ${Math.floor(gameState.score)}`;

    // Red damage flash overlay
    if (gameState.damageFlashTimer > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${gameState.damageFlashTimer / 15 * 0.5})`; // fade out
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        gameState.damageFlashTimer--;
    }

    requestAnimationFrame(animate);
}

// --- Control Flow Functions ---
function initGame() {
    player = new Player();
    bullets = [];
    enemyBullets = [];
    enemies = [];
    obstacles = [];
    items = [];
    particles = [];
    floatingTexts = [];
    gameState.score = 0;
    gameState.distancePushed = 0;
    gameState.frame = 0;
    gameState.gameSpeed = 3;
    gameState.active = true;
    gameState.damageFlashTimer = 0;
    gameState.wingedSpawned = 0;
    updateHPUI();
}

function startGame() {
    let finalName = document.getElementById('player-name-input').value.trim() || 'PLAYER';
    gameState.playerName = finalName;
    document.getElementById('player-name-display').innerText = finalName;

    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    hudTop.classList.remove('hidden');

    // Reset start screen view just in case
    document.getElementById('start-menu-content').style.display = 'block';
    document.getElementById('leaderboard-view').style.display = 'none';

    initGame();
    gameState.active = true;
    requestAnimationFrame(animate);
}

async function gameOver() {
    gameState.active = false;
    hudTop.classList.add('hidden');
    gameOverScreen.classList.add('active');
    finalScoreText.innerText = `Score: ${Math.floor(gameState.score)}`;

    // Attempt to post score
    try {
        await fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: gameState.playerName, score: Math.floor(gameState.score) })
        });
        await fetchLeaderboard();
    } catch (e) { console.error('Error posting score'); }
}

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
surrenderBtn.addEventListener('click', () => {
    player.hp = 0;
    gameOver();
});

// Render initial state (just the backgrounds/canvas for start screen effect)
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

const mainLeaderboardList = document.getElementById('main-leaderboard-list');
const gameOverLeaderboardList = document.getElementById('leaderboard-list');
const gameOverLeaderboardSection = document.getElementById('leaderboard-section');
const uiLayer = document.getElementById('ui-layer');

async function fetchLeaderboard() {
    try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();

        // Handle both old array format and new object format gracefully
        const scores = Array.isArray(data) ? data : (data.top_10 || []);
        const totalRecords = data.total_records || scores.length;

        let html = '';
        scores.forEach((s, i) => {
            html += `<li>${i + 1}. ${s.name} - <span style="color:var(--primary-color);">${s.score}</span></li>`;
        });
        if (scores.length === 0) html = '<li>Be the first to play!</li>';

        // Append total players at the end
        html += `<li style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #666; color: #aaa; text-align: center; font-size: 0.9em;">Total Players: <span style="color: white; font-weight: bold;">${totalRecords}</span></li>`;

        mainLeaderboardList.innerHTML = html;
        if (gameOverLeaderboardList) {
            gameOverLeaderboardList.innerHTML = html;
            gameOverLeaderboardSection.style.display = 'block';
        }
    } catch (e) {
        mainLeaderboardList.innerHTML = '<li>Error loading leaderboard.</li>';
    }
}

// --- Leaderboard Integration ---
const startMenuContent = document.getElementById('start-menu-content');
const leaderboardView = document.getElementById('leaderboard-view');
const showLeaderboardBtn = document.getElementById('show-leaderboard-btn');
const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');

showLeaderboardBtn.addEventListener('click', () => {
    startMenuContent.style.display = 'none';
    leaderboardView.style.display = 'flex';
    fetchLeaderboard();
});

closeLeaderboardBtn.addEventListener('click', () => {
    leaderboardView.style.display = 'none';
    startMenuContent.style.display = 'block';
});

// Initial load
fetchLeaderboard();
