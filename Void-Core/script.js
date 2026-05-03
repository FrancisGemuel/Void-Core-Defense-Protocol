//Reorganize code
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('game-container');

function resize() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
//resize();
window.addEventListener('load', () => {
    resize();
    generateDecor();
    bgMusic.play().catch(() => { });
    loop();
});
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
let towers = [], enemies = [], projectiles = [], particles = [];
let selectedType = 'sniper';
let waveActive = false, gameOver = false, gameWon = false;
let animFrame;
let waveTimer = 0, spawnCount = 0, spawnMax = 0, spawnInterval = 0, spawnTimer = 0;
//tower properties
const TOWER_DEFS = {
    sniper: { cost: 50, atk: 25, spd: 1.2, range: 130, color: '#378ADD', size: 14, label: 'S' },
    flamer: { cost: 80, atk: 15, spd: 2.5, range: 80, color: '#E24B4A', size: 14, label: 'F', splash: true },
    tank: { cost: 120, atk: 60, spd: 0.6, range: 110, color: '#7F77DD', size: 16, label: 'T' },
    drone: { cost: 100, atk: 35, spd: 1.5, range: 150, color: '#1D9E75', size: 13, label: 'D' },
};
//Hero
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

function getWaypoints() {
    return PATH_WAYPOINTS_RATIO.map(([rx, ry]) => ({ x: rx * canvas.width, y: ry * canvas.height }));
}

function pathDist(i) {
    const wp = getWaypoints();
    let d = 0;
    for (let j = i; j < wp.length - 1; j++) {
        d += Math.hypot(wp[j + 1].x - wp[j].x, wp[j + 1].y - wp[j].y);
    }
    return d;
}

function generateDecor() {
    decorations = [];

    const wp = getWaypoints();

    for (let i = 0; i < 60; i++) {

        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;

        // avoid path
        let tooClose = false;

        for (let j = 0; j < wp.length - 1; j++) {
            if (distToSegment(x, y, wp[j].x, wp[j].y, wp[j + 1].x, wp[j + 1].y) < 40) {
                tooClose = true;
                break;
            }
        }

        if (tooClose) continue;

        decorations.push({
            x,
            y,
            type: Math.random() > 0.5 ? 'tree' : 'bush',
            size: 8 + Math.random() * 10,
            rotation: Math.random() * 0.3
        });
    }
}
//create enemy
function spawnEnemy(waveNum) {
    const wp = getWaypoints();
    const types = ['bug', 'dino', 'blob'];
    const t = types[Math.floor(Math.random() * types.length)];
    let hp = 40 + waveNum * 18;

    let spd = 0.6 + waveNum * 0.04;
    // enemy speed
    if (t === 'bug') {
        spd *= 1.6; // adjust this (1.3–2.0 depending on how fast you want)
        hp *= 0.7;

    } else if (t === 'dino') {
        spd *= 0.8; // slower but tanky feel
        hp *= 2.5;

    } else if (t === 'blob') {
        spd *= 1.1; // slightly faster than normal
        hp *= 1.2;
    }
    enemies.push({
        x: wp[0].x, y: wp[0].y,
        wpIdx: 0, progress: 0,
        hp, maxHp: hp, spd,
        type: t,
        reward: 8 + waveNum * 2,
        size: t === 'dino' ? 18 : t === 'blob' ? 14 : 12,
        color: t === 'dino' ? '#9b59b6' : t === 'blob' ? '#e67e22' : '#c0392b',
    });
}
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
    floatingTexts = [];

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

function selectTower(type) {
    selectedType = type;
    document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector(`[data-type="${type}"]`).classList.add('selected');
}
window.selectTower = selectTower;
window.startWave = startWave;

