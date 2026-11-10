// Entidades de Asteroides, portadas de game.js. Cada una recibe el mundo (sus
// dimensiones) al construirse y el contexto 2D al dibujarse: nada de globales.
import type { Keyboard } from "@/app/lib/arcade/keyboard";
import { rand, randInt, wrap } from "@/app/lib/arcade/math";
import {
  ASTEROID_MAX_VERTS,
  ASTEROID_MIN_VERTS,
  ASTEROID_ROT_SPEED,
  ASTEROID_SPEED_JITTER,
  BULLET_RADIUS,
  BULLET_SPEED,
  BULLET_TTL,
  COLORS,
  DRAG,
  PARTICLE_MAX_LIFE,
  PARTICLE_MAX_SPEED,
  PARTICLE_MIN_LIFE,
  PARTICLE_MIN_SPEED,
  POWERUP_MAX_SPEED,
  POWERUP_MIN_SPEED,
  POWERUP_RADIUS,
  POWERUP_TTL,
  RADII,
  SHIP_INVINCIBLE,
  SHIP_NOSE,
  SHIP_RADIUS,
  SHIP_ROT,
  SHIP_THRUST,
  SHOOT_COOLDOWN,
  SPEEDS,
  TRIPLE_SPREAD,
} from "@/app/lib/arcade/asteroides/constants";
export type World = { width: number; height: number };
// ── Bullet ──
export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl = BULLET_TTL;
  radius = BULLET_RADIUS;
  dead = false;
  constructor(
    private world: World,
    x: number,
    y: number,
    angle: number
  ) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * BULLET_SPEED;
    this.vy = Math.sin(angle) * BULLET_SPEED;
  }
  update(dt: number) {
    // Excepción al port 1:1 (decidida jugando, ver spec 05): en el original la
    // bala envuelve como todo lo demás; aquí muere al salir del mundo.
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const { width, height } = this.world;
    if (this.x < 0 || this.x >= width || this.y < 0 || this.y >= height) this.dead = true;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = COLORS.bullet;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
// ── Asteroid ──
export class Asteroid {
  x: number;
  y: number;
  size: number;
  radius: number;
  dead = false;
  vx: number;
  vy: number;
  rotSpeed: number;
  rot: number;
  verts: [number, number][] = [];
  constructor(
    private world: World,
    x: number,
    y: number,
    size = 3
  ) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size];
    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-ASTEROID_SPEED_JITTER, ASTEROID_SPEED_JITTER);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-ASTEROID_ROT_SPEED, ASTEROID_ROT_SPEED);
    this.rot = rand(0, Math.PI * 2);
    // Polígono irregular
    const n = randInt(ASTEROID_MIN_VERTS, ASTEROID_MAX_VERTS);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }
  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, this.world.width);
    this.y = wrap(this.y + this.vy * dt, this.world.height);
    this.rot += this.rotSpeed * dt;
  }
  split(): Asteroid[] {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.world, this.x, this.y, this.size - 1),
      new Asteroid(this.world, this.x, this.y, this.size - 1),
    ];
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = COLORS.asteroid;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++) ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}
// ── PowerUp ──
export class PowerUp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius = POWERUP_RADIUS;
  ttl = POWERUP_TTL;
  dead = false;
  constructor(
    private world: World,
    x: number,
    y: number
  ) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(POWERUP_MIN_SPEED, POWERUP_MAX_SPEED);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }
  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, this.world.width);
    this.y = wrap(this.y + this.vy * dt, this.world.height);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }
  draw(ctx: CanvasRenderingContext2D) {
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;
    const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = COLORS.powerUp;
    ctx.lineWidth = 2;
    const r = this.radius * pulse;
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.restore();
    ctx.fillStyle = COLORS.powerUp;
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("3x", this.x, this.y);
  }
}
// ── Ship ──
export class Ship {
  x = 0;
  y = 0;
  angle = 0;
  vx = 0;
  vy = 0;
  radius = SHIP_RADIUS;
  thrusting = false;
  invincible = 0;
  shootCooldown = 0;
  tripleShot = 0;
  dead = false;
  constructor(private world: World) {
    this.reset();
  }
  reset() {
    this.x = this.world.width / 2;
    this.y = this.world.height / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.radius = SHIP_RADIUS;
    this.thrusting = false;
    this.invincible = SHIP_INVINCIBLE;
    this.shootCooldown = 0;
    this.dead = false;
  }
  update(dt: number, keyboard: Keyboard) {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.tripleShot > 0) this.tripleShot -= dt;
    if (keyboard.held("ArrowLeft")) this.angle -= SHIP_ROT * dt;
    if (keyboard.held("ArrowRight")) this.angle += SHIP_ROT * dt;
    this.thrusting = keyboard.held("ArrowUp");
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * SHIP_THRUST * dt;
      this.vy += Math.sin(this.angle) * SHIP_THRUST * dt;
    }
    // Única línea de física que cambia respecto a game.js: el original aplica
    // DRAG una vez por fotograma, así que frenaba el doble a 120 Hz. Elevado a
    // dt * 60 es idéntico a 60 Hz e independiente de la tasa de refresco.
    const drag = DRAG ** (dt * 60);
    this.vx *= drag;
    this.vy *= drag;
    this.x = wrap(this.x + this.vx * dt, this.world.width);
    this.y = wrap(this.y + this.vy * dt, this.world.height);
  }
  tryShoot(): Bullet[] {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = SHOOT_COOLDOWN;
    const ox = this.x + Math.cos(this.angle) * SHIP_NOSE;
    const oy = this.y + Math.sin(this.angle) * SHIP_NOSE;
    if (this.tripleShot > 0) {
      return [
        new Bullet(this.world, ox, oy, this.angle - TRIPLE_SPREAD),
        new Bullet(this.world, ox, oy, this.angle),
        new Bullet(this.world, ox, oy, this.angle + TRIPLE_SPREAD),
      ];
    }
    return [new Bullet(this.world, ox, oy, this.angle)];
  }
  draw(ctx: CanvasRenderingContext2D) {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = COLORS.ship;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo(20, 0); // nariz
    ctx.lineTo(-12, -9); // ala izquierda
    ctx.lineTo(-7, 0); // muesca trasera
    ctx.lineTo(-12, 9); // ala derecha
    ctx.closePath();
    ctx.stroke();
    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8, 4);
      ctx.strokeStyle = COLORS.thrust;
      ctx.stroke();
    }
    ctx.restore();
  }
}
// ── Partículas (explosión) ──
export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  dead = false;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(PARTICLE_MIN_SPEED, PARTICLE_MAX_SPEED);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(PARTICLE_MIN_LIFE, PARTICLE_MAX_LIFE);
    this.ttl = this.life;
  }
  update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }
  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(${COLORS.particleRgb}, ${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}
