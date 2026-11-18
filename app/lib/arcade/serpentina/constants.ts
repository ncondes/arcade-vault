// Números, colores y teclas de Serpentina. Son números de diseño propios (spec 09):
// no hay referencia que portar. Cada cambio al jugar se anota en Decisiones de la spec.
import type { Dir } from "./board";
// ── Lienzo ──
export const W = 800;
export const H = 600;
// ── Tablero: 32 × 24 celdas de 25 px ocupan el lienzo entero ──
export const COLS = 32;
export const ROWS = 24;
export const CELL = 25;
// ── Serpiente ──
export const START_LENGTH = 3;
export const START_DIR: Dir = "right";
/** La cabeza arranca en el centro; el cuerpo se extiende hacia la izquierda. */
export const START_HEAD = { x: 16, y: 12 } as const;
// ── Velocidad: min(BASE_STEPS + (nivel − 1), MAX_STEPS) pasos/s; el tope llega en el nivel 11 ──
export const BASE_STEPS = 8;
export const MAX_STEPS = 18;
// ── Reglas ──
export const FRUITS_PER_LEVEL = 5;
/** Puntos por fruta, multiplicados por el nivel. */
export const FRUIT_POINTS = 10;
export const GOLDEN_POINTS = 50;
/** La dorada dura GOLDEN_DURATION s y parpadea en su último GOLDEN_BLINK_AT s. */
export const GOLDEN_DURATION = 5;
export const GOLDEN_BLINK_AT = 1;
/** Por debajo del límite de 3 destellos/s. */
export const GOLDEN_BLINK_HZ = 2;
/** Giros que caben en la cola; se aplica uno por paso. */
export const TURN_QUEUE = 2;
/** El `check` de `scores` acota la puntuación a este máximo. */
export const SCORE_MAX = 10_000_000;
/** Corrección de plataforma, como en los otros juegos: un fotograma largo no da más de un paso. */
export const DT_MAX = 0.05;
/** Tolerancia del acumulador, en s: sin ella, a 60 Hz el paso 80 de 10 s cae un fotograma tarde
 *  por redondeo (spec 09, Decisiones). Un nanosegundo no cambia el juego. */
export const STEP_EPSILON = 1e-9;
// ── Frutas: la dorada se distingue también por tamaño ──
export const FRUIT_SIZE = 20;
export const GOLDEN_SIZE = 25;
// ── Dibujo ──
/** La barra de tiempo de la dorada, en el borde inferior de su celda. */
export const GOLDEN_BAR_H = 3;
/** Margen de cada segmento (cuenta) dentro de su celda, y del cuello que la une a la
 *  siguiente: más estrecho, para que los segmentos se cuenten. */
export const SNAKE_INSET = 3;
export const NECK_INSET = 6;
/** Resplandor de neón de la serpiente, en px. */
export const SNAKE_GLOW_BLUR = 10;
/** Al morir, cada color de la serpiente queda al 35 % sobre el fondo. */
export const DEAD_MIX = 0.35;
/** Ojos de la cabeza: lado, adelanto hacia `dir` y separación a cada lado del centro. */
export const EYE_SIZE = 4;
export const EYE_FORWARD = 4;
export const EYE_SPREAD = 5;
/** La ✕ que se dibuja sobre la cabeza al morir. */
export const MARK_INSET = 5;
export const MARK_WIDTH = 3;
// ── Teclas (`e.code`) por dirección ──
export const DIR_KEYS: Readonly<Record<Dir, readonly string[]>> = {
  up: ["ArrowUp", "KeyW"],
  down: ["ArrowDown", "KeyS"],
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
};
// ── Colores: los neones de la plataforma sobre casi negro ──
export const COLORS = {
  /** Casi negro, para que las scanlines del CRT sigan leyéndose por encima. */
  bg: "#04050a",
  /** Rejilla teñida de verde, lo justo por encima de lo que se comen las scanlines. */
  grid: "rgba(0, 255, 136, 0.07)",
  /** El borde que mata. */
  wall: "rgba(0, 255, 136, 0.3)",
  /** El cuello es el verde de la plataforma; la cola, uno más hondo (los de la portada). */
  snake: "#00ff88",
  tail: "#00a85c",
  /** La cabeza, más clara: se encuentra de un vistazo. */
  head: "#7dffc0",
  glow: "rgba(0, 255, 136, 0.45)",
  eyes: "#04050a",
  golden: "#ffd23f",
  goldenDark: "#b88a00",
  goldenHighlight: "#fffbe0",
  goldenOutline: "#fff4b8",
  goldenBarTrack: "rgba(255, 210, 63, 0.25)",
  deadMark: "#ff3355",
} as const;
