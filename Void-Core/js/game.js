//start
function startWave() {
    if (waveActive || gameOver || gameWon) return;
    if (wave >= maxWaves) return;
    wave++;
    document.getElementById('wave-num').textContent = wave;
    spawnMax = 6 + wave * 2;
    spawnCount = 0;
    spawnInterval = Math.max(40, 120 - wave * 4);
    spawnTimer = 0;
    waveActive = true;
    document.getElementById('start-btn').style.opacity = '0.4';
}
//reset
function resetGame() {

    // =========================
    // GAME STATE
    // =========================
    coins = 150;
    lives = 20;
    wave = 0;
    waveActive = false;
    gameOver = false;
    gameWon = false;

    spawnCount = 0;
    spawnMax = 0;
    spawnTimer = 0;

    // =========================
    // OBJECTS
    // =========================
    towers = [];
    enemies = [];
    projectiles = [];
    particles = [];
    moveTraces = [];
    floatingTexts = [];

    towerPlacementDrag.active = false;
    towerPlacementDrag.overCanvas = false;

    // =========================
    // HERO RESET (IMPORTANT FIX)
    // =========================
    hero.x = 100;
    hero.y = 100;
    hero.hp = hero.maxHp;
    hero.dead = false;
    hero.respawnTimer = 0;
    hero.targetEnemy = null;
    hero.targetX = null;
    hero.targetY = null;
    hero.cooldown = 0;
    hero.recoil = 0;
    hero.hitCooldown = 0;
    hero.angle = 0;

    // =========================
    // UI RESET
    // =========================
    document.getElementById('msg').style.display = 'none';
    document.getElementById('start-btn').style.opacity = '1';
    document.getElementById('wave-num').textContent = '0';

    updateUI();
}
//SHIFT-CLICK FOR PLACING AFTER SELECT
function selectTower(type) {
    // If the same type is already selected and we are in placement mode, toggle it off
    if (selectedType === type && towerPlacementDrag.active) {
        towerPlacementDrag.active = false;
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
        return;
    }

    selectedType = type;
    document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
    const btn = document.querySelector(`[data-type="${type}"]`);
    if (btn) btn.classList.add('selected');

    // Activate placement mode for click-to-place
    towerPlacementDrag.active = true;
    towerPlacementDrag.type = type;
    towerPlacementDrag.overCanvas = false; // Will be set to true on mousemove over canvas
}
window.selectTower = selectTower;
