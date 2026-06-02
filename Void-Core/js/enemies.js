//create enemy
function spawnEnemy(waveNum) {
    const wp = getWaypoints();
    const types = ['bug', 'dino', 'blob', 'flyer', 'roamer']; //new update roamer
    const t = types[Math.floor(Math.random() * types.length)];
    let hp = 40 + waveNum * 18;

    let spd = 0.6 + waveNum * 0.04;
    // enemy speed
    if (t === 'bug') {
        spd *= 1.6; // adjust this (1.3â€“2.0 depending on how fast you want)
        hp *= 0.7;

    } else if (t === 'dino') {
        spd *= 0.8; // slower but tanky feel
        hp *= 2.5;

    } else if (t === 'blob') {
        spd *= 1.1; // slightly faster than normal
        hp *= 1.2;
    }
    else if (t === 'flyer') {
        spd *= 1.8;       // fast
        hp *= 0.6;        // fragile
    }
    else if (t === 'roamer') {
        spd *= 1.3;
        hp *= 0.9;
    }
    enemies.push({
        x: t === 'roamer' ? -20 : wp[0].x,
        y: t === 'roamer' ? Math.random() * canvas.height : wp[0].y,
        wpIdx: 0,
        progress: 0,

        hp,
        maxHp: hp,
        spd,
        type: t,
        flying: t === 'flyer', // â­ IMPORTANT

        // â­ wave motion data
        waveOffset: Math.random() * Math.PI * 2,

        // reward: 10 + waveNum * 2, // high gold
        reward: 3 + waveNum, //low gold

        size: t === 'flyer' ? 12 :
            t === 'roamer' ? 13 :
                t === 'dino' ? 18 :
                    t === 'blob' ? 14 : 12,

        color: t === 'flyer' ? '#58d3ff' :
            t === 'roamer' ? '#f1c40f' :
                t === 'dino' ? '#9b59b6' :
                    t === 'blob' ? '#e67e22' : '#c0392b',
    });
}
