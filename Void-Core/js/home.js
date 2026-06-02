// ========== HOME SCREEN CANVAS ANIMATION ==========
const homeCanvas = document.getElementById('home-canvas');
const homeCtx = homeCanvas.getContext('2d');

function resizeHome() {
    homeCanvas.width = homeCanvas.offsetWidth;
    homeCanvas.height = homeCanvas.offsetHeight;
}

// animated scene: dark battlefield with moving towers, enemies, particles
let homeParticles = [];
let homeEnemies = [];
let homeTowers = [
    { x: 0.2, y: 0.5, color: '#85B7EB', angle: 0 },
    { x: 0.45, y: 0.35, color: '#ff6b35', angle: 0 },
    { x: 0.65, y: 0.6, color: '#7F77DD', angle: 0 },
];

function spawnHomeEnemy() {
    homeEnemies.push({
        x: -20,
        y: 0.25 + Math.random() * 0.5,
        spd: 0.4 + Math.random() * 0.6,
        color: ['#c0392b', '#9b59b6', '#e67e22', '#58d3ff'][Math.floor(Math.random() * 4)],
        size: 6 + Math.random() * 6
    });
}

function homeLoop() {
    const W = homeCanvas.width, H = homeCanvas.height;

    // background
    homeCtx.fillStyle = '#1a1008';
    homeCtx.fillRect(0, 0, W, H);

    // subtle grid lines
    homeCtx.strokeStyle = 'rgba(255,200,80,0.04)';
    homeCtx.lineWidth = 1;
    for (let i = 0; i < W; i += 60) {
        homeCtx.beginPath(); homeCtx.moveTo(i, 0); homeCtx.lineTo(i, H); homeCtx.stroke();
    }
    for (let i = 0; i < H; i += 60) {
        homeCtx.beginPath(); homeCtx.moveTo(0, i); homeCtx.lineTo(W, i); homeCtx.stroke();
    }

    // path hint
    homeCtx.strokeStyle = 'rgba(120,80,40,0.4)';
    homeCtx.lineWidth = 28;
    homeCtx.lineCap = 'round';
    homeCtx.beginPath();
    homeCtx.moveTo(0, H * 0.5);
    homeCtx.lineTo(W * 0.3, H * 0.5);
    homeCtx.lineTo(W * 0.3, H * 0.3);
    homeCtx.lineTo(W * 0.6, H * 0.3);
    homeCtx.lineTo(W * 0.6, H * 0.65);
    homeCtx.lineTo(W, H * 0.65);
    homeCtx.stroke();

    // spawn enemies
    if (Math.random() < 0.015) spawnHomeEnemy();

    // draw + move enemies
    for (let en of homeEnemies) {
        en.x += en.spd;
        homeCtx.beginPath();
        homeCtx.arc(en.x, en.y * H, en.size, 0, Math.PI * 2);
        homeCtx.fillStyle = en.color;
        homeCtx.fill();
    }
    homeEnemies = homeEnemies.filter(e => e.x < W + 30);

    // draw towers + rotate toward nearest enemy
    for (let t of homeTowers) {
        const tx = t.x * W, ty = t.y * H;
        let closest = null, closestDist = 9999;
        for (let en of homeEnemies) {
            const d = Math.hypot(en.x - tx, en.y * H - ty);
            if (d < closestDist) { closestDist = d; closest = en; }
        }
        if (closest) t.angle = Math.atan2(closest.y * H - ty, closest.x - tx);

        // shoot particle toward closest
        if (closest && closestDist < W * 0.3 && Math.random() < 0.04) {
            homeParticles.push({
                x: tx, y: ty,
                tx: closest.x, ty: closest.y * H,
                color: t.color, life: 30, maxLife: 30, r: 3
            });
        }

        homeCtx.save();
        homeCtx.translate(tx, ty);
        homeCtx.rotate(t.angle);
        homeCtx.fillStyle = t.color;
        homeCtx.fillRect(-10, -4, 20, 8);
        homeCtx.restore();

        // range ring
        homeCtx.beginPath();
        homeCtx.arc(tx, ty, W * 0.15, 0, Math.PI * 2);
        homeCtx.strokeStyle = t.color + '22';
        homeCtx.lineWidth = 1;
        homeCtx.stroke();
    }

    // draw + move projectiles
    for (let p of homeParticles) {
        const dx = p.tx - p.x, dy = p.ty - p.y;
        const d = Math.hypot(dx, dy);
        if (d > 4) { p.x += (dx / d) * 6; p.y += (dy / d) * 6; }
        p.life--;
        homeCtx.globalAlpha = p.life / p.maxLife;
        homeCtx.beginPath();
        homeCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        homeCtx.fillStyle = p.color;
        homeCtx.fill();
        homeCtx.globalAlpha = 1;
    }
    homeParticles = homeParticles.filter(p => p.life > 0);

    // vignette overlay
    const vg = homeCtx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.9);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.75)');
    homeCtx.fillStyle = vg;
    homeCtx.fillRect(0, 0, W, H);

    requestAnimationFrame(homeLoop);
}

window.addEventListener('load', () => {
    resizeHome();
    homeLoop();
});
window.addEventListener('resize', resizeHome);

// ========== BUTTON LOGIC ==========
document.getElementById('play-btn').addEventListener('click', () => {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    // trigger game init
    // resize();
    // generateDecor();
    initGame();
    bgMusic.play().catch(() => { });
});

document.getElementById('how-btn').addEventListener('click', () => {
    document.getElementById('how-panel').classList.toggle('hidden');
    document.getElementById('about-panel').classList.add('hidden');
});

document.getElementById('about-btn').addEventListener('click', () => {
    document.getElementById('about-panel').classList.toggle('hidden');
    document.getElementById('how-panel').classList.add('hidden');
});

document.querySelectorAll('.panel-close').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.home-panel').classList.add('hidden');
    });
});