canvas.addEventListener('click', (e) => {
    if (gameOver || gameWon) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // =========================
    // 🏹 HERO CONTROL (default)
    // =========================
    if (!e.shiftKey) {

        // check if clicked enemy → ATTACK
        for (let en of enemies) {
            if (!en.dead && Math.hypot(en.x - mx, en.y - my) < en.size) {
                hero.targetEnemy = en;
                hero.targetX = null;
                hero.targetY = null;
                return;
            }
        }

        // otherwise MOVE
        hero.targetEnemy = null;
        hero.targetX = mx;
        hero.targetY = my;
        return;
    }

    // =========================
    // 🏗️ TOWER PLACEMENT (SHIFT + CLICK)
    // =========================
    const def = TOWER_DEFS[selectedType];

    if (coins < def.cost) { showMsg('Not enough gold!', 900); return; }

    for (const t of towers) {
        if (Math.hypot(t.x - mx, t.y - my) < 22) {
            showMsg('Too close!', 800);
            return;
        }
    }

    const wp = getWaypoints();
    for (let i = 0; i < wp.length - 1; i++) {
        if (distToSegment(mx, my, wp[i].x, wp[i].y, wp[i + 1].x, wp[i + 1].y) < 28) {
            showMsg('Too close to path!', 900);
            return;
        }
    }

    coins -= def.cost;
    towers.push({ x: mx, y: my, type: selectedType, cooldown: 0, ...def });
    updateUI();
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    hero.targetEnemy = null;
    hero.targetX = mx;
    hero.targetY = my;
});

function distToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

let msgTimeout;
function showMsg(text, dur) {
    const m = document.getElementById('msg');
    m.textContent = text; m.style.display = 'block';
    clearTimeout(msgTimeout);
    msgTimeout = setTimeout(() => { m.style.display = 'none'; }, dur);
}

function updateUI() {
    document.getElementById('coins-display').textContent = '💰 ' + coins;
    document.getElementById('lives-display').textContent = '❤️ ' + lives;
}

