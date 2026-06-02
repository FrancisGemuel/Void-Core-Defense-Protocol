//events effects updates
const BARRACKS_RESPAWN_FRAMES = 20 * 60;

function getSoldierHome(t, index) {
    const angle = (Math.PI * 2 / t.soldierCount) * index - Math.PI / 2;
    const radius = 30;

    return {
        x: t.x + Math.cos(angle) * radius,
        y: t.y + Math.sin(angle) * radius
    };
}

function ensureBarracksSoldiers(t) {
    if (t.soldiers) return;

    t.soldiers = [];
    for (let i = 0; i < t.soldierCount; i++) {
        const home = getSoldierHome(t, i);
        t.soldiers.push({
            x: home.x,
            y: home.y,
            homeX: home.x,
            homeY: home.y,
            size: 7,
            hp: 45,
            maxHp: 45,
            speed: 1.4,
            range: 95,
            cooldown: 0,
            hitCooldown: 0,
            respawnTimer: 0,
            dead: false,
            angle: 0
        });
    }
}

function updateBarracksTower(t) {
    ensureBarracksSoldiers(t);

    for (let i = 0; i < t.soldiers.length; i++) {
        const s = t.soldiers[i];
        const home = getSoldierHome(t, i);
        s.homeX = home.x;
        s.homeY = home.y;

        if (s.dead) {
            s.respawnTimer--;
            if (s.respawnTimer <= 0) {
                s.dead = false;
                s.hp = s.maxHp;
                s.x = s.homeX;
                s.y = s.homeY;
                addParticles(s.x, s.y, '#d9b44a', 12);
            }
            continue;
        }

        s.cooldown = Math.max(0, s.cooldown - 1);
        s.hitCooldown = Math.max(0, s.hitCooldown - 1);

        for (let en of enemies) {
            if (en.dead || en.dying) continue;
            if (Math.hypot(en.x - s.x, en.y - s.y) < en.size + s.size && s.hitCooldown <= 0) {
                s.hp -= 12;
                s.hitCooldown = 30;
                addParticles(s.x, s.y, '#ff4d4d', 5);

                if (s.hp <= 0) {
                    s.dead = true;
                    s.respawnTimer = BARRACKS_RESPAWN_FRAMES;
                    addDeathEffect(s.x, s.y, '#d9b44a');
                    break;
                }
            }
        }

        if (s.dead) continue;

        let best = null;
        let bestDist = 9999;
        for (let en of enemies) {
            if (en.dead || en.dying) continue;
            if (Math.hypot(en.x - t.x, en.y - t.y) > t.range) continue;

            const d = Math.hypot(en.x - s.x, en.y - s.y);
            if (d < bestDist) {
                best = en;
                bestDist = d;
            }
        }

        if (best) {
            const dx = best.x - s.x;
            const dy = best.y - s.y;
            const dist = Math.hypot(dx, dy);
            s.angle = Math.atan2(dy, dx);

            if (dist > s.range * 0.75) {
                const nx = s.x + (dx / dist) * s.speed;
                const ny = s.y + (dy / dist) * s.speed;
                if (Math.hypot(nx - t.x, ny - t.y) <= t.range) {
                    s.x = nx;
                    s.y = ny;
                }
            }

            if (dist <= s.range && s.cooldown === 0) {
                projectiles.push({
                    x: s.x,
                    y: s.y,
                    vx: Math.cos(s.angle) * 5,
                    vy: Math.sin(s.angle) * 5,
                    spd: 5,
                    atk: t.atk,
                    color: '#f5d76e',
                    r: 3,
                    fromTowerType: 'barracks',
                    dist: s.range * 1.4
                });
                addParticles(s.x, s.y, '#f5d76e', 3);
                playSound(shootSounds.sniper);
                s.cooldown = Math.round(60 / t.spd);
            }
        } else {
            const dx = s.homeX - s.x;
            const dy = s.homeY - s.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 1) {
                s.x += (dx / dist) * s.speed;
                s.y += (dy / dist) * s.speed;
                s.angle = Math.atan2(dy, dx);
            }
        }
    }
}

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

                    hero.recoil = 6; // ðŸ”¥ kickback

                    playSound(shootSounds.tank); //  shoot sound (mech sound)

                    // ðŸ”« SHOOT PROJECTILE
                    const hAng = Math.atan2(hero.targetEnemy.y - hero.y, hero.targetEnemy.x - hero.x);
                    projectiles.push({
                        x: hero.x,
                        y: hero.y,
                        vx: Math.cos(hAng) * 6,
                        vy: Math.sin(hAng) * 6,
                        spd: 6,
                        atk: hero.atk,
                        color: '#00ffff',
                        r: 4,
                        fromHero: true,
                        dist: hero.range * 1.5
                    });

                    // ðŸ’¥ muzzle effect
                    addParticles(hero.x, hero.y, '#00ffff', 5);

                    hero.cooldown = 25;
                }
            }
        }
        // AUTO TARGET (only if player didn't choose one)
        if (!hero.targetEnemy || hero.targetEnemy.dead) {
            let best = null;
            let bestDist = hero.range;

            for (let en of enemies) {
                if (en.dead) continue;

                const d = Math.hypot(en.x - hero.x, en.y - hero.y);
                if (d < bestDist) {
                    bestDist = d;
                    best = en;
                }
            }

            hero.targetEnemy = best;
        }
        if (hero.hp <= 0 && !hero.dead) {
            hero.dead = true;
            hero.respawnTimer = 600; // 10 seconds

            // â¤ï¸ REMOVE 1 LIFE
            lives--;
            updateUI();

            if (lives <= 0) {
                gameOver = true;
                showMsg('💀 Game Over! Base destroyed!', 99999);
                return;
            }

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

            //return; // â— stop ALL actions while dead
        }
    }
    //recalibrate active wave later
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
    for (let trace of moveTraces) {
        trace.life--;
    }
    moveTraces = moveTraces.filter(trace => trace.life > 0);
    //up points
    const wp = getWaypoints();
    for (let en of enemies) {
        // ðŸ’¥ HERO DAMAGE ON TOUCH
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

        // flyer movement
        if (en.flying) {
            const baseX = canvas.width * 0.93;
            const baseY = canvas.height * 0.65;
            const dx = baseX - en.x;
            const dy = baseY - en.y;
            const dist = Math.hypot(dx, dy);
            // dash timer
            if (!en.dashTimer) {
                en.dashTimer = 0;
                en.dashCooldown = Math.floor(Math.random() * 180 + 120); // first dash in 2â€“5s
            }

            en.dashTimer--;
            en.dashCooldown--;

            if (en.dashCooldown <= 0) {
                en.dashTimer = 40;           // dash lasts ~0.7s
                en.dashCooldown = Math.floor(Math.random() * 180 + 120); // next dash cooldown
            }

            const dashMultiplier = en.dashTimer > 0 ? 2.2 : 1;

            en.vx = (dx / dist) * en.spd * dashMultiplier;
            en.vy = (dy / dist) * en.spd * dashMultiplier;
            const waveMotion = Math.sin(Date.now() * 0.005 + en.waveOffset) * 1.5;
            const px = -en.vy, py = en.vx;
            en.x += en.vx * gameSpeed + px * waveMotion;
            en.y += en.vy * gameSpeed + py * waveMotion;
            if (dist < 10) {
                en.dead = true;
                lives--;
                updateUI();
                if (lives <= 0) { gameOver = true; showMsg('💀 Game Over! Base destroyed!', 99999); }
            }
            continue;
        }
        // roamer movement
        if (en.type === 'roamer') {
            en.vx = en.spd * gameSpeed;
            en.vy = Math.sin(Date.now() * 0.002 + en.waveOffset) * 0.8; // slight drift
            en.x += en.vx;
            en.y += en.vy;

            if (en.x > canvas.width + 30) {
                en.dead = true;
                lives--;
                updateUI();
                if (lives <= 0) { gameOver = true; showMsg('💀 Game Over! Base destroyed!', 99999); }
            }
            continue;
        }

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
        if (t.type === 'barracks') {
            updateBarracksTower(t);
            continue;
        }

        t.recoil = Math.max(0, (t.recoil || 0) - 0.5); // before cooldown check for recoil
        // âœ… decay individual barrel recoil for flamer
        if (t.barrelRecoil) {
            t.barrelRecoil[0] = Math.max(0, t.barrelRecoil[0] - 0.5);
            t.barrelRecoil[1] = Math.max(0, t.barrelRecoil[1] - 0.5);
        }

        t.cooldown = Math.max(0, t.cooldown - 1);
        if (t.cooldown > 0) continue;
        let best = null, bestDist = 9999;
        for (let en of enemies) {
            if (en.dead) continue;
            if (t.type === 'tank' && en.flying) continue;
            if (t.type === 'drone' && !en.flying) continue; // âœ… drone ignores ground
            const d = Math.hypot(en.x - t.x, en.y - t.y);
            if (d <= t.range) {
                const score = en.flying
                    ? d // flyers: prioritize distance (closest threat)
                    : pathDist(en.wpIdx); // ground: path progress

                if (score < bestDist) {
                    best = en;
                    bestDist = score;
                }
            }
        }
        if (best) {
            t.angle = Math.atan2(best.y - t.y, best.x - t.x); //rotation toward enemy
            t.recoil = 6; // strength of recoil

            // âœ… alternate which barrel fired
            if (t.type === 'flamer') {
                t.lastBarrel = (t.lastBarrel === 0) ? 1 : 0;
                t.barrelRecoil = [0, 0];
                t.barrelRecoil[t.lastBarrel] = 6;
            }

            playSound(shootSounds[t.type]);

            const pColor = t.type === 'flamer' ? '#ff6b35' : t.type === 'drone' ? '#1D9E75' : t.type === 'tank' ? '#7F77DD' : '#85B7EB';

            // âœ… muzzle flash at barrel tip
            const muzzleAng = t.angle;
            const muzzleDist = t.size * 1.2;
            const mx = t.x + Math.cos(muzzleAng) * muzzleDist;
            const my = t.y + Math.sin(muzzleAng) * muzzleDist;
            addParticles(mx, my, pColor, 5);
            particles.push({ x: mx, y: my, r: 4, grow: 5, color: '#ffffff', life: 8, maxLife: 8, ring: true });

            const ang = Math.atan2(best.y - t.y, best.x - t.x);
            projectiles.push({
                x: t.x,
                y: t.y,

                vx: Math.cos(ang) * 5,
                vy: Math.sin(ang) * 5,

                spd: t.type === 'drone' ? 3.5 : 5,

                atk: t.atk,
                color: pColor,

                r: t.type === 'drone' ? 5 : (t.type === 'flamer' ? 4 : 3),

                splash: t.splash,
                splashR: 50,

                fromTowerType: t.type,

                // ðŸš€ missile target
                target: t.type === 'drone' ? best : null,

                // ðŸš€ missile flag
                homing: t.type === 'drone',

                dist: t.range * 1.5
            });
            t.cooldown = Math.round(60 / t.spd);
        }
    }
    //up projectiles
    for (let p of projectiles) {
        // ðŸš€ HOMING MISSILE
        if (p.homing && p.target && !p.target.dead) {

            const dx = p.target.x - p.x;
            const dy = p.target.y - p.y;

            const dist = Math.hypot(dx, dy);

            if (dist > 1) {

                // normalize
                const tx = dx / dist;
                const ty = dy / dist;

                // smooth steering
                p.vx += (tx * p.spd - p.vx) * 0.08;
                p.vy += (ty * p.spd - p.vy) * 0.08;

                // limit speed
                const v = Math.hypot(p.vx, p.vy);

                p.vx = (p.vx / v) * p.spd;
                p.vy = (p.vy / v) * p.spd;
            }
        }
        // Bullets / straight projectile
        p.x += p.vx;
        p.y += p.vy;

        // âœ… kill orphaned drone missiles
        if (p.homing && (!p.target || p.target.dead)) {
            // âœ… fizzle effect when target dies mid-flight
            addParticles(p.x, p.y, '#1D9E75', 6);
            particles.push({ x: p.x, y: p.y, r: 4, grow: 4, color: '#aaffcc', life: 10, maxLife: 10, ring: true });
            p.dead = true;
            continue;
        }

        // check hit against all enemies in radius
        let hit = false;
        for (let en of enemies) {
            if (en.dead) continue;

            if (p.fromTowerType === 'tank' && en.flying) continue;
            // drone ONLY attacks flyers
            if (p.fromTowerType === 'drone' && !en.flying) continue;

            // âœ… must actually reach the enemy
            if (Math.hypot(en.x - p.x, en.y - p.y) > en.size + (p.r || 3)) continue;

            // hit!
            if (p.splash) {
                for (let en2 of enemies) {
                    if (!en2.dead && !en2.flying && Math.hypot(en2.x - p.x, en2.y - p.y) < p.splashR) {
                        en2.hp -= p.atk * 0.6;
                        if (en2.hp <= 0 && !en2.dead) {
                            en2.dead = true; en2.dying = true; en2.deathTimer = 12;
                            addDeathEffect(en2.x, en2.y, en2.color);
                            playSound(explosionSound);
                            coins += en2.reward;
                            addFloatingText(en2.x, en2.y, "+" + en2.reward);
                            updateUI();
                        }
                    }
                }
            } else {
                let didHit = true;
                if (p.fromTowerType === 'sniper' && en.flying) didHit = Math.random() > 0.5;

                if (didHit) {
                    en.hp -= p.atk;
                    if (p.fromHero) {
                        addParticles(en.x, en.y, '#00ffff', 12);
                        particles.push({ x: en.x, y: en.y, r: 5, grow: 4, color: '#00ffff', life: 15, maxLife: 15, ring: true });
                    }
                    if (en.hp <= 0 && !en.dead) {
                        en.dead = true; en.dying = true; en.deathTimer = 12;
                        addDeathEffect(en.x, en.y, en.color);
                        playSound(explosionSound);
                        coins += en.reward;
                        addFloatingText(en.x, en.y, "+" + en.reward);
                        updateUI();
                    }
                } else {
                    addParticles(p.x, p.y, '#ffffff', 3);

                    // MISS TEXT
                    addFloatingText(
                        en.x,
                        en.y - 10,
                        'MISS',
                        '#ffdddd'
                    );
                }
            }

            // âœ… drone missile hit explosion
            if (p.homing) {
                addDeathEffect(p.x, p.y, '#1D9E75');
                addParticles(p.x, p.y, '#58d3ff', 15);
                particles.push({ x: p.x, y: p.y, r: 8, grow: 8, color: '#ffffff', life: 12, maxLife: 12, ring: true });
            } else {
                addParticles(p.x, p.y, p.color, 3);
            }
            hit = true;
            break;
        }

        // kill if hit or out of range
        if (hit || p.dist <= 0) {
            p.dead = true;
        } else {
            p.dist -= p.spd;
        }
    }
    //RECALIBRATE PARTICLES
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
    for (const trace of moveTraces) drawMoveTrace(trace);
    drawHero(hero);
    drawBase();
    drawFloatingTexts();
    for (const t of towers) drawTower(t);
    for (const t of towers) {
        if (t.type === 'barracks' && t.soldiers) {
            for (const s of t.soldiers) drawSoldier(s);
        }
    }
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

        // âœ¨ blinking effect (ADD THIS LINE HERE)
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
