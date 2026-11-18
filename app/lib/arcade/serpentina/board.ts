// Lógica pura del tablero de Serpentina. Sin canvas, DOM ni globales: la serpiente
// y las celdas ocupadas llegan por parámetro.
import { BASE_STEPS, COLS, MAX_STEPS, ROWS } from "./constants";
export type Dir = "up" | "down" | "left" | "right";
/** Columna 0–31, fila 0–23, origen arriba a la izquierda. */
export type Cell = { x: number; y: number };
const DELTAS: Readonly<Record<Dir, Cell>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
export const OPPOSITE: Readonly<Record<Dir, Dir>> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};
export const sameCell = (a: Cell, b: Cell): boolean => a.x === b.x && a.y === b.y;
/** La celda vecina de `head` en la dirección `dir`. Puede caer fuera del tablero. */
export function nextHead(head: Cell, dir: Dir): Cell {
  const d = DELTAS[dir];
  return { x: head.x + d.x, y: head.y + d.y };
}
export function hitsWall(cell: Cell): boolean {
  return cell.x < 0 || cell.x >= COLS || cell.y < 0 || cell.y >= ROWS;
}
/** `cell` pisa la serpiente. Si este paso no crece, la cola deja su celda en el mismo
 *  paso, así que la última celda no cuenta. */
export function hitsBody(cell: Cell, snake: readonly Cell[], growing: boolean): boolean {
  const end = growing ? snake.length : snake.length - 1;
  for (let i = 0; i < end; i++) if (sameCell(cell, snake[i])) return true;
  return false;
}
/** Las celdas que no ocupa ni la serpiente ni ninguna de `occupied`, en orden de lectura. */
export function freeCells(snake: readonly Cell[], occupied: readonly Cell[]): Cell[] {
  const taken = new Uint8Array(COLS * ROWS);
  for (const c of snake) taken[c.y * COLS + c.x] = 1;
  for (const c of occupied) taken[c.y * COLS + c.x] = 1;
  const free: Cell[] = [];
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) if (!taken[y * COLS + x]) free.push({ x, y });
  return free;
}
/** min(8 + (nivel − 1), 18): el tope llega en el nivel 11. */
export function stepsPerSecond(level: number): number {
  return Math.min(BASE_STEPS + (level - 1), MAX_STEPS);
}