// BUILD UI
function drawPath() {
    const wp = getWaypoints();
    ctx.save();
    ctx.strokeStyle = 'rgba(120,80,40,0.9)';
    ctx.lineWidth = 36;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(wp[0].x, wp[0].y);
    for (let i = 1; i < wp.length; i++) ctx.lineTo(wp[i].x, wp[i].y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(160,110,60,0.5)';
    ctx.lineWidth = 32;
    ctx.stroke();
    ctx.restore();
}

function drawBase() {
    const cx = canvas.width * 0.93;
    const cy = canvas.height * 0.65;

    const size = 60;

    if (baseImg.complete && baseImg.naturalWidth > 0) {
        ctx.drawImage(baseImg, cx - size / 2, cy - size / 2, size, size);
    } else {
        // fallback if image not loaded yet
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fillStyle = '#e8c96a';
        ctx.fill();
        ctx.restore();
    }
}

function drawDecor() {
    for (let d of decorations) {
        const img = decorImages[d.type];

        ctx.save();

        // 🌫 shadow (gives depth)
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(d.x + 2, d.y + 2, d.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;

        // 🌲 draw image
        if (img && img.complete) {
            ctx.translate(d.x, d.y);

            // optional rotation (only if you stored it in generateDecor)
            ctx.rotate(d.rotation || 0);

            ctx.drawImage(
                img,
                -d.size,
                -d.size,
                d.size * 2,
                d.size * 2
            );
        }

        ctx.restore();
    }
}

function drawEnemy(en) {
    const img = enemyImages[en.type];

    // breathing effect
    const pulse = Math.sin(Date.now() * 0.005) * 2;
    const size = en.size * 2 + pulse;

    // movement direction rotation
    const angle = Math.atan2(en.vy || 0, en.vx || 1);

    ctx.save();

    // move origin to enemy position
    ctx.translate(en.x, en.y);
    ctx.rotate(angle);

    if (en.dying) {
        ctx.globalAlpha = en.alpha ?? 1;
    }

    // draw enemy
    if (img && img.complete) {
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
    } else {
        ctx.fillStyle = en.color;
        ctx.beginPath();
        ctx.arc(0, 0, en.size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // 🔋 HP BAR (draw OUTSIDE rotation — important!)
    const barW = en.size * 2.2;
    const barH = 3;

    const bx = en.x - barW / 2;
    const by = en.y - en.size - 7;

    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, barW, barH);

    ctx.fillStyle = en.hp > en.maxHp * 0.5 ? '#2ecc71' : '#e74c3c';
    ctx.fillRect(bx, by, barW * (en.hp / en.maxHp), barH);
    ctx.globalAlpha = 1;
}

function drawTower(t) {
    const img = towerImages[t.type];

    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle || 0); // rotate toward enemy

    //img size and recoil effect
    const recoil = t.recoil || 0;

    // push backward when shooting
    ctx.translate(-recoil, 0);

    const size = t.size * 2 + recoil;

    if (img && img.complete) {
        ctx.drawImage(img, -size / 2, -size / 2, size * 1.2, size * 1.2); //fix img scaling
    } else {
        // fallback (if image not loaded yet)
        ctx.beginPath();
        ctx.arc(0, 0, t.size, 0, Math.PI * 2);
        ctx.fillStyle = t.color;
        ctx.fill();
    }

    ctx.restore();
}
//bullets
function drawProjectile(p) {
    ctx.save();
    //laser effect
    // ctx.fillStyle = p.color;
    // ctx.fillRect(p.x - 2, p.y - 2, 6, 2);

    //glow effect
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r || 3, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
}

function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;

    if (p.ring) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        p.r += p.grow;
    } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
    }

    ctx.restore();
}
//bg
function drawBackground() {
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4a2e14';
    for (let i = 0; i < 30; i++) {
        const bx = (i * 73 + 20) % canvas.width;
        const by = (i * 47 + 30) % (canvas.height - 60);
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}
//gold per kill
function drawFloatingTexts() {
    for (let t of floatingTexts) {
        ctx.save();
        ctx.globalAlpha = t.life / 60;
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
    }
}
//draw hero
function drawHero(h) {
    if (h.dead) return;
    // 🟤 SHADOW
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(h.x + 3, h.y + 4, h.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 🎯 HERO BODY
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);

    const recoil = h.recoil || 0;

    // slight push back when attacking
    ctx.translate(-recoil, 0);

    if (heroImg.complete) {
        ctx.drawImage(heroImg, -20, -20, 40, 40);
    } else {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(0, 0, h.size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // 🔋 HP BAR
    const barW = 30;
    const barH = 4;

    ctx.fillStyle = '#333';
    ctx.fillRect(h.x - barW / 2, h.y - 25, barW, barH);

    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(h.x - barW / 2, h.y - 25, barW * (h.hp / h.maxHp), barH);

    //Show respawn timer
    if (h.dead) {
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            "Respawn: " + Math.ceil(h.respawnTimer / 60),
            h.x,
            h.y - 35
        );
        ctx.restore();
    }
}

//add Effects
function addParticles(x, y, color, n) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1 + Math.random() * 2;
        particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 2 + Math.random() * 2, color, life: 18, maxLife: 18 });
    }
}
//explode effects
function addDeathEffect(x, y, color) {
    // BIG burst
    for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;

        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            r: 2 + Math.random() * 3,
            color,
            life: 30,
            maxLife: 30
        });
    }

    // FLASH ring
    particles.push({
        x,
        y,
        r: 5,
        grow: 6,
        color: '#fff',
        life: 20,
        maxLife: 20,
        ring: true
    });
}
//coins
function addFloatingText(x, y, text) {
    floatingTexts.push({
        x,
        y,
        text,
        life: 60
    });
}
//events effects updates
function update() {
    if (gameOver || gameWon) return;

    // HERO UPDATE
    if (hero) {

        // if (hero.dead) return;
        // Movement
        hero.hitCooldown = Math.max(0, hero.hitCooldown - 1);
        hero.recoil = Math.max(0, (hero.recoil || 0) - 0.4);
        if (hero.targetX !== null && hero.targetY !== null) {
            const dx = hero.targetX - hero.x;
            const dy = hero.targetY - hero.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 2) {
                hero.x += (dx / dist) * hero.speed;
                hero.y += (dy / dist) * hero.speed;
                hero.angle = Math.atan2(dy, dx);
            }
        }

        // Attack enemy
        if (hero.targetEnemy && !hero.targetEnemy.dead) {
            const dx = hero.targetEnemy.x - hero.x;
            const dy = hero.targetEnemy.y - hero.y;
            const dist = Math.hypot(dx, dy);

            hero.angle = Math.atan2(dy, dx);

            if (dist > hero.range) {
                // Move closer
                hero.x += (dx / dist) * hero.speed;
                hero.y += (dy / dist) * hero.speed;
            } else {
                // Attack
                hero.cooldown = Math.max(0, hero.cooldown - 1);

                if (hero.cooldown === 0) {

                    hero.recoil = 6; // 🔥 kickback

                    // 🔫 SHOOT PROJECTILE
                    projectiles.push({
                        x: hero.x,
                        y: hero.y,
                        target: hero.targetEnemy,
                        spd: 6,
                        atk: hero.atk,
                        color: '#00ffff',
                        r: 4,
                        fromHero: true // ⭐ mark as hero bullet
                    });

                    // 💥 muzzle effect
                    addParticles(hero.x, hero.y, '#00ffff', 5);

                    hero.cooldown = 25;
                }
            }
        }
        if (hero.hp <= 0 && !hero.dead) {
            hero.dead = true;
            hero.respawnTimer = 600; // 10 seconds

            addDeathEffect(hero.x, hero.y, '#00ffff');
        }
        if (hero.dead) {

            hero.respawnTimer--;

            // show countdown only
            if (hero.respawnTimer <= 0) {

                hero.dead = false;
                hero.hp = hero.maxHp;

                // respawn position (TOP / SAFE ZONE)
                hero.x = canvas.width * 0.1;
                hero.y = canvas.height * 0.1;

                hero.targetEnemy = null;
                hero.targetX = null;
                hero.targetY = null;

                addParticles(hero.x, hero.y, '#00ffff', 20);
            }

            //return; // ❗ stop ALL actions while dead
        }
    }

    if (waveActive) {
        spawnTimer++;
        if (spawnCount < spawnMax && spawnTimer >= spawnInterval) {
            spawnEnemy(wave);
            spawnCount++;
            spawnTimer = 0;
        }
        if (spawnCount >= spawnMax && enemies.length === 0) {
            waveActive = false;
            document.getElementById('start-btn').style.opacity = '1';
            if (wave >= maxWaves) {
                gameWon = true;
                showMsg('🎉 Victory! All waves defeated!', 99999);
                return;
            }
            coins += 20;
            updateUI();
        }
    }

    for (let t of floatingTexts) {
        t.y -= 0.5;
        t.life--;
    }

    floatingTexts = floatingTexts.filter(t => t.life > 0);
    //up points
    const wp = getWaypoints();
    for (let en of enemies) {
        // 💥 HERO DAMAGE ON TOUCH
        if (!hero.dead) {
            const d = Math.hypot(en.x - hero.x, en.y - hero.y);

            if (d < en.size + hero.size) {

                if (hero.hitCooldown <= 0) {

                    hero.hp -= 10;
                    hero.hitCooldown = 20;

                    addParticles(hero.x, hero.y, '#ff4d4d', 10);
                }
            }
        }
        if (en.dying) {
            en.deathTimer--;

            en.alpha = en.deathTimer / 12;

            if (en.deathTimer <= 0) {
                en.dead = true;   // remove after animation
                en.dying = false;
            }

            continue; // stop movement
        }

        if (en.wpIdx >= wp.length - 1) continue;

        const target = wp[en.wpIdx + 1];
        const dx = target.x - en.x, dy = target.y - en.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 2) {
            en.wpIdx++;

            if (en.wpIdx >= wp.length - 1) {
                en.dead = true;
                lives--;
                updateUI();
                if (lives <= 0) {
                    gameOver = true;
                    showMsg('💀 Game Over! Base destroyed!', 99999);
                    return;
                }
            }
        } else {
            en.vx = (dx / dist) * en.spd;
            en.vy = (dy / dist) * en.spd;

            en.x += en.vx * gameSpeed;
            en.y += en.vy * gameSpeed;
        }
    }
    //up towers
    for (let t of towers) {
        t.recoil = Math.max(0, (t.recoil || 0) - 0.5); // before cooldown check for recoil
        t.cooldown = Math.max(0, t.cooldown - 1);
        if (t.cooldown > 0) continue;
        let best = null, bestDist = 9999;
        for (let en of enemies) {
            if (en.dead) continue;
            const d = Math.hypot(en.x - t.x, en.y - t.y);
            if (d <= t.range && pathDist(en.wpIdx) < bestDist) { best = en; bestDist = pathDist(en.wpIdx); }
        }
        if (best) {
            t.angle = Math.atan2(best.y - t.y, best.x - t.x); //rotation toward enemy
            t.recoil = 6; // strength of recoil
            playSound(shootSounds[t.type]);

            const pColor = t.type === 'flamer' ? '#ff6b35' : t.type === 'drone' ? '#1D9E75' : t.type === 'tank' ? '#7F77DD' : '#85B7EB';
            projectiles.push({ x: t.x, y: t.y, tx: best.x, ty: best.y, target: best, spd: 5, atk: t.atk, color: pColor, r: t.type === 'flamer' ? 4 : 3, splash: t.splash, splashR: 50 });
            t.cooldown = Math.round(60 / t.spd);
        }
    }
    //up projectiles
    for (let p of projectiles) {
        if (!p.target || p.target.dead) {
            p.dead = true;
            continue;
        }
        const dx = p.target.x - p.x, dy = p.target.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < p.spd || p.target.dead) {
            if (!p.target.dead) {
                if (p.splash) {
                    for (let en of enemies) {
                        if (!en.dead && Math.hypot(en.x - p.target.x, en.y - p.target.y) < p.splashR) {
                            en.hp -= p.atk * 0.6;
                            if (en.hp <= 0 && !en.dead) {
                                en.dead = true;
                                en.dying = true;
                                en.deathTimer = 12;

                                addDeathEffect(en.x, en.y, en.color);
                                playSound(explosionSound);
                                coins += en.reward;
                                addFloatingText(en.x, en.y, "+" + en.reward);
                                updateUI();
                            }
                        }
                    }
                } else {
                    p.target.hp -= p.atk;
                    if (p.fromHero) { // 🔥 HERO HIT EFFECT 
                        addParticles(p.target.x, p.target.y, '#00ffff', 12);

                        particles.push({
                            x: p.target.x,
                            y: p.target.y,
                            r: 5,
                            grow: 4,
                            color: '#00ffff',
                            life: 15,
                            maxLife: 15,
                            ring: true
                        });
                    }
                    if (p.target.hp <= 0 && !p.target.dead) {
                        p.target.dead = true;
                        p.target.dying = true;
                        p.target.deathTimer = 12;

                        addDeathEffect(p.target.x, p.target.y, p.target.color);
                        playSound(explosionSound);
                        coins += p.target.reward;
                        addFloatingText(p.target.x, p.target.y, "+" + p.target.reward);
                        updateUI();
                    }
                }
                addParticles(p.x, p.y, p.color, 3);
            }
            p.dead = true;
        } else {
            p.x += (dx / dist) * p.spd;
            p.y += (dy / dist) * p.spd;
        }
    }

    for (let p of particles) {
        p.x += p.vx; p.y += p.vy; p.life--;
        p.vx *= 0.9; p.vy *= 0.9;
    }

    enemies = enemies.filter(e => !e.dead);
    projectiles = projectiles.filter(p => !p.dead);
    particles = particles.filter(p => p.life > 0);
}
//init
function draw() {
    drawBackground();
    drawDecor();
    drawPath();
    drawHero(hero);
    drawBase();
    drawFloatingTexts();
    for (const t of towers) drawTower(t);
    for (const en of enemies) drawEnemy(en);
    for (const p of projectiles) drawProjectile(p);
    for (const p of particles) drawParticle(p);
    if (!waveActive && !gameOver && !gameWon && wave < maxWaves) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(wave === 0 ? 'Place towers, then press ▶ Start' : `Wave ${wave} done! Press ▶ Start for next`, canvas.width - 10, canvas.height - 50);
        ctx.restore();
    }
    if (hero.dead) {
        ctx.save();

        // ✨ blinking effect (ADD THIS LINE HERE)
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.5;

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';

        ctx.fillText(
            "RESPAWNING IN: " + Math.ceil(hero.respawnTimer / 60) + "s",
            canvas.width / 2,
            30
        );

        ctx.restore();
    }
}
//assets -- next add music
const enemyImages = {
    blob: new Image(),
    dino: new Image(),
    bug: new Image()
};
enemyImages.blob.src = "assets/sprite-sheets/blob.png";
enemyImages.dino.src = "assets/sprite-sheets/dino.png";
enemyImages.bug.src = "assets/sprite-sheets/bug.png";

