document.querySelectorAll('.tower-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
        selectTower(btn.dataset.type);
    });

    btn.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('towerType', btn.dataset.type);
        towerPlacementDrag.active = true;
        towerPlacementDrag.type = btn.dataset.type;
        // Optional: select the tower when starting to drag
        selectTower(btn.dataset.type);
    });

    btn.addEventListener('dragend', () => {
        towerPlacementDrag.active = false;
        towerPlacementDrag.overCanvas = false;
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

//git push origin main
muteBtn.addEventListener('click', () => {
    muted = !muted;

    bgMusic.muted = muted;
    explosionSound.muted = muted;

    for (let key in shootSounds) {
        shootSounds[key].muted = muted;
    }
    //Mute button text update
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
