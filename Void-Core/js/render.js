// BUILD UI
function drawPath() {
    const wp = getWaypoints();
    ctx.save();
    ctx.strokeStyle = 'rgba(160,100,40,0.95)';
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

    const size = 38;

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

        // ðŸŒ« shadow (gives depth)
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(d.x + 2, d.y + 2, d.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;

        // ðŸŒ² draw image
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
    const size = (en.size * 2 + pulse) * SCALE;
    const s = en.size * SCALE;
    // movement direction rotation
    const angle = Math.atan2(en.vy || 0, en.vx || 1);

    // ðŸŒ« SHADOW (only for flying)
    if (en.flying) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#000';
        const shadowSize = en.size * SCALE * 0.8;
        ctx.beginPath();
        ctx.arc(en.x + 6, en.y + 10, shadowSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    ctx.save();
    // ðŸŽ¯ ALTITUDE (floating effect)
    const altitude = en.flying
        ? Math.sin(Date.now() * 0.003 + (en.waveOffset || 0)) * 6
        : 0;
    // move origin to enemy position
    ctx.translate(en.x, en.y - altitude);
    ctx.rotate(angle);

    if (en.dying) {
        ctx.globalAlpha = en.alpha ?? 1;
    }


    // draw enemy with images
    // if (img && img.complete) {
    //     ctx.drawImage(img, -size / 2, -size / 2, size, size);
    // } else {
    //     ctx.fillStyle = en.color;
    //     ctx.beginPath();
    //     ctx.arc(0, 0, en.size, 0, Math.PI * 2);
    //     ctx.fill();
    // }

    // draw enemy with just pixels
    if (en.type === 'bug') {
        // small red circle with legs
        ctx.fillStyle = en.color;
        ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-s, -3); ctx.lineTo(-s - 5, -6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(-s - 5, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s, 3); ctx.lineTo(-s - 5, 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s, -3); ctx.lineTo(s + 5, -6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(s + 5, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s, 3); ctx.lineTo(s + 5, 6); ctx.stroke();

    } else if (en.type === 'dino') {
        ctx.fillStyle = en.color;
        ctx.fillRect(-s, -s * 0.8, s * 2, s * 1.6);
        ctx.fillRect(s * 0.3, -s * 1.3, s * 0.8, s * 0.7);
        ctx.fillStyle = '#fff';
        ctx.fillRect(s * 0.5, -s * 1.2, 4, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(s * 0.6, -s * 1.1, 2, 2);

    } else if (en.type === 'blob') {
        const wobble = Math.sin(Date.now() * 0.008) * 2;
        ctx.fillStyle = en.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, s + wobble, s - wobble * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-3, -2, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3, -2, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(-2, -2, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4, -2, 1.5, 0, Math.PI * 2); ctx.fill();

    } else if (en.type === 'flyer') {
        ctx.fillStyle = en.color;
        ctx.beginPath();
        ctx.moveTo(0, -s); ctx.lineTo(s * 0.6, 0);
        ctx.lineTo(0, s); ctx.lineTo(-s * 0.6, 0);
        ctx.closePath(); ctx.fill();
        const wingFlap = Math.sin(Date.now() * 0.015) * 3;
        ctx.fillStyle = 'rgba(88,211,255,0.5)';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-s * 1.8, -s * 0.5 - wingFlap);
        ctx.lineTo(-s * 0.5, s * 0.3); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(s * 1.8, -s * 0.5 - wingFlap);
        ctx.lineTo(s * 0.5, s * 0.3); ctx.closePath(); ctx.fill();

    } else if (en.type === 'roamer') {
        ctx.save();
        ctx.rotate(Date.now() * 0.003);
        ctx.fillStyle = en.color;
        ctx.fillRect(-s, -s, s * 2, s * 2);
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 2;
        ctx.strokeRect(-s, -s, s * 2, s * 2);
        ctx.restore();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(2, -1, 2, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();

    // ðŸ”‹ HP BAR (draw OUTSIDE rotation â€” important!)
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

    const size = (t.size * 2 + recoil) * 0.65;

    //draw towers with images
    // if (img && img.complete) {
    //     ctx.drawImage(img, -size / 2, -size / 2, size * 1.2, size * 1.2); //fix img scaling
    // } else {
    //     // fallback (if image not loaded yet)
    //     ctx.beginPath();
    //     ctx.arc(0, 0, t.size, 0, Math.PI * 2);
    //     ctx.fillStyle = t.color;
    //     ctx.fill();
    // }

    // draw towers with just pixels
    if (t.type === 'sniper') {
        // base body
        ctx.fillStyle = t.color;
        ctx.fillRect(-size * 0.3, -size * 0.3, size * 0.6, size * 0.6);

        // long barrel
        ctx.fillStyle = t.color;
        ctx.fillRect(-size * 0.1, -size * 0.08, size * 1.8, size * 0.16); // extra long

        // barrel tip accent
        ctx.fillStyle = '#aad4ff';
        ctx.fillRect(size * 1.6, -size * 0.08, size * 0.2, size * 0.16);

        // scope on top
        ctx.fillStyle = '#1a5a9a';
        ctx.fillRect(size * 0.1, -size * 0.35, size * 0.5, size * 0.15);

        // scope lens
        ctx.fillStyle = '#aad4ff';
        ctx.beginPath();
        ctx.arc(size * 0.35, -size * 0.28, size * 0.07, 0, Math.PI * 2);
        ctx.fill();

    } else if (t.type === 'flamer') {
        // red squat box with nozzle
        // main body
        ctx.fillStyle = t.color;
        ctx.fillRect(-size * 0.4, -size * 0.4, size * 0.8, size * 0.8);

        const barrelRecoil = t.barrelRecoil || [0, 0];

        // TOP barrel
        ctx.save();
        ctx.translate(-barrelRecoil[0], 0); // recoil pushes barrel back
        ctx.fillStyle = '#cc3300';
        ctx.fillRect(-size * 0.05, -size * 0.35, size * 0.9, size * 0.18); // top barrel
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(size * 0.5, -size * 0.35, size * 0.15, size * 0.18); // tip
        ctx.restore();

        // BOTTOM barrel
        ctx.save();
        ctx.translate(-barrelRecoil[1], 0);
        ctx.fillStyle = '#cc3300';
        ctx.fillRect(-size * 0.05, size * 0.17, size * 0.9, size * 0.18); // bottom barrel
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(size * 0.5, size * 0.17, size * 0.15, size * 0.18); // tip
        ctx.restore();

    } else if (t.type === 'tank') {
        // purple wide base + turret
        ctx.fillStyle = t.color;
        ctx.fillRect(-size * 0.6, -size * 0.35, size * 1.2, size * 0.7);
        ctx.fillStyle = '#9b8fe0';
        ctx.fillRect(-size * 0.25, -size * 0.25, size * 0.5, size * 0.5);
        ctx.fillStyle = t.color;
        ctx.fillRect(size * 0.2, -size * 0.1, size * 0.6, size * 0.2);

    } else if (t.type === 'barracks') {
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -size * 0.65, -size * 0.65, size * 1.3, size * 1.3);
        }

        ctx.fillStyle = 'rgba(217,180,74,0.9)';
        ctx.fillRect(-size * 0.55, -size * 0.45, size * 1.1, size * 0.9);
        ctx.fillStyle = '#7a5a1a';
        ctx.fillRect(-size * 0.22, -size * 0.05, size * 0.44, size * 0.4);
        ctx.strokeStyle = '#f5d76e';
        ctx.lineWidth = 2;
        ctx.strokeRect(-size * 0.55, -size * 0.45, size * 1.1, size * 0.9);

    } else if (t.type === 'drone') {
        // teal X shape (rotary)
        ctx.fillStyle = t.color;
        ctx.fillRect(-size * 0.15, -size * 0.7, size * 0.3, size * 1.4);
        ctx.fillRect(-size * 0.7, -size * 0.15, size * 1.4, size * 0.3);
        ctx.fillStyle = '#0f6e56';
        ctx.beginPath(); ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;      // âœ… reset alpha in case any tower draw dirtied it
    ctx.shadowBlur = 0;       // âœ… reset shadow too
    ctx.restore();
}

function drawSoldier(s) {
    if (s.dead) {
        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = '#f5d76e';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(Math.ceil(s.respawnTimer / 60), s.homeX, s.homeY - 8);
        ctx.restore();
        return;
    }

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle || 0);

    ctx.fillStyle = '#2d3b2d';
    ctx.fillRect(-5, -5, 10, 10);
    ctx.fillStyle = '#d9b44a';
    ctx.fillRect(2, -1.5, 8, 3);
    ctx.fillStyle = '#f5d76e';
    ctx.beginPath();
    ctx.arc(-1, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const barW = 18;
    const barH = 3;
    ctx.fillStyle = '#333';
    ctx.fillRect(s.x - barW / 2, s.y - 13, barW, barH);
    ctx.fillStyle = s.hp > s.maxHp * 0.45 ? '#2ecc71' : '#e74c3c';
    ctx.fillRect(s.x - barW / 2, s.y - 13, barW * (s.hp / s.maxHp), barH);
}

//bullets/Homing missiles
function drawProjectile(p) {

    ctx.save();

    // ðŸš€ DRONE MISSILE
    if (p.homing) {

        const ang = Math.atan2(p.vy, p.vx);

        ctx.translate(p.x, p.y);
        ctx.rotate(ang);

        // flame trail
        ctx.fillStyle = '#ff9933';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-16, -3);
        ctx.lineTo(-16, 3);
        ctx.closePath();
        ctx.fill();

        // missile body
        ctx.fillStyle = '#dfe6e9';
        ctx.fillRect(-8, -3, 14, 6);

        // missile tip
        ctx.fillStyle = '#ff4d4d';
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(0, -4);
        ctx.lineTo(0, 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
        return;
    }

    // NORMAL BULLETS
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 4;

    ctx.beginPath();
    ctx.arc(p.x, p.y, (p.r || 3) * 0.5, 0, Math.PI * 2);

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

function drawMoveTrace(trace) {
    const alpha = trace.life / trace.maxLife;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.arc(trace.x, trace.y, trace.r * (1 - alpha * 0.35), 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(trace.x - 8, trace.y);
    ctx.lineTo(trace.x + 8, trace.y);
    ctx.moveTo(trace.x, trace.y - 8);
    ctx.lineTo(trace.x, trace.y + 8);
    ctx.stroke();

    ctx.restore();
}

//bg
function drawBackground() {
    // dark base like home screen
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // subtle grid lines (same as home)
    ctx.strokeStyle = 'rgba(255,200,80,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 60) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 60) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }
}

//gold per kill
function drawFloatingTexts() {
    for (let t of floatingTexts) {
        ctx.save();

        ctx.globalAlpha = t.life / 60;
        ctx.fillStyle = t.color || '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';

        ctx.fillText(t.text, t.x, t.y);

        ctx.restore();
    }
}
//draw hero
function drawHero(h) {
    if (h.dead) return;
    // ðŸŸ¤ SHADOW
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(h.x + 3, h.y + 4, h.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ðŸŽ¯ HERO BODY
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);

    const recoil = h.recoil || 0;

    // slight push back when attacking
    ctx.translate(-recoil, 0);

    //Draw Hero with images
    // if (heroImg.complete) {
    //     ctx.drawImage(heroImg, -20, -20, 40, 40);
    // } else {
    //     ctx.fillStyle = '#00ffff';
    //     ctx.beginPath();
    //     ctx.arc(0, 0, h.size, 0, Math.PI * 2);
    //     ctx.fill();
    // }

    // Draw Hero  tank body (wide green base)
    // tank body (wide green base)
    ctx.fillStyle = '#4a7c3f';
    ctx.fillRect(-10, -8, 20, 16);

    // tracks on TOP and BOTTOM (these are the left/right sides when tank faces right)
    ctx.fillStyle = '#2a4a25';
    ctx.fillRect(-12, -11, 24, 5);   // top track
    ctx.fillRect(-12, 6, 24, 5);     // bottom track

    // track segments detail
    ctx.fillStyle = '#1a3018';
    for (let i = -10; i < 12; i += 5) {
        ctx.fillRect(i, -11, 2, 5);  // top track lines
        ctx.fillRect(i, 6, 2, 5);    // bottom track lines
    }

    // turret base
    ctx.fillStyle = '#5a9e4f';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // cannon barrel (longer now)
    ctx.fillStyle = '#3a6030';
    ctx.fillRect(3, -2, 16, 4);

    // hatch bolt detail
    ctx.fillStyle = '#3a6030';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.fillStyle = '#7fd46e';
    ctx.fillRect(-1, -1, 2, 2);

    ctx.restore();

    // ðŸ”‹ HP BAR
    const barW = 30;
    const barH = 4;

    ctx.fillStyle = '#333';
    ctx.fillRect(h.x - barW / 2, h.y - 18, barW, barH);

    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(h.x - barW / 2, h.y - 18, barW * (h.hp / h.maxHp), barH);

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