const towerImages = {
    sniper: new Image(),
    flamer: new Image(),
    tank: new Image(),
    drone: new Image()
};
towerImages.sniper.src = "assets/towers/sniper.png";
towerImages.flamer.src = "assets/towers/flamer.png";
towerImages.tank.src = "assets/towers/mech.png"; // assuming mech = tank
towerImages.drone.src = "assets/towers/drone.png";

const decorImages = {
    tree: new Image(),
    bush: new Image()
};
decorImages.tree.src = "assets/decor/tree.png";
decorImages.bush.src = "assets/decor/bush.png";

const baseImg = new Image();
baseImg.src = "assets/decor/base.png";

const heroImg = new Image();
heroImg.src = "assets/sprite-sheets/botcha.png";

/* ===============================
    AUDIO SYSTEM
================================= */

// tower shoot sounds
const shootSounds = {
    sniper: new Audio("assets/sounds/sniper_projectile_sound.mp3"),
    drone: new Audio("assets/sounds/sniper_projectile_sound.mp3"), // same as sniper
    flamer: new Audio("assets/sounds/flame_projectile_sound.mp3"),
    tank: new Audio("assets/sounds/mech_projectile_sound.mp3")
};

// explosion sound
const explosionSound = new Audio("assets/sounds/explosion.mp3");

