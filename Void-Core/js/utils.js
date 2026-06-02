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
