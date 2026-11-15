// Números y colores de Tuerca. Los números son los de
// references/started-games/03-tetris/game.js, uno a uno: no se toca el balance.
import type { Cell } from "./board";
// ── Tablero ──
export const COLS = 10;
export const ROWS = 20;
/** Lado de una celda en px del lienzo. */
export const BLOCK = 30;
// ── Piezas (indexadas por tipo: 1 I, 2 O, 3 T, 4 S, 5 Z, 6 J, 7 L, 8 tuerca) ──
export const PIECE_TYPES = 8;
export const PIECES: readonly (readonly (readonly Cell[])[] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // tuerca
];
// ── Reglas ──
/** Puntos por 0, 1, 2, 3 y 4 líneas limpiadas a la vez, multiplicados por el nivel. */
export const LINE_SCORES = [0, 100, 300, 500, 800] as const;
/** Desplazamientos horizontales que se prueban al rotar, en este orden. */
export const KICKS = [0, -1, 1, -2, 2] as const;
/** Intervalo de caída en ms: max(DROP_MIN, DROP_START − (nivel − 1) · DROP_STEP). */
export const DROP_START = 1000;
export const DROP_STEP = 90;
export const DROP_MIN = 100;
export const LINES_PER_LEVEL = 10;
/** Puntos por celda en el hard drop. */
export const HARD_DROP_POINTS = 2;
/** Puntos por fila en el soft drop. */
export const SOFT_DROP_POINTS = 1;
/** El `check` de `scores` acota la puntuación a este máximo. */
export const SCORE_MAX = 10_000_000;
// ── Lienzo ──
export const W = 800;
export const H = 600;
/** El tablero de 300×600, centrado en horizontal y a toda la altura. */
export const BOARD_X = 250;
export const BOARD_Y = 0;
/** La vista previa de SIGUIENTE ocupa 4×4 celdas (120×120 a BLOCK 30). */
export const PREVIEW_CELLS = 4;
/** Paneles a los lados del tablero, cada uno centrado en su franja de 250 px:
 *  LÍNEAS a la izquierda y SIGUIENTE a la derecha. Los dos tienen la misma
 *  composición (etiqueta y caja de 120 px de ancho) y arrancan a la misma altura. */
export const PANEL_LABEL_Y = 64;
export const PANEL_BOX_Y = 80;
export const PANEL_BOX_W = PREVIEW_CELLS * BLOCK;
export const LINES_BOX_H = 72;
/** Las etiquetas imitan las del HUD: mono pequeña, tenue y espaciada. El canvas no
 *  ve las fuentes de next/font (sus nombres llevan hash), así que va la mono del sistema. */
export const FONT_FAMILY = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
export const LABEL_SIZE = 12;
/** Espacio entre letras de las etiquetas, en px (a mano: `letterSpacing` del canvas
 *  no está en todos los navegadores). */
export const LABEL_TRACKING = 3;
/** El contador de LÍNEAS se dibuja con celdas, como la fuente pixel de los valores
 *  del HUD: dígitos de 3×5 celdas de DIGIT_PX px, separados por una celda. */
export const DIGIT_PX = 8;
export const DIGIT_GLYPHS: readonly (readonly string[])[] = [
  ["111", "101", "101", "101", "111"],
  ["010", "110", "010", "010", "111"],
  ["111", "001", "111", "100", "111"],
  ["111", "001", "011", "001", "111"],
  ["101", "101", "111", "001", "001"],
  ["111", "100", "111", "001", "111"],
  ["111", "100", "111", "101", "111"],
  ["111", "001", "010", "010", "010"],
  ["111", "101", "111", "101", "111"],
  ["111", "101", "111", "001", "111"],
];
// ── Pieza fantasma ──
/** Opacidad del relleno de la fantasma, como en el original. */
export const GHOST_ALPHA = 0.2;
/** Grosor en px del contorno que se le añade para que se lea sobre el fondo. */
export const GHOST_STROKE = 1;
// ── Colores: la paleta de neón de la plataforma, no los pastel del original ──
/** Indexados por tipo de pieza. La forma es la señal principal; el color la refuerza.
 *  I, O y S son los cian, amarillo y verde de la plataforma; T es un magenta más
 *  frío que el rojo de Z para que no se confundan; J sube de luz para leerse sobre
 *  el negro; la tuerca es el único gris, metal entre neones. */
export const COLORS: readonly (string | null)[] = [
  null,
  "#00f5ff", // I — cian
  "#f5ff00", // O — amarillo
  "#e03cff", // T — magenta
  "#00ff88", // S — verde
  "#ff3355", // Z — rojo
  "#4d8dff", // J — azul
  "#ff8a00", // L — naranja
  "#b4bccb", // tuerca — gris metálico
];
/** Casi negro, para que las scanlines del CRT sigan leyéndose por encima. */
export const BG = "#04050a";
/** El pozo, un punto más claro que los paneles para que se lea como hueco. */
export const WELL_BG = "#070b14";
/** Rejilla del pozo: teñida de cian y lo justo por encima de lo que se comen las scanlines. */
export const GRID = "rgba(0, 245, 255, 0.08)";
export const WELL_WALL = "rgba(0, 245, 255, 0.6)";
export const WELL_GLOW = "rgba(0, 245, 255, 0.35)";
/** Brillo de la franja superior de cada celda, como en el original. */
export const HIGHLIGHT = "rgba(255, 255, 255, 0.18)";
export const HIGHLIGHT_H = 4;
/** Sombra de la franja inferior: con el brillo de arriba, la celda parece una pieza. */
export const SHADE = "rgba(0, 0, 0, 0.3)";
export const SHADE_H = 3;
export const PANEL_BORDER = "rgba(0, 245, 255, 0.28)";
export const PANEL_LABEL = "#8a8fb5";
/** El contador de LÍNEAS va en el color del juego en el catálogo (`cyan`). */
export const LINES_COLOR = "#00f5ff";
export const GLOW_BLUR = 10;
