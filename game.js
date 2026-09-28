'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedTimer    = 0;
    this.shieldTimer   = 0;
    this.shieldPulse   = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    -= dt;
    if (this.shieldTimer   > 0) {
      this.shieldTimer  -= dt;
      this.shieldPulse  += dt * 3;
    }

    const ROT   = 3.5;   // rad/s
    const THRUST = this.speedTimer > 0 ? 520 : 260;  // px/s² (2x with speed boost)
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = this.speedTimer > 0 ? '#00e5ff' : '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(this.speedTimer > 0 ? 10 : 6, this.speedTimer > 0 ? 22 : 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = this.speedTimer > 0 ? 'rgba(0, 229, 255, 0.9)' : 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    ctx.restore();

    // Campo de fuerza del escudo
    if (this.shieldTimer > 0) {
      if (!(this.shieldTimer < 2 && Math.floor(this.shieldTimer * 8) % 2 === 0)) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const pulse = Math.sin(this.shieldPulse) * 1.5;
        const shieldRadius = 22 + pulse;

        // Brillo interior y borde principal
        ctx.fillStyle   = 'rgba(0, 230, 118, 0.12)';
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Anillo exterior discontinuo
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.5)';
        ctx.lineWidth   = 1;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, shieldRadius + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
      }
    }
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color = null) {
    this.x  = x;
    this.y  = y;
    this.color = color;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = this.color ? `rgba(${this.color},${alpha.toFixed(2)})` : `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-up (Velocidad / Escudo) ─────────────────────────────────────────────
class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x      = x;
    this.y      = y;
    this.type   = type;
    this.radius = 12;
    this.ttl    = 10;
    this.dead   = false;

    const angle = rand(0, Math.PI * 2);
    const speed = rand(15, 35);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.pulse = 0;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.pulse += dt * 4;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo cuando está por expirar
    if (this.ttl < 2.5 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    const scale = 1 + Math.sin(this.pulse) * 0.15;
    ctx.scale(scale, scale);

    if (this.type === 'speed') {
      // Diamante cian
      ctx.strokeStyle = '#00e5ff';
      ctx.fillStyle   = 'rgba(0, 229, 255, 0.15)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(  0, -11);
      ctx.lineTo( 11,   0);
      ctx.lineTo(  0,  11);
      ctx.lineTo(-11,   0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Símbolo V de Velocidad
      ctx.fillStyle    = '#00e5ff';
      ctx.font         = 'bold 10px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('V', 0, 1);
    } else if (this.type === 'shield') {
      // Hexágono verde esmeralda
      ctx.strokeStyle = '#00e676';
      ctx.fillStyle   = 'rgba(0, 230, 118, 0.15)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const hx = Math.cos(a) * 11;
        const hy = Math.sin(a) * 11;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Símbolo S de Escudo (Shield)
      ctx.fillStyle    = '#00e676';
      ctx.font         = 'bold 10px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', 0, 1);
    }

    ctx.restore();
  }
}

// ── Estrella Fugaz (Shooting Star) ───────────────────────────────────────────
class ShootingStar {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 14;
    this.ttl = 4.5;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    if (this.ttl < 1.2 && Math.floor(this.ttl * 10) % 2 === 0) return;

    const angle = Math.atan2(this.vy, this.vx);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Cola luminosa degradada
    const tailGrad = ctx.createLinearGradient(0, 0, -45, 0);
    tailGrad.addColorStop(0, 'rgba(255, 245, 180, 0.9)');
    tailGrad.addColorStop(0.3, 'rgba(255, 190, 50, 0.6)');
    tailGrad.addColorStop(1, 'rgba(255, 120, 0, 0)');

    ctx.strokeStyle = tailGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-45, 0);
    ctx.stroke();

    // Núcleo de la cola
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-28, 0);
    ctx.stroke();

    // Cabeza: estrella dorada de 4 puntas
    ctx.fillStyle = '#fff7b2';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo( 10,   0);
    ctx.lineTo(  3,   3);
    ctx.lineTo(  0,  10);
    ctx.lineTo( -3,   3);
    ctx.lineTo(-10,   0);
    ctx.lineTo( -3,  -3);
    ctx.lineTo(  0, -10);
    ctx.lineTo(  3,  -3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Centro brillante
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups, shootingStars;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer, shootingStarTimer;

function spawnShootingStar() {
  const side = randInt(0, 3);
  let x, y, angle;
  const SPEED = 260;

  if (side === 0) {        // Arriba hacia abajo
    x = rand(60, W - 60);
    y = -20;
    angle = rand(Math.PI * 0.2, Math.PI * 0.8);
  } else if (side === 1) { // Abajo hacia arriba
    x = rand(60, W - 60);
    y = H + 20;
    angle = rand(-Math.PI * 0.8, -Math.PI * 0.2);
  } else if (side === 2) { // Izquierda hacia derecha
    x = -20;
    y = rand(60, H - 60);
    angle = rand(-Math.PI * 0.3, Math.PI * 0.3);
  } else {                 // Derecha hacia izquierda
    x = W + 20;
    y = rand(60, H - 60);
    angle = rand(Math.PI * 0.7, Math.PI * 1.3);
  }

  const vx = Math.cos(angle) * SPEED;
  const vy = Math.sin(angle) * SPEED;
  shootingStars.push(new ShootingStar(x, y, vx, vy));
}

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets       = [];
  asteroids     = [];
  particles     = [];
  powerups      = [];
  shootingStars = [];
  shootingStarTimer = rand(8, 12);
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  const currentSpeed = ship.speedTimer;
  const currentShield = ship.shieldTimer;
  ship.reset();
  ship.speedTimer  = currentSpeed;
  ship.shieldTimer = currentShield;
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8, color = null) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  ship.speedTimer  = 0;
  ship.shieldTimer = 0;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    shootingStars.forEach(s => s.update(dt));
    shootingStars = shootingStars.filter(s => !s.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Spawn periódico de estrella fugaz
  shootingStarTimer -= dt;
  if (shootingStarTimer <= 0) {
    if (shootingStars.length === 0) {
      spawnShootingStar();
    }
    shootingStarTimer = rand(12, 16);
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));
  shootingStars.forEach(s => s.update(dt));

  bullets       = bullets.filter(b => !b.dead);
  particles     = particles.filter(p => !p.dead);
  powerups      = powerups.filter(p => !p.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        if (Math.random() < 0.15 && powerups.length === 0) {
          const type = Math.random() < 0.5 ? 'speed' : 'shield';
          powerups.push(new PowerUp(a.x, a.y, type));
        }
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bala vs estrella fugaz
  for (const b of bullets) {
    for (const s of shootingStars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += 200;
        explode(s.x, s.y, 14);
      }
    }
  }
  shootingStars = shootingStars.filter(s => !s.dead);
  bullets       = bullets.filter(b => !b.dead);

  // Nave vs power-up
  if (!ship.dead) {
    for (const p of powerups) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        if (p.type === 'speed') {
          ship.speedTimer = 5;
          explode(p.x, p.y, 8);
        } else if (p.type === 'shield') {
          ship.shieldTimer = 8;
          explode(p.x, p.y, 8, '0, 230, 118');
        }
      }
    }
    powerups = powerups.filter(p => !p.dead);
  }

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    const shieldSplitAsteroids = [];
    for (const a of asteroids) {
      if (!a.dead && dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shieldTimer > 0) {
          a.dead = true;
          score += POINTS[a.size];
          explode(a.x, a.y, a.size * 5);
          explode(ship.x, ship.y, 8, '0, 230, 118');
          shieldSplitAsteroids.push(...a.split());
        } else {
          killShip();
          break;
        }
      }
    }
    if (shieldSplitAsteroids.length > 0) {
      asteroids = asteroids.filter(a => !a.dead).concat(shieldSplitAsteroids);
    }
  }

  // Nave vs estrella fugaz
  if (!ship.dead && ship.invincible <= 0) {
    for (const s of shootingStars) {
      if (!s.dead && dist(ship, s) < ship.radius + s.radius * 0.82) {
        if (ship.shieldTimer > 0) {
          s.dead = true;
          score += 200;
          explode(s.x, s.y, 14);
          explode(ship.x, ship.y, 8, '0, 230, 118');
        } else {
          killShip();
          break;
        }
      }
    }
    shootingStars = shootingStars.filter(s => !s.dead);
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  let hudY = 48;
  if (ship && ship.speedTimer > 0) {
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`VEL 2X  ${ship.speedTimer.toFixed(1)}s`, 14, hudY);
    hudY += 20;
  }

  if (ship && ship.shieldTimer > 0) {
    ctx.fillStyle = '#00e676';
    ctx.textAlign = 'left';
    ctx.fillText(`ESCUDO  ${ship.shieldTimer.toFixed(1)}s`, 14, hudY);
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  powerups.forEach(p => p.draw());
  shootingStars.forEach(s => s.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
