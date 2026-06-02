function addParticles(x, y, color, n) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1 + Math.random() * 2;
        particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 2 + Math.random() * 2, color, life: 18, maxLife: 18 });
    }
}
function addMoveTrace(x, y) {
    moveTraces.push({
        x,
        y,
        r: 18,
        life: 14,
        maxLife: 14
    });
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
function addFloatingText(x, y, text, color = '#fff') {
    floatingTexts.push({
        x,
        y,
        text,
        color,
        life: 60
    });
}
