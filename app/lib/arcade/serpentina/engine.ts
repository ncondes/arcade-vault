// Motor de Serpentina (spec 09). Todo el estado de partida vive en la instancia:
// dos motores en la misma página no se pisan.
import type {
  ArcadeEngine,
  ArcadeEngineOptions,
  ArcadeSnapshot,
  ArcadeStatus,
} from "@/app/lib/arcade/types";
import { createKeyboard } from "@/app/lib/arcade/keyboard";
import { randInt } from "@/app/lib/arcade/math";
import {
  CELL,
  COLORS,
  COLS,
  DEAD_MIX,
  DIR_KEYS,
  DT_MAX,
  EYE_FORWARD,
  EYE_SIZE,
  EYE_SPREAD,
  FRUIT_POINTS,
  FRUIT_SIZE,
  FRUITS_PER_LEVEL,
  GOLDEN_BAR_H,
  GOLDEN_BLINK_AT,
  GOLDEN_BLINK_HZ,
  GOLDEN_DURATION,
  GOLDEN_POINTS,
  GOLDEN_SIZE,
  H,
  MARK_INSET,
  MARK_WIDTH,
  NECK_INSET,
  ROWS,
  SCORE_MAX,
  SNAKE_GLOW_BLUR,
  SNAKE_INSET,
  START_DIR,
  START_HEAD,
  START_LENGTH,
  STEP_EPSILON,
  TURN_QUEUE,
  W,
} from "@/app/lib/arcade/serpentina/constants";
import {
  type Cell,
  type Dir,
  freeCells,
  hitsBody,
  hitsWall,
  nextHead,
  OPPOSITE,
  sameCell,
  stepsPerSecond,
} from "@/app/lib/arcade/serpentina/board";
import {
  drawFruit,
  drawGoldenFruit,
  FRUIT_KINDS,
  type FruitKind,
} from "@/app/lib/arcade/serpentina/sprites";
type Fruit = { cell: Cell; kind: FruitKind };
type Golden = { cell: Cell; remaining: number };
const DIRS = Object.keys(DIR_KEYS) as Dir[];
export function createSerpentinaEngine({ canvas, onSnapshot }: ArcadeEngineOptions): ArcadeEngine {
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) throw new Error("Serpentina: el canvas no tiene contexto 2D");
  const ctx = ctxOrNull;
  // Búfer a la densidad de la pantalla; las coordenadas del juego siguen en W×H.
  // setTransform (no scale) para que sea idempotente.
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const keyboard = createKeyboard();
  // ── Estado de partida ──
  /** Cabeza primero. */
  let snake: Cell[];
  let dir: Dir;
  /** Giros pendientes, como mucho TURN_QUEUE; se aplica uno por paso. */
  let turns: Dir[];
  let fruit: Fruit;
  let golden: Golden | null;
  let fruitsInLevel: number;
  let score: number;
  let level: number;
  /** Murió por choque (no por end() ni por victoria): se dibuja atenuada y con ✕. */
  let dead: boolean;
  /** Segundos acumulados hacia el siguiente paso. */
  let acc: number;
  // ── Estado del runtime ──
  let status: ArcadeStatus = "idle";
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let destroyed = false;
  let lastSnapshot: ArcadeSnapshot | null = null;
  function publish() {
    const snap: ArcadeSnapshot = { score, lives: null, level, status };
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
  function initGame() {
    snake = [];
    for (let i = 0; i < START_LENGTH; i++) snake.push({ x: START_HEAD.x - i, y: START_HEAD.y });
    dir = START_DIR;
    turns = [];
    golden = null;
    fruitsInLevel = 0;
    score = 0;
    level = 1;
    dead = false;
    acc = 0;
    // Al empezar siempre queda sitio: la fruta inicial nunca es la victoria.
    spawnFruit();
  }
  /** Puntuación siempre entera y dentro del `check` de `scores`. */
  function addScore(points: number) {
    score = Math.max(0, Math.min(SCORE_MAX, Math.floor(score + points)));
  }
  const pick = <T>(list: readonly T[]): T => list[randInt(0, list.length - 1)];
  // ── Reglas ──
  /** Una fruta normal en una celda libre al azar, sacada de la lista de libres (no por
   *  reintentos). Sin celdas libres, la partida se gana. Devuelve si pudo colocarla. */
  function spawnFruit(): boolean {
    const free = freeCells(snake, golden ? [golden.cell] : []);
    if (free.length === 0) return false;
    fruit = { cell: pick(free), kind: pick(FRUIT_KINDS) };
    return true;
  }
  /** La dorada en otra celda libre. Sustituye a la que hubiera. Se salta si no queda
   *  ninguna celda libre aparte de la de la fruta normal. */
  function spawnGolden() {
    golden = null;
    const free = freeCells(snake, [fruit.cell]);
    if (free.length === 0) return;
    golden = { cell: pick(free), remaining: GOLDEN_DURATION };
  }
  function step() {
    const turn = turns.shift();
    if (turn) dir = turn;
    const head = nextHead(snake[0], dir);
    const growing = sameCell(head, fruit.cell);
    if (hitsWall(head) || hitsBody(head, snake, growing)) {
      dead = true;
      gameOver();
      return;
    }
    snake.unshift(head);
    if (!growing) snake.pop();
    // La fruta normal primero: puede subir el nivel y traer una dorada nueva.
    if (growing) {
      addScore(FRUIT_POINTS * level);
      fruitsInLevel++;
      const levelUp = fruitsInLevel === FRUITS_PER_LEVEL;
      if (levelUp) {
        fruitsInLevel = 0;
        level++;
        // La dorada que hubiera se sustituye: su celda vuelve a estar libre.
        golden = null;
      }
      if (!spawnFruit()) {
        gameOver();
        return;
      }
      if (levelUp) spawnGolden();
    }
    if (golden && sameCell(head, golden.cell)) {
      addScore(GOLDEN_POINTS * level);
      golden = null;
    }
  }
  /** Fin de partida: choque, victoria o end(). */
  function gameOver() {
    status = "gameover";
    keyboard.detach();
    // El último estado queda en pantalla.
    draw();
  }
  // ── Entrada ──
  /** Un giro entra en la cola si hay hueco y no es igual ni contrario a la última
   *  dirección de la cola (o a `dir`, si está vacía). */
  function queueTurn(next: Dir) {
    if (turns.length >= TURN_QUEUE) return;
    const last = turns.length > 0 ? turns[turns.length - 1] : dir;
    if (next === last || next === OPPOSITE[last]) return;
    turns.push(next);
  }
  /** Los giros usan `pressed()`: una vez por pulsación, sin la autorrepetición del
   *  sistema, así que mantener la tecla no repite el giro ni llena la cola. */
  function handleInput() {
    // `map` antes de `includes`: se leen (y consumen) las dos teclas de cada dirección.
    for (const d of DIRS)
      if (DIR_KEYS[d].map((code) => keyboard.pressed(code)).includes(true)) queueTurn(d);
  }
  // ── Update ──
  /** `dt` en segundos, acotado a DT_MAX. El paso va por acumulador (`acc -= interval`),
   *  así avanza igual a cualquier tasa de refresco; con el tope de 18 pasos/s y
   *  dt ≤ 0.05 s hay como mucho un paso por fotograma. */
  function update(rawDt: number) {
    handleInput();
    const dt = Math.min(rawDt, DT_MAX);
    if (golden) {
      golden.remaining -= dt;
      if (golden.remaining <= 0) golden = null;
    }
    acc += dt;
    let interval = 1 / stepsPerSecond(level);
    // STEP_EPSILON: el paso que toca justo en este fotograma no se retrasa al siguiente
    // porque el redondeo de coma flotante deje `acc` a 1e-15 s del intervalo.
    while (status === "playing" && acc >= interval - STEP_EPSILON) {
      acc -= interval;
      step();
      interval = 1 / stepsPerSecond(level);
    }
  }
  // ── Draw ──
  /** La rejilla, de un píxel y desplazada 0.5 para que quede nítida. */
  function drawGrid() {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 1; c < COLS; c++) {
      ctx.moveTo(c * CELL + 0.5, 0);
      ctx.lineTo(c * CELL + 0.5, H);
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.moveTo(0, r * CELL + 0.5);
      ctx.lineTo(W, r * CELL + 0.5);
    }
    ctx.stroke(); // El borde del tablero es un muro que mata: una línea fina por dentro del lienzo.
    ctx.strokeStyle = COLORS.wall;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
  }
  /** Mezcla dos colores `#rrggbb`: t = 0 es `a`, t = 1 es `b`. */
  function mix(a: string, b: string, t: number): string {
    const ch = (hex: string, i: number) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16);
    let out = "#";
    for (let i = 0; i < 3; i++)
      out += Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t)
        .toString(16)
        .padStart(2, "0");
    return out;
  }
  /** Color del segmento i: del cuello (brillante) a la cola (más honda), como en la
   *  portada. Al morir, cada color se apaga hacia el fondo. */
  function segmentColor(i: number): string {
    const t = snake.length > 1 ? i / (snake.length - 1) : 0;
    const c = i === 0 ? COLORS.head : mix(COLORS.snake, COLORS.tail, t);
    return dead ? mix(COLORS.bg, c, DEAD_MIX) : c;
  }
  /** Cada segmento es una cuenta: un cuadrado con margen, unido al siguiente por un
   *  cuello más estrecho. Así se cuentan los segmentos y se ven los giros. Debajo, una
   *  pasada con resplandor de neón sobre toda la silueta (una sola sombra por fotograma). */
  function drawSnake() {
    const inner = CELL - 2 * SNAKE_INSET;
    const neck = CELL - 2 * NECK_INSET;
    if (!dead) {
      ctx.save();
      ctx.shadowColor = COLORS.glow;
      ctx.shadowBlur = SNAKE_GLOW_BLUR;
      ctx.fillStyle = COLORS.tail;
      ctx.beginPath();
      for (const c of snake)
        ctx.rect(c.x * CELL + SNAKE_INSET, c.y * CELL + SNAKE_INSET, inner, inner);
      ctx.fill();
      ctx.restore();
    }
    // De la cola a la cabeza: cada cuenta tapa el extremo del cuello que llega a ella.
    for (let i = snake.length - 1; i >= 0; i--) {
      const a = snake[i];
      ctx.fillStyle = segmentColor(i);
      if (i > 0) {
        const b = snake[i - 1];
        const x = Math.min(a.x, b.x) * CELL + NECK_INSET;
        const y = Math.min(a.y, b.y) * CELL + NECK_INSET;
        ctx.fillRect(x, y, neck + Math.abs(a.x - b.x) * CELL, neck + Math.abs(a.y - b.y) * CELL);
      }
      ctx.fillRect(a.x * CELL + SNAKE_INSET, a.y * CELL + SNAKE_INSET, inner, inner);
    }
    const head = snake[0];
    const hx = head.x * CELL;
    const hy = head.y * CELL;
    // Los ojos miran hacia `dir`: adelantados en esa dirección y separados a los lados.
    const f = nextHead({ x: 0, y: 0 }, dir);
    const cx = hx + CELL / 2;
    const cy = hy + CELL / 2;
    ctx.fillStyle = COLORS.eyes;
    for (const side of [-1, 1]) {
      const ex = cx + f.x * EYE_FORWARD + f.y * side * EYE_SPREAD;
      const ey = cy + f.y * EYE_FORWARD + f.x * side * EYE_SPREAD;
      ctx.fillRect(
        Math.round(ex - EYE_SIZE / 2),
        Math.round(ey - EYE_SIZE / 2),
        EYE_SIZE,
        EYE_SIZE
      );
    }
  }
  /** La ✕ sobre la cabeza al morir, con un trazo oscuro debajo para que se lea. */
  function drawDeathMark() {
    const x = snake[0].x * CELL + MARK_INSET;
    const y = snake[0].y * CELL + MARK_INSET;
    const s = CELL - 2 * MARK_INSET;
    ctx.lineCap = "square";
    for (const [color, width] of [
      [COLORS.bg, MARK_WIDTH + 2],
      [COLORS.deadMark, MARK_WIDTH],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + s, y + s);
      ctx.moveTo(x + s, y);
      ctx.lineTo(x, y + s);
      ctx.stroke();
    }
    ctx.lineCap = "butt";
  }
  /** La dorada: más grande, con contorno y una barra de tiempo en el borde inferior de su
   *  celda. En su último segundo parpadea a GOLDEN_BLINK_HZ (encendida y apagada a partes
   *  iguales); la barra no parpadea. */
  function drawGolden(g: Golden) {
    const x = g.cell.x * CELL;
    const y = g.cell.y * CELL;
    const blinkOff =
      g.remaining <= GOLDEN_BLINK_AT && Math.floor(g.remaining * GOLDEN_BLINK_HZ * 2) % 2 === 1;
    if (!blinkOff) drawGoldenFruit(ctx, x, y, GOLDEN_SIZE);
    ctx.fillStyle = COLORS.goldenBarTrack;
    ctx.fillRect(x, y + CELL - GOLDEN_BAR_H, CELL, GOLDEN_BAR_H);
    ctx.fillStyle = COLORS.golden;
    const w = Math.max(0, Math.round((CELL * g.remaining) / GOLDEN_DURATION));
    ctx.fillRect(x, y + CELL - GOLDEN_BAR_H, w, GOLDEN_BAR_H);
  }
  function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);
    drawGrid();
    const pad = (CELL - FRUIT_SIZE) / 2;
    drawFruit(ctx, fruit.kind, fruit.cell.x * CELL + pad, fruit.cell.y * CELL + pad, FRUIT_SIZE);
    if (golden) drawGolden(golden);
    // Al morir no hay parpadeo: la serpiente queda atenuada (colores sólidos, no
    // globalAlpha, que oscurecería distinto los solapes de segmentos y puentes) y con
    // una ✕ sobre la cabeza.
    drawSnake();
    if (dead) drawDeathMark();
  }
  // ── Bucle ──
  function loop(ts: number) {
    rafId = null;
    if (destroyed) return;
    // Primer fotograma tras arrancar o reanudar: la tecla que arrancó la partida
    // aún burbujeaba hacia `window` cuando attach() añadió el listener, así que el
    // clear() de run() llega tarde. Se vuelve a limpiar aquí, antes de leer.
    if (lastTime === null) keyboard.clear();
    const dt = lastTime === null ? 0 : (ts - lastTime) / 1000;
    lastTime = ts;
    update(dt);
    if (status === "playing") draw();
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
    },
  };
}
