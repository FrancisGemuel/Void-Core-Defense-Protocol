const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('game-container');
//func Resize
function resize() {
    if (!container.clientWidth || !container.clientHeight) return;

    const bottomBar = document.getElementById('bottom-bar');
    const bottomBarHeight = bottomBar ? bottomBar.offsetHeight : 0;

    canvas.width = container.clientWidth;
    canvas.height = Math.max(280, container.clientHeight - bottomBarHeight);
}

function initGame() {
    resize();
    generateDecor();
    resetGame();
    loop();
}
//OLD trigger to play
// window.addEventListener('load', () => {
//     resize();
//     generateDecor();
//     bgMusic.play().catch(() => { });
//     loop();
// });
//points per wave ratio
const PATH_WAYPOINTS_RATIO = [
    [0, 0.35], [0.15, 0.35], [0.15, 0.2], [0.35, 0.2],
    [0.35, 0.55], [0.55, 0.55], [0.55, 0.25], [0.75, 0.25],
    [0.75, 0.65], [0.9, 0.65], [1.0, 0.65]
];
// objects
let hoveredEnemy = null;
let decorations = [];
let coins = 150, lives = 20, wave = 0, maxWaves = 20;
let gameSpeed = 1;
let floatingTexts = [];
let towers = [], enemies = [], projectiles = [], particles = [], moveTraces = [];
let selectedType = 'sniper';
let waveActive = false, gameOver = false, gameWon = false;
let animFrame;
let waveTimer = 0, spawnCount = 0, spawnMax = 0, spawnInterval = 0, spawnTimer = 0;

const SCALE = 0.65; // reduce to make everything smaller
//tower properties
const TOWER_DEFS = {
    sniper: { cost: 80, atk: 40, spd: 0.5, range: 230, color: '#378ADD', size: 14, label: 'S' },
    flamer: { cost: 120, atk: 30, spd: 2.5, range: 100, color: '#E24B4A', size: 14, label: 'F', splash: true },
    tank: { cost: 200, atk: 60, spd: 0.6, range: 110, color: '#7F77DD', size: 16, label: 'T', splash: true },
    drone: { cost: 150, atk: 35, spd: 1.5, range: 250, color: '#1D9E75', size: 13, label: 'D' },
    barracks: { cost: 220, atk: 8, spd: 1.1, range: 180, color: '#d9b44a', size: 16, label: 'B', soldierCount: 5 },
};

window.addEventListener('resize', () => {
    resize();
});
//Hero properties
let hero = {
    x: 100,
    y: 100,
    size: 14,
    speed: 2.5,
    targetX: null,
    targetY: null,
    targetEnemy: null,
    atk: 20,
    range: 120,
    recoil: 0,
    cooldown: 0,
    angle: 0,
    hp: 200,
    maxHp: 200,

    dead: false,
    respawnTimer: 0,
    hitCooldown: 0 // prevents instant melt

};

