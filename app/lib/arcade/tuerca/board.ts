// Lógica pura del tablero, portada de references/started-games/03-tetris/game.js.
// Sin canvas, DOM ni globales: el tablero y la pieza llegan por parámetro.
import { COLS, KICKS, PIECE_TYPES, PIECES, ROWS } from "./constants";
/** 1 I, 2 O, 3 T, 4 S, 5 Z, 6 J, 7 L, 8 tuerca. */
export type PieceType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type Cell = 0 | PieceType;
/** ROWS × COLS. */
export type Board = Cell[][];
export type Piece = { type: PieceType; shape: Cell[][]; x: number; y: number };
export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => new Array<Cell>(COLS).fill(0));
}
/** Una de las 8 piezas, uniforme con `Math.random()`, centrada arriba del todo. */
export function randomPiece(): Piece {
  const type = (Math.floor(Math.random() * PIECE_TYPES) + 1) as PieceType;
  const shape = PIECES[type]!.map((row) => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}
/** La forma, colocada en (ox, oy), se sale por los lados o el suelo o pisa una celda ocupada.
 *  Por encima del techo (`ny < 0`) no choca. */
export function collide(board: Board, shape: Cell[][], ox: number, oy: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}
/** Una copia de la forma girada 90° en sentido horario. */
export function rotateCW(shape: Cell[][]): Cell[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array<Cell>(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
  return result;
}
/** Gira la pieza probando los kicks horizontales en orden. Si ninguno cabe, no la toca.
 *  Muta `piece` y devuelve si llegó a rotar. */
export function tryRotate(board: Board, piece: Piece): boolean {
  const rotated = rotateCW(piece.shape);
  for (const kick of KICKS) {
    if (!collide(board, rotated, piece.x + kick, piece.y)) {
      piece.shape = rotated;
      piece.x += kick;
      return true;
    }
  }
  return false;
}
/** Fija la pieza en el tablero. Muta `board`. */
export function merge(board: Board, piece: Piece): void {
  for (let r = 0; r < piece.shape.length; r++)
    for (let c = 0; c < piece.shape[r].length; c++)
      if (piece.shape[r][c]) board[piece.y + r][piece.x + c] = piece.shape[r][c];
}
/** Quita las filas completas y mete filas vacías por arriba. Muta `board` y devuelve
 *  cuántas limpió; la puntuación, las líneas y el nivel los lleva el motor. */
export function clearLines(board: Board): number {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every((v) => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array<Cell>(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  return cleared;
}
/** La fila más baja a la que puede caer la pieza sin chocar. */
export function ghostY(board: Board, piece: Piece): number {
  let gy = piece.y;
  while (!collide(board, piece.shape, piece.x, gy + 1)) gy++;
  return gy;
}
