canvas.addEventListener('click', (e) => {
    if (gameOver || gameWon) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // =========================
    // ðŸ¹ HERO CONTROL (default)
    // =========================
    if (!e.shiftKey) {

        // check if clicked enemy â†’ ATTACK
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
        addMoveTrace(mx, my);
        return;
    }

    // =========================
    // ðŸ—ï¸ TOWER PLACEMENT (SHIFT + CLICK)
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
    addMoveTrace(mx, my);
});