// background music
const bgMusic = new Audio("assets/sounds/bg_music.mp3");

// settings
bgMusic.loop = true;
bgMusic.volume = 0.35;
explosionSound.volume = 0.6;

// preload + lower latency
for (let key in shootSounds) {
    shootSounds[key].volume = 0.5;
    shootSounds[key].preload = "auto";
}
explosionSound.preload = "auto";
bgMusic.preload = "auto";

/* play sound helper */
function playSound(audio) {
    const s = audio.cloneNode(); // allows overlap
    s.volume = audio.volume;
    s.muted = muted;
    s.play().catch(() => { });
}

//loop
function loop() {
    update();
    draw();
    animFrame = requestAnimationFrame(loop);
}

//to organize
document.querySelectorAll('.tower-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
        selectTower(btn.dataset.type);
    });
});

// document.getElementById('start-btn').addEventListener('click', startWave);
document.getElementById('start-btn').addEventListener('click', () => {
    bgMusic.play().catch(() => { });
    startWave();
});
document.getElementById('reset-btn').addEventListener('click', resetGame);

//audio settings
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');

// sliders / controls 
const musicSlider = document.getElementById('music-slider');
const sfxSlider = document.getElementById('sfx-slider');
const muteBtn = document.getElementById('mute-btn');

// Start closed
settingsPanel.classList.add('hidden');

