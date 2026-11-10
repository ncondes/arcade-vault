// Motor de Asteroides: el estado de partida de game.js, movido de globales a
// una instancia por canvas. Dos motores en la misma página no se pisan.
import type {
  ArcadeEngine,
  ArcadeEngineOptions,
  ArcadeSnapshot,
  ArcadeStatus,
} from "@/app/lib/arcade/types";
import { createKeyboard } from "@/app/lib/arcade/keyboard";
import { dist, rand } from "@/app/lib/arcade/math";
import {
  COLORS,
  DT_MAX,
  EXPLODE_DEFAULT,
  EXPLODE_PER_SIZE,
  EXPLODE_SHIP,
  FIRST_LEVEL_ASTEROIDS,
  H,
  LEVEL_ASTEROIDS_BASE,
  POINTS,
  POWERUP_DROP_CHANCE,
  POWERUP_DURATION,
  POWERUP_GUARANTEED_KILLS,
  RESPAWN_DELAY,
  SAFE_DIST,
  SHIP_HIT_FUDGE,
  START_LIVES,
  W,
} from "@/app/lib/arcade/asteroides/constants";
import {
  Asteroid,
  Bullet,
  Particle,
  PowerUp,
  Ship,
  type World,
} from "@/app/lib/arcade/asteroides/entities";
/** El estado interno del original. "dead" (esperando reaparecer) no sale fuera. */
type Phase = "playing" | "dead" | "gameover";
export function createAsteroidsEngine({ canvas, onSnapshot }: ArcadeEngineOptions): ArcadeEngine {
  const world: World = { width: W, height: H };
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) throw new Error("Asteroides: el canvas no tiene contexto 2D");
  const ctx = ctxOrNull;
  // Búfer a la densidad de la pantalla; las coordenadas del juego siguen en W×H.
  // setTransform (no scale) para que sea idempotente.
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const keyboard = createKeyboard();
  // ── Estado de partida ──
  let ship: Ship;
  let bullets: Bullet[];
  let asteroids: Asteroid[];
  let particles: Particle[];
  let powerUps: PowerUp[];
  let score: number;
  let lives: number;
  let level: number;
  let phase: Phase;
  let deadTimer = 0;
  let powerUpSpawned: boolean;
  let killsSinceSpawn: number;
  // ── Estado del runtime ──
  let status: ArcadeStatus = "idle";
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let destroyed = false;
  let lastSnapshot: ArcadeSnapshot | null = null;
  function publish() {
    const next: ArcadeSnapshot = { score, lives, level, status };
    const prev = lastSnapshot;
    if (
      prev &&
      prev.score === next.score &&
      prev.lives === next.lives &&
      prev.level === next.level &&
      prev.status === next.status
    )
      return;
    lastSnapshot = next;
    onSnapshot(next);
  }
  function spawnAsteroids(count: number) {
    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
      asteroids.push(new Asteroid(world, x, y, 3));
    }
  }
  function initGame() {
    ship = new Ship(world);
    bullets = [];
    asteroids = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    score = 0;
    lives = START_LIVES;
    level = 1;
    phase = "playing";
    spawnAsteroids(FIRST_LEVEL_ASTEROIDS);
  }
  function nextLevel() {
    level++;
    bullets = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    ship.reset();
    spawnAsteroids(LEVEL_ASTEROIDS_BASE + level);
  }
  function explode(x: number, y: number, count = EXPLODE_DEFAULT) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
  }
  function killShip() {
    explode(ship.x, ship.y, EXPLODE_SHIP);
    ship.dead = true;
    lives--;
    if (lives <= 0) {
      gameOver();
    } else {
      phase = "dead";
      deadTimer = RESPAWN_DELAY;
    }
  }
  /** Fin de partida, por vidas o por end(). El bucle sigue hasta que se apagan
   *  las partículas; el reinicio ya no es con ESPACIO sino con restart(). */
  function gameOver() {
    phase = "gameover";
    status = "gameover";
    keyboard.detach();
  }
  // ── Update ──
  function update(dt: number) {
    if (phase === "gameover") {
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      return;
    }
    if (phase === "dead") {
      deadTimer -= dt;
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      asteroids.forEach((a) => a.update(dt));
      if (deadTimer <= 0) {
        phase = "playing";
        ship.reset();
      }
      return;
    }
    // Disparar
    if (keyboard.pressed("Space")) {
      bullets.push(...ship.tryShoot());
    }
    ship.update(dt, keyboard);
    bullets.forEach((b) => b.update(dt));
    asteroids.forEach((a) => a.update(dt));
    particles.forEach((p) => p.update(dt));
    powerUps.forEach((p) => p.update(dt));
    bullets = bullets.filter((b) => !b.dead);
    particles = particles.filter((p) => !p.dead);
    powerUps = powerUps.filter((p) => !p.dead);
    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.tripleShot = POWERUP_DURATION;
      }
    }
    // Bala vs asteroide
    const newAsteroids: Asteroid[] = [];
    for (const b of bullets) {
      for (const a of asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          score += POINTS[a.size];
          explode(a.x, a.y, a.size * EXPLODE_PER_SIZE);
          newAsteroids.push(...a.split());
          if (!powerUpSpawned) {
            killsSinceSpawn++;
            const guaranteed = killsSinceSpawn >= POWERUP_GUARANTEED_KILLS;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              powerUps.push(new PowerUp(world, a.x, a.y));
              powerUpSpawned = true;
            }
          }
        }
      }
    }
    asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
    bullets = bullets.filter((b) => !b.dead);
    // Nave vs asteroide
    if (ship.invincible <= 0) {
      for (const a of asteroids) {
        if (dist(ship, a) < ship.radius + a.radius * SHIP_HIT_FUDGE) {
          killShip();
          break;
        }
      }
    }
    // Nivel completado
    if (asteroids.length === 0) nextLevel();
  }
  // ── Draw ──
  // Del HUD del original solo queda el contador 3x: puntuación, nivel, vidas y
  // GAME OVER ya están en el DOM de la pantalla de juego.
  function drawTripleShot() {
    if (ship.tripleShot <= 0) return;
    ctx.font = "15px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.powerUp;
    ctx.fillText(`3x  ${ship.tripleShot.toFixed(1)}s`, 14, 26);
  }
  function draw() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, W, H);
    particles.forEach((p) => p.draw(ctx));
    asteroids.forEach((a) => a.draw(ctx));
    powerUps.forEach((p) => p.draw(ctx));
    bullets.forEach((b) => b.draw(ctx));
    ship.draw(ctx);
    drawTripleShot();
  }
  // ── Bucle ──
  function loop(ts: number) {
    rafId = null;
    if (destroyed) return;
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, DT_MAX);
    lastTime = ts;
    update(dt);
    draw();
    publish();
    // En gameover se sigue pintando solo hasta que se apagan las partículas.
    const keepGoing = status === "playing" || (status === "gameover" && particles.length > 0);
    if (keepGoing) schedule();
  }
  function schedule() {
    if (rafId !== null || destroyed) return;
    rafId = requestAnimationFrame(loop);
  }
  function stopLoop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  }
  /** Al arrancar o reanudar, la referencia de tiempo se reinicia: así el primer
   *  fotograma no llega con el salto de minutos de una pestaña oculta. */
  function run() {
    status = "playing";
    lastTime = null;
    keyboard.attach();
    publish();
    schedule();
  }
  initGame();
  draw();
  publish();
  return {
    start() {
      if (destroyed || status !== "idle") return;
      run();
    },
    pause() {
      if (destroyed || status !== "playing") return;
      status = "paused";
      stopLoop();
      // detach también limpia las teclas: al reanudar no queda ninguna pulsada.
      keyboard.detach();
      publish();
    },
    resume() {
      if (destroyed || status !== "paused") return;
      run();
    },
    end() {
      if (destroyed || (status !== "playing" && status !== "paused")) return;
      gameOver();
      publish();
    },
    restart() {
      if (destroyed) return;
      stopLoop();
      initGame();
      draw();
      run();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopLoop();
      keyboard.detach();
    },
  };
}
