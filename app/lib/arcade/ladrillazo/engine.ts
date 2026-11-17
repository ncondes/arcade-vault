// Motor de Ladrillazo: el estado de partida de game.js, movido de globales a una
// instancia por canvas. Dos motores en la misma página no se pisan.
import type {
  ArcadeEngine,
  ArcadeEngineOptions,
  ArcadeSnapshot,
  ArcadeStatus,
} from "@/app/lib/arcade/types";
import { createKeyboard } from "@/app/lib/arcade/keyboard";
import {
  BALL_SIZE,
  BASE_BALL_VX,
  BASE_BALL_VY,
  BG,
  BLOCK_POINTS,
  type BlockColor,
  DT_MAX,
  EXPLOSION_DURATION,
  EXPLOSION_FRAME_COUNT,
  EXPLOSION_FRAMES,
  H,
  LAST_LEVEL,
  LIVES,
  PADDLE_CATCH,
  PADDLE_H,
  PADDLE_SPEED,
  PADDLE_W,
  PADDLE_Y,
  SCORE_MAX,
  SPRITES,
  SPRITESHEET_SRC,
  W,
} from "@/app/lib/arcade/ladrillazo/constants";
import { type Block, buildBlocks, levelSpeed } from "@/app/lib/arcade/ladrillazo/levels";
import { createSounds } from "@/app/lib/arcade/ladrillazo/sounds";
import { createSpritesheet } from "@/app/lib/arcade/ladrillazo/sprites";
type Explosion = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  /** ms transcurridos desde que se rompió el ladrillo. */
  elapsed: number;
};
export function createLadrillazoEngine({ canvas, onSnapshot }: ArcadeEngineOptions): ArcadeEngine {
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) throw new Error("Ladrillazo: el canvas no tiene contexto 2D");
  const ctx = ctxOrNull;
  // Búfer a la densidad de la pantalla; las coordenadas del juego siguen en W×H.
  // setTransform (no scale) para que sea idempotente.
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Después del setTransform (cambiar el tamaño del búfer reinicia el contexto):
  // pixel art nítido, sin suavizado.
  ctx.imageSmoothingEnabled = false;
  const keyboard = createKeyboard();
  const sounds = createSounds();
  // Al cargar la imagen se redibuja: antes de empezar, el tablero ya se ve con sprites.
  const sprites = createSpritesheet(SPRITESHEET_SRC, () => {
    if (!destroyed) draw();
  });
  // ── Estado de partida ──
  const paddle = { x: 0, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H };
  const ball = { x: 0, y: 0, w: BALL_SIZE, h: BALL_SIZE, vx: 0, vy: 0 };
  let blocks: Block[] = [];
  let explosions: Explosion[] = [];
  let score = 0;
  let lives = LIVES;
  let level = 1;
  // ── Estado del runtime ──
  let status: ArcadeStatus = "idle";
  let rafId: number | null = null;
  /** ms del fotograma anterior; `null` = primer fotograma tras arrancar o reanudar. */
  let lastTime: number | null = null;
  let destroyed = false;
  let lastSnapshot: ArcadeSnapshot | null = null;
  function publish() {
    const snap: ArcadeSnapshot = { score, lives, level, status };
    const prev = lastSnapshot;
    if (
      prev &&
      prev.score === snap.score &&
      prev.lives === snap.lives &&
      prev.level === snap.level &&
      prev.status === snap.status
    )
      return;
    lastSnapshot = snap;
    onSnapshot(snap);
  }
  /** Puntuación siempre entera y dentro del `check` de `scores`. */
  function addScore(points: number) {
    score = Math.min(SCORE_MAX, Math.floor(score + points));
  }
  // ── Reglas ──
  /** La bola, encima de la pala y a la velocidad del nivel. Sale al instante, sin
   *  saque: es el `initBall` del original. */
  function initBall() {
    const speed = levelSpeed(level);
    ball.x = paddle.x + (paddle.w - ball.w) / 2;
    ball.y = paddle.y - ball.h;
    ball.vx = BASE_BALL_VX * speed;
    ball.vy = BASE_BALL_VY * speed;
  }
  /** Carga el muro `n`. Como en el original, la pala no se recoloca. */
  function loadLevel(n: number) {
    level = n;
    blocks = buildBlocks(n);
    explosions = [];
    initBall();
  }
  function initGame() {
    score = 0;
    lives = LIVES;
    paddle.x = (W - paddle.w) / 2;
    loadLevel(1);
  }
  function collideAABB(block: Block) {
    return (
      ball.x < block.x + block.w &&
      ball.x + ball.w > block.x &&
      ball.y < block.y + block.h &&
      ball.y + ball.h > block.y
    );
  }
  /** Fin de partida: sin vidas, nivel 5 limpio o end(). */
  function gameOver() {
    status = "gameover";
    keyboard.detach();
    // El último estado queda en pantalla, también si se llega con end() desde la pausa.
    draw();
  }
  // ── Update ──
  /** `dt` en segundos, ya acotado a DT_MAX. El orden es el de `update` en game.js. */
  function update(dt: number) {
    if (status !== "playing") return;
    // 1. La pala con las flechas.
    if (keyboard.held("ArrowLeft")) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
    if (keyboard.held("ArrowRight"))
      paddle.x = Math.min(W - paddle.w, paddle.x + PADDLE_SPEED * dt);
    // 2. La bola se mueve.
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    // 3. Paredes: izquierda, derecha y techo. Cada rebote suena.
    if (ball.x <= 0) {
      ball.x = 0;
      ball.vx = Math.abs(ball.vx);
      sounds.bounce();
    }
    if (ball.x + ball.w >= W) {
      ball.x = W - ball.w;
      ball.vx = -Math.abs(ball.vx);
      sounds.bounce();
    }
    if (ball.y <= 0) {
      ball.y = 0;
      ball.vy = Math.abs(ball.vy);
      sounds.bounce();
    }
    // 4. La pala: solo invierte `vy`, en una ventana de h + PADDLE_CATCH px.
    if (
      ball.vy > 0 &&
      ball.x + ball.w > paddle.x &&
      ball.x < paddle.x + paddle.w &&
      ball.y + ball.h >= paddle.y &&
      ball.y + ball.h <= paddle.y + paddle.h + PADDLE_CATCH
    ) {
      ball.y = paddle.y - ball.h;
      ball.vy = -Math.abs(ball.vy);
      sounds.bounce();
    }
    // 5. Ladrillos: como mucho uno por fotograma, y solo invierte `vy`.
    for (const block of blocks) {
      if (!block.alive || !collideAABB(block)) continue;
      block.alive = false;
      explosions.push({
        x: block.x,
        y: block.y,
        w: block.w,
        h: block.h,
        color: block.color,
        elapsed: 0,
      });
      addScore(BLOCK_POINTS);
      ball.vy = -ball.vy;
      sounds.brick();
      if (blocks.every((b) => !b.alive)) {
        if (level < LAST_LEVEL) loadLevel(level + 1);
        else {
          // Victoria: `gameover` con la puntuación final; `level` se queda en 5.
          gameOver();
          return;
        }
      }
      break;
    }
    // 6. Explosiones.
    for (const exp of explosions) exp.elapsed += dt * 1000;
    explosions = explosions.filter((exp) => exp.elapsed < EXPLOSION_DURATION);
    // 7. La bola perdida.
    if (ball.y > H) {
      lives--;
      if (lives <= 0) {
        lives = 0;
        gameOver();
      } else {
        initBall();
      }
    }
  }
  // ── Entrada ──
  // Teclado: las flechas con `held()`, leídas en `update`. Ni `KeyP`, ni el `Escape`
  // propio, ni el clic del selector de nivel: la pausa es del envoltorio.
  /** Ratón: la pala queda centrada en el cursor. La coordenada se escala por
   *  `W / rect.width`, nunca por `canvas.width`, que con HiDPI vale `W · dpr`. Solo
   *  en `playing`: en pausa, en el game over y antes de empezar no mueve nada. */
  function onPointerMove(e: PointerEvent) {
    if (status !== "playing") return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const mouseX = ((e.clientX - rect.left) * W) / rect.width;
    paddle.x = Math.max(0, Math.min(W - paddle.w, mouseX - paddle.w / 2));
  }
  // ── Draw ──
  // El `draw` del original sin su HUD ni sus overlays: puntuación, vidas, nivel,
  // pausa y GAME OVER ya están en la pantalla de juego. Mientras la imagen no ha
  // cargado, `sprites.draw` no pinta nada y solo se ve el fondo.
  function draw() {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    for (const block of blocks) {
      if (block.alive)
        sprites.draw(ctx, SPRITES.blocks[block.color], block.x, block.y, block.w, block.h);
    }
    // 4 fotogramas repartidos en EXPLOSION_DURATION ms.
    for (const exp of explosions) {
      const frame = Math.min(
        Math.floor((exp.elapsed / EXPLOSION_DURATION) * EXPLOSION_FRAME_COUNT),
        EXPLOSION_FRAME_COUNT - 1
      );
      sprites.draw(ctx, EXPLOSION_FRAMES[exp.color][frame], exp.x, exp.y, exp.w, exp.h);
    }
    sprites.draw(ctx, SPRITES.paddle, paddle.x, paddle.y, paddle.w, paddle.h);
    sprites.draw(ctx, SPRITES.ball, ball.x, ball.y, ball.w, ball.h);
  }
  // ── Bucle ──
  function loop(ts: number) {
    rafId = null;
    if (destroyed) return;
    // Primer fotograma tras arrancar o reanudar: la tecla que arrancó la partida
    // aún burbujeaba hacia `window` cuando attach() añadió el listener, así que el
    // clear() de run() llega tarde. Se vuelve a limpiar aquí, antes de leer.
    if (lastTime === null) keyboard.clear();
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, DT_MAX);
    lastTime = ts;
    update(dt);
    draw();
    publish();
    if (status === "playing") schedule();
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
   *  fotograma no llega con el salto de una pausa larga. */
  function run() {
    status = "playing";
    lastTime = null;
    keyboard.attach();
    keyboard.clear();
    publish();
    schedule();
  }
  initGame();
  // El listener vive lo mismo que el motor: se añade aquí y destroy() lo quita.
  canvas.addEventListener("pointermove", onPointerMove);
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
      stopLoop();
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
      canvas.removeEventListener("pointermove", onPointerMove);
      sprites.dispose();
    },
  };
}
