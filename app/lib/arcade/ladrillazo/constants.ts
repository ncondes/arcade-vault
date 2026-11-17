// Números, sprites y rutas de Ladrillazo. Los números son los de
// references/started-games/04-arkanoid/game.js, uno a uno: no se toca el balance.
// Los rectángulos de los sprites son los de assets/spritesheet.js, idénticos.
// ── Lienzo ──
export const W = 800;
export const H = 600;
// ── Pala ──
/** 1:1 con el código del original (el README dice 162 de ancho: manda el código). */
export const PADDLE_Y = 560;
export const PADDLE_W = 81;
export const PADDLE_H = 14;
/** px/s con las flechas. */
export const PADDLE_SPEED = 400;
/** Margen en px bajo el borde superior de la pala, más su alto, en el que la bola
 *  todavía rebota: la ventana de rebote mide PADDLE_H + PADDLE_CATCH. */
export const PADDLE_CATCH = 8;
// ── Bola ──
export const BALL_SIZE = 16;
/** px/s, multiplicadas por la velocidad del nivel. */
export const BASE_BALL_VX = 200;
export const BASE_BALL_VY = -300;
// ── Ladrillos ──
export const BLOCK_COLS = 10;
export const BLOCK_ROWS = 6;
export const BLOCK_W = 64;
export const BLOCK_H = 24;
/** (800 − 10 · 64) / 2 = 80, como en el original. */
export const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2;
export const BLOCKS_ORIGIN_Y = 80;
// ── Reglas ──
export const BLOCK_POINTS = 10;
export const LIVES = 3;
/** Último nivel: limpiarlo termina la partida. */
export const LAST_LEVEL = 5;
/** El `check` de `scores` acota la puntuación a este máximo. */
export const SCORE_MAX = 10_000_000;
/** Corrección de plataforma: un tirón no hace atravesar la pala ni un ladrillo. */
export const DT_MAX = 0.05;
// ── Sprites ──
export type BlockColor = "gray" | "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green";
/** Un rectángulo de origen dentro del spritesheet. */
export type SpriteRect = { sx: number; sy: number; sw: number; sh: number };
export const SPRITES: {
  paddle: SpriteRect;
  ball: SpriteRect;
  blocks: Record<BlockColor, SpriteRect>;
} = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  blocks: {
    gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
    red: { sx: 32, sy: 176, sw: 32, sh: 16 },
    yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
    cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
    magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
    hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
    green: { sx: 32, sy: 208, sw: 32, sh: 16 },
  },
};
/** Fila de 4 fotogramas de 32×16 a partir de (256, sy). */
function explosionRow(sy: number): readonly SpriteRect[] {
  return [256, 288, 320, 352].map((sx) => ({ sx, sy, sw: 32, sh: 16 }));
}
/** Como en el original, los grises explotan con los fotogramas de los rojos (sy 176). */
export const EXPLOSION_FRAMES: Record<BlockColor, readonly SpriteRect[]> = {
  red: explosionRow(176),
  cyan: explosionRow(192),
  green: explosionRow(208),
  magenta: explosionRow(224),
  yellow: explosionRow(240),
  hotpink: explosionRow(256),
  gray: explosionRow(176),
};
/** ms que dura una explosión, repartidos entre sus 4 fotogramas. */
export const EXPLOSION_DURATION = 150;
export const EXPLOSION_FRAME_COUNT = 4;
// ── Assets (public/games/ladrillazo/) ──
export const SPRITESHEET_SRC = "/games/ladrillazo/spritesheet-breakout.png";
export const SOUND_BOUNCE_SRC = "/games/ladrillazo/sounds/ball-bounce.mp3";
export const SOUND_BREAK_SRC = "/games/ladrillazo/sounds/break-sound.mp3";
// ── Colores ──
/** Casi negro con un punto de vino, el fondo de la portada `cover-ladrillazo`: el
 *  juego continúa la tarjeta. Sobre `#000` (el original) las scanlines del CRT
 *  desaparecen, porque multiplicar el negro da negro; aquí se leen por encima del
 *  fondo. El tinte es tan bajo que no altera el color de los sprites, que no se tocan. */
export const BG = "#0b0409";
