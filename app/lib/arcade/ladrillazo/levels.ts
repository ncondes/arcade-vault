// Los 5 muros de references/started-games/04-arkanoid/levels.js, portados
// literalmente: mismos patrones, mismos colores por fila y mismas velocidades.
// Sin canvas ni DOM.
import {
  BLOCK_COLS,
  BLOCK_H,
  BLOCK_ROWS,
  BLOCK_W,
  BLOCKS_ORIGIN_X,
  BLOCKS_ORIGIN_Y,
  type BlockColor,
} from "./constants";
/** Un ladrillo del patrón, en celdas de la rejilla. */
type LevelBlock = { col: number; row: number; color: BlockColor };
type Level = { speed: number; blocks: readonly LevelBlock[] };
/** Un ladrillo ya colocado en el lienzo, en px. */
export type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  alive: boolean;
};
// ── Muro 1: parrilla completa 10×6 ──
const rowColors1: readonly BlockColor[] = ["red", "yellow", "cyan", "magenta", "hotpink", "green"];
const l1: LevelBlock[] = [];
for (let row = 0; row < BLOCK_ROWS; row++)
  for (let col = 0; col < BLOCK_COLS; col++) l1.push({ col, row, color: rowColors1[row] });
// ── Muro 2: pirámide centrada ──
const rowColors2: readonly BlockColor[] = ["gray", "cyan", "hotpink", "yellow", "magenta", "green"];
const pyStart = [4, 3, 2, 1, 0, 0];
const pyEnd = [5, 6, 7, 8, 9, 9];
const l2: LevelBlock[] = [];
for (let row = 0; row < BLOCK_ROWS; row++)
  for (let col = pyStart[row]; col <= pyEnd[row]; col++)
    l2.push({ col, row, color: rowColors2[row] });
// ── Muro 3: ajedrez ──
const l3: LevelBlock[] = [];
for (let row = 0; row < BLOCK_ROWS; row++)
  for (let col = 0; col < BLOCK_COLS; col++)
    if ((col + row) % 2 === 0) l3.push({ col, row, color: row < 3 ? "yellow" : "magenta" });
// ── Muro 4: filas con huecos ──
const rowColors4: readonly BlockColor[] = ["cyan", "magenta", "green", "yellow", "hotpink", "red"];
const gaps4 = [
  [2, 5, 8],
  [0, 4, 7, 9],
  [1, 3, 6],
  [2, 5, 8, 9],
  [0, 4, 7],
  [1, 3, 6, 9],
];
const l4: LevelBlock[] = [];
for (let row = 0; row < BLOCK_ROWS; row++)
  for (let col = 0; col < BLOCK_COLS; col++)
    if (!gaps4[row].includes(col)) l4.push({ col, row, color: rowColors4[row] });
// ── Muro 5: marco y cruz central ──
const l5: LevelBlock[] = [];
for (let row = 0; row < BLOCK_ROWS; row++)
  for (let col = 0; col < BLOCK_COLS; col++) {
    const isFrame = col === 0 || col === 9 || row === 0 || row === 5;
    const isCross = col === 4 || row === 2;
    if (isFrame || isCross) l5.push({ col, row, color: isCross && !isFrame ? "hotpink" : "cyan" });
  }
export const LEVELS: readonly Level[] = [
  { speed: 1.0, blocks: l1 },
  { speed: 1.1, blocks: l2 },
  { speed: 1.21, blocks: l3 },
  { speed: 1.33, blocks: l4 },
  { speed: 1.46, blocks: l5 },
];
/** Velocidad del nivel `level` (1–5). */
export function levelSpeed(level: number): number {
  return LEVELS[level - 1].speed;
}
/** Los ladrillos del nivel `level` (1–5) colocados en el lienzo, todos vivos. */
export function buildBlocks(level: number): Block[] {
  return LEVELS[level - 1].blocks.map((b) => ({
    x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
    y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
    w: BLOCK_W,
    h: BLOCK_H,
    color: b.color,
    alive: true,
  }));
}
