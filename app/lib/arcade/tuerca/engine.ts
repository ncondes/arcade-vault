// Motor de Tuerca: el estado de partida de game.js, movido de globales a una
// instancia por canvas. Dos motores en la misma página no se pisan.
import type {
  ArcadeEngine,
  ArcadeEngineOptions,
  ArcadeSnapshot,
  ArcadeStatus,
} from "@/app/lib/arcade/types";
import { createKeyboard } from "@/app/lib/arcade/keyboard";
import {
  BG,
  BLOCK,
  BOARD_X,
  BOARD_Y,
  COLORS,
  COLS,
  DIGIT_GLYPHS,
  DIGIT_PX,
  DROP_MIN,
  DROP_START,
  DROP_STEP,
  FONT_FAMILY,
  GHOST_ALPHA,
  GHOST_STROKE,
  GLOW_BLUR,
  GRID,
  H,
  HARD_DROP_POINTS,
  HIGHLIGHT,
  HIGHLIGHT_H,
  LABEL_SIZE,
  LABEL_TRACKING,
  LINE_SCORES,
  LINES_BOX_H,
  LINES_COLOR,
  LINES_PER_LEVEL,
  PANEL_BORDER,
  PANEL_BOX_W,
  PANEL_BOX_Y,
  PANEL_LABEL,
  PANEL_LABEL_Y,
  PREVIEW_CELLS,
  ROWS,
  SCORE_MAX,
  SHADE,
  SHADE_H,
  SOFT_DROP_POINTS,
  W,
  WELL_BG,
  WELL_GLOW,
  WELL_WALL,
} from "@/app/lib/arcade/tuerca/constants";
import {
  type Board,
  type Cell,
  type Piece,
  clearLines,
  collide,
  createBoard,
  ghostY,
  merge,
  randomPiece,
  tryRotate,
} from "@/app/lib/arcade/tuerca/board";
export function createTuercaEngine({ canvas, onSnapshot }: ArcadeEngineOptions): ArcadeEngine {
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) throw new Error("Tuerca: el canvas no tiene contexto 2D");
  const ctx = ctxOrNull;
  // Búfer a la densidad de la pantalla; las coordenadas del juego siguen en W×H.
  // setTransform (no scale) para que sea idempotente.
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const keyboard = createKeyboard();
  // ── Estado de partida ──
  let board: Board;
  let current: Piece;
  let next: Piece;
  let score: number;
  let lines: number;
  let level: number;
  let dropInterval: number;
  let dropAcc: number;
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
    board = createBoard();
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = DROP_START;
    dropAcc = 0;
    next = randomPiece();
    spawn();
  }
  /** Puntuación siempre entera y dentro del `check` de `scores`. */
  function addScore(points: number) {
    score = Math.min(SCORE_MAX, Math.floor(score + points));
  }
  // ── Reglas ──
  function spawn() {
    current = next;
    next = randomPiece();
    if (collide(board, current.shape, current.x, current.y)) gameOver();
  }
  function lockPiece() {
    merge(board, current);
    const cleared = clearLines(board);
    if (cleared) {
      lines += cleared;
      addScore((LINE_SCORES[cleared] ?? 0) * level);
      level = Math.floor(lines / LINES_PER_LEVEL) + 1;
      dropInterval = Math.max(DROP_MIN, DROP_START - (level - 1) * DROP_STEP);
    }
    spawn();
  }
  function move(dx: number) {
    if (!collide(board, current.shape, current.x + dx, current.y)) current.x += dx;
  }
  function rotate() {
    tryRotate(board, current);
  }
  function softDrop() {
    if (!collide(board, current.shape, current.x, current.y + 1)) {
      current.y++;
      addScore(SOFT_DROP_POINTS);
    } else {
      lockPiece();
    }
  }
  function hardDrop() {
    const gy = ghostY(board, current);
    addScore((gy - current.y) * HARD_DROP_POINTS);
    current.y = gy;
    lockPiece();
  }
  /** Fin de partida, al chocar la pieza nueva al aparecer o por end(). */
  function gameOver() {
    status = "gameover";
    keyboard.detach();
    // El último estado queda en pantalla: la pieza fijada y la nueva, solapada.
    draw();
  }
  // ── Entrada ──
  /** Mover, bajar y rotar usan `typed()`: cada keydown cuenta, autorrepetición del
   *  sistema incluida, como el original. El hard drop usa `pressed()`: mantener el
   *  Espacio suelta una sola pieza. Ni `KeyP` ni ninguna otra tecla del original. */
  function handleInput() {
    const left = keyboard.typed("ArrowLeft");
    const right = keyboard.typed("ArrowRight");
    const down = keyboard.typed("ArrowDown");
    const turns = keyboard.typed("ArrowUp") + keyboard.typed("KeyX");
    const drop = keyboard.pressed("Space");
    for (let i = 0; i < left; i++) move(-1);
    for (let i = 0; i < right; i++) move(1);
    for (let i = 0; i < turns; i++) rotate();
    for (let i = 0; i < down && status === "playing"; i++) softDrop();
    if (drop && status === "playing") hardDrop();
  }
  // ── Update ──
  /** Gravedad con acumulador: resta el intervalo en lugar de ponerlo a cero, así
   *  cae igual a cualquier tasa de refresco. Como mucho una fila por fotograma, y
   *  el resto acotado al intervalo para que un tirón no deje una ráfaga. */
  function update(dt: number) {
    handleInput();
    if (status !== "playing") return;
    dropAcc += dt;
    if (dropAcc >= dropInterval) {
      dropAcc -= dropInterval;
      dropAcc = Math.min(dropAcc, dropInterval);
      if (!collide(board, current.shape, current.x, current.y + 1)) current.y++;
      else lockPiece();
    }
  }
  // ── Draw ──
  // Del HUD del DOM del original solo quedan LÍNEAS y SIGUIENTE, dibujados aquí:
  // puntuación, nivel, pausa y GAME OVER ya están en la pantalla de juego.
  const WELL_W = COLS * BLOCK;
  const WELL_H = ROWS * BLOCK;
  /** Centros de las franjas de 250 px a cada lado del pozo. */
  const LEFT_CX = BOARD_X / 2;
  const RIGHT_CX = BOARD_X + WELL_W + (W - BOARD_X - WELL_W) / 2;
  /** Una celda en (x, y) px de lienzo: relleno con brillo arriba y sombra abajo, o,
   *  para la fantasma, relleno translúcido con contorno. */
  function drawBlock(x: number, y: number, cell: Cell, ghost = false) {
    if (!cell) return;
    const color = COLORS[cell] ?? BG;
    if (ghost) {
      ctx.globalAlpha = GHOST_ALPHA;
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y + 1, BLOCK - 2, BLOCK - 2);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = GHOST_STROKE;
      const inset = 1 + GHOST_STROKE / 2;
      ctx.strokeRect(x + inset, y + inset, BLOCK - 2 * inset, BLOCK - 2 * inset);
      return;
    }
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, BLOCK - 2, BLOCK - 2);
    ctx.fillStyle = HIGHLIGHT;
    ctx.fillRect(x + 1, y + 1, BLOCK - 2, HIGHLIGHT_H);
    ctx.fillStyle = SHADE;
    ctx.fillRect(x + 1, y + BLOCK - 1 - SHADE_H, BLOCK - 2, SHADE_H);
  }
  function drawShape(shape: Cell[][], x: number, y: number, ghost = false) {
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        drawBlock(x + c * BLOCK, y + r * BLOCK, shape[r][c], ghost);
  }
  /** El pozo: fondo un punto más claro, rejilla teñida y paredes con resplandor. */
  function drawWell() {
    ctx.fillStyle = WELL_BG;
    ctx.fillRect(BOARD_X, BOARD_Y, WELL_W, WELL_H);
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    ctx.beginPath();
    // +0.5: líneas de 1 px nítidas sobre la rejilla de píxeles.
    for (let c = 1; c < COLS; c++) {
      const x = BOARD_X + c * BLOCK + 0.5;
      ctx.moveTo(x, BOARD_Y);
      ctx.lineTo(x, BOARD_Y + WELL_H);
    }
    for (let r = 1; r < ROWS; r++) {
      const y = BOARD_Y + r * BLOCK + 0.5;
      ctx.moveTo(BOARD_X, y);
      ctx.lineTo(BOARD_X + WELL_W, y);
    }
    ctx.stroke();
    ctx.strokeStyle = WELL_WALL;
    ctx.lineWidth = 2;
    ctx.shadowColor = WELL_GLOW;
    ctx.shadowBlur = GLOW_BLUR;
    ctx.beginPath();
    ctx.moveTo(BOARD_X - 1, BOARD_Y);
    ctx.lineTo(BOARD_X - 1, BOARD_Y + WELL_H);
    ctx.moveTo(BOARD_X + WELL_W + 1, BOARD_Y);
    ctx.lineTo(BOARD_X + WELL_W + 1, BOARD_Y + WELL_H);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  /** Etiqueta centrada en cx, letra a letra para poder espaciarla. */
  function drawLabel(text: string, cx: number) {
    ctx.font = `${LABEL_SIZE}px ${FONT_FAMILY}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = PANEL_LABEL;
    const chars = [...text];
    const widths = chars.map((ch) => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + LABEL_TRACKING * (chars.length - 1);
    let x = cx - total / 2;
    chars.forEach((ch, i) => {
      ctx.fillText(ch, x, PANEL_LABEL_Y);
      x += widths[i] + LABEL_TRACKING;
    });
  }
  function drawPanelBox(cx: number, h: number) {
    ctx.strokeStyle = PANEL_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - PANEL_BOX_W / 2 - 0.5, PANEL_BOX_Y - 0.5, PANEL_BOX_W + 1, h + 1);
  }
  /** Un número hecho de celdas: dígitos de 3×5, separados por una celda. */
  function drawPixelNumber(value: number, cx: number, cy: number) {
    const digits = String(value).split("").map(Number);
    const digitW = 3 * DIGIT_PX;
    const total = digits.length * digitW + (digits.length - 1) * DIGIT_PX;
    let x = Math.round(cx - total / 2);
    const y = Math.round(cy - (5 * DIGIT_PX) / 2);
    ctx.fillStyle = LINES_COLOR;
    ctx.shadowColor = LINES_COLOR;
    ctx.shadowBlur = GLOW_BLUR;
    for (const d of digits) {
      const glyph = DIGIT_GLYPHS[d];
      for (let r = 0; r < 5; r++)
        for (let c = 0; c < 3; c++)
          if (glyph[r][c] === "1")
            ctx.fillRect(x + c * DIGIT_PX, y + r * DIGIT_PX, DIGIT_PX - 1, DIGIT_PX - 1);
      x += digitW + DIGIT_PX;
    }
    ctx.shadowBlur = 0;
  }
  function drawLinesPanel() {
    drawLabel("LÍNEAS", LEFT_CX);
    drawPanelBox(LEFT_CX, LINES_BOX_H);
    drawPixelNumber(lines, LEFT_CX, PANEL_BOX_Y + LINES_BOX_H / 2);
  }
  /** La siguiente pieza en su caja de 4×4 celdas, centrada por sus celdas ocupadas
   *  (no por su matriz: la I tiene filas vacías y quedaría descolgada). */
  function drawNextPanel() {
    const size = PREVIEW_CELLS * BLOCK;
    drawLabel("SIGUIENTE", RIGHT_CX);
    drawPanelBox(RIGHT_CX, size);
    const shape = next.shape;
    let minR = Infinity;
    let maxR = -Infinity;
    let minC = Infinity;
    let maxC = -Infinity;
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) {
          minR = Math.min(minR, r);
          maxR = Math.max(maxR, r);
          minC = Math.min(minC, c);
          maxC = Math.max(maxC, c);
        }
    const w = (maxC - minC + 1) * BLOCK;
    const h = (maxR - minR + 1) * BLOCK;
    const x = RIGHT_CX - w / 2 - minC * BLOCK;
    const y = PANEL_BOX_Y + (size - h) / 2 - minR * BLOCK;
    drawShape(shape, x, y);
  }
  function draw() {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawWell();
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        drawBlock(BOARD_X + c * BLOCK, BOARD_Y + r * BLOCK, board[r][c]);
    const px = BOARD_X + current.x * BLOCK;
    drawShape(current.shape, px, BOARD_Y + ghostY(board, current) * BLOCK, true);
    drawShape(current.shape, px, BOARD_Y + current.y * BLOCK);
    drawLinesPanel();
    drawNextPanel();
  }
  // ── Bucle ──
  function loop(ts: number) {
    rafId = null;
    if (destroyed) return;
    // Primer fotograma tras arrancar o reanudar: la tecla que arrancó la partida
    // aún burbujeaba hacia `window` cuando attach() añadió el listener, así que el
    // clear() de run() llega tarde. Se vuelve a limpiar aquí, antes de leer.
    if (lastTime === null) keyboard.clear();
    const dt = lastTime === null ? 0 : ts - lastTime;
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