// Toggle panel only when button clicked
settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPanel.classList.toggle('hidden');
});

// Close if clicked outside
document.addEventListener('click', (e) => {
    if (
        !settingsPanel.contains(e.target) &&
        e.target !== settingsBtn
    ) {
        settingsPanel.classList.add('hidden');
    }
});
//hover enemy
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    hoveredEnemy = null;

    for (let en of enemies) {
        if (!en.dead && Math.hypot(en.x - mx, en.y - my) < en.size) {
            hoveredEnemy = en;
            break;
        }
    }

    // change cursor to crosshair
    canvas.style.cursor = hoveredEnemy ? 'crosshair' : 'default';

    //for better UX 
    //canvas.style.cursor = hoveredEnemy ? 'url("assets/cursor-attack/target.png"), auto' : 'default';
});

// Prevent inside click from closing
settingsPanel.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Music Volume
musicSlider.addEventListener('input', () => {
    bgMusic.volume = musicSlider.value / 100;
});

// SFX Volume
sfxSlider.addEventListener('input', () => {
    const vol = sfxSlider.value / 100;

    explosionSound.volume = vol;

    for (let key in shootSounds) {
        shootSounds[key].volume = vol;
    }
});

// Mute Toggle
let muted = false;
//git push origin main
muteBtn.addEventListener('click', () => {
    muted = !muted;

    bgMusic.muted = muted;
    explosionSound.muted = muted;

    for (let key in shootSounds) {
        shootSounds[key].muted = muted;
    }

    muteBtn.textContent = muted ? "🔊 Unmute All" : "🔇 Mute All";
});

//hero
function heroAOE() {
    for (let en of enemies) {
        if (!en.dead && Math.hypot(en.x - hero.x, en.y - hero.y) < 80) {
            en.hp -= 40;
            addParticles(en.x, en.y, '#00ffff', 10);
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'q') {
        heroAOE();
    }
});
