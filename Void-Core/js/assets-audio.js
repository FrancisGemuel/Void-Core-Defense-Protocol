const enemyImages = {
    blob: new Image(),
    dino: new Image(),
    bug: new Image(),
    flyer: new Image()
};
enemyImages.blob.src = "assets/sprite-sheets/blob.png";
enemyImages.dino.src = "assets/sprite-sheets/dino.png";
enemyImages.bug.src = "assets/sprite-sheets/bug.png";
enemyImages.flyer.src = "assets/sprite-sheets/flyer.png";
const towerImages = {
    sniper: new Image(),
    flamer: new Image(),
    tank: new Image(),
    drone: new Image(),
    barracks: new Image()
};
towerImages.sniper.src = "assets/towers/sniper.png";
towerImages.flamer.src = "assets/towers/flamer.png";
towerImages.tank.src = "assets/towers/mech.png"; // assuming mech = tank
towerImages.drone.src = "assets/towers/drone.png";
towerImages.barracks.src = "assets/towers/drone.png";

const decorImages = {
    tree: new Image(),
    bush: new Image()
};
decorImages.tree.src = "assets/decor/tree.png";
decorImages.bush.src = "assets/decor/bush.png";

const baseImg = new Image();
baseImg.src = "assets/decor/base.png";

const heroImg = new Image();
heroImg.src = "assets/sprite-sheets/shooter.png";

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

// Mute Toggle
let muted = false;
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

