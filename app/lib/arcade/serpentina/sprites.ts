// Las frutas de Serpentina: pixel art original dibujado por código, sin ficheros de
// imagen ni hojas de sprites (spec 09). Cada fruta es una matriz de 10×10 caracteres con su paleta;
// `.` es transparente. Este fichero es el único que sabe dibujarlas, así que cambiarlas
// por una hoja propia en otra spec no toca el motor.
import { COLORS } from "./constants";
export type FruitKind =
  "manzana" | "cereza" | "platano" | "uva" | "naranja" | "fresa" | "limon" | "sandia";
type Sprite = { rows: readonly string[]; palette: Readonly<Record<string, string>> };
const STEM = "#8a5a2b";
const LEAF = "#3fbf4f";
const FRUITS: Readonly<Record<FruitKind, Sprite>> = {
  manzana: {
    rows: [
      "....b.....",
      "....bgg...",
      ".rrrbrrrr.",
      "rrhrrrrrrd",
      "rhrrrrrrrd",
      "rrrrrrrrrd",
      "rrrrrrrrrd",
      ".rrrrrrrd.",
      ".drrrrrdd.",
      "..dd.ddd..",
    ],
    palette: { r: "#ff3355", d: "#b3123a", h: "#ffc2cc", b: STEM, g: LEAF },
  },
  cereza: {
    rows: [
      "......gg..",
      ".....bg...",
      "....b.b...",
      "...b...b..",
      ".rrr..rrr.",
      "rhrrdrhrrd",
      "rrrrdrrrrd",
      "rrrd.rrrd.",
      ".dd...dd..",
      "..........",
    ],
    palette: { r: "#ff2a6d", d: "#a3103f", h: "#ffc2d6", b: "#5f9e3a", g: LEAF },
  },
  platano: {
    rows: [
      "........bb",
      ".......yy.",
      "......yyy.",
      "......yyd.",
      ".....yhyd.",
      "....yhyd..",
      "y.yyhyyd..",
      "yyyyyyd...",
      ".ddddd....",
      "..........",
    ],
    palette: { y: "#ffd23f", d: "#c98a12", h: "#fff1a8", b: STEM },
  },
  uva: {
    rows: [
      "....bgg...",
      "....b.....",
      ".hpdhpdhp.",
      ".ppdppdpp.",
      "..hpdhpd..",
      "..ppdppd..",
      "...hpdh...",
      "...ppdp...",
      "....hp....",
      "....pp....",
    ],
    palette: { p: "#b04dff", d: "#5e1fa3", h: "#e3c2ff", b: STEM, g: LEAF },
  },
  naranja: {
    rows: [
      "....bgg...",
      "..oooooo..",
      ".ohoooooo.",
      "ohoooooood",
      "oooooooood",
      "oooooooood",
      "oooooooood",
      ".oooooood.",
      "..dddddd..",
      "..........",
    ],
    palette: { o: "#ff8a00", d: "#b85a00", h: "#ffd199", b: STEM, g: LEAF },
  },
  fresa: {
    rows: [
      "...gggg...",
      "..gggggg..",
      ".rrrrrrrr.",
      "rryrrrryrr",
      "rrrrryrrrr",
      ".ryrrrrry.",
      ".rrrryrrr.",
      "..rryrrr..",
      "...rrrr...",
      "....rr....",
    ],
    palette: { r: "#ff3b4e", y: "#ffe6a3", g: LEAF },
  },
  limon: {
    rows: [
      "..........",
      "......gg..",
      "...yyyyg..",
      "..yhyyyyy.",
      ".yhyyyyyyd",
      "yyyyyyyyyd",
      ".yyyyyyydd",
      "..yyyyydd.",
      "...dddd...",
      "..........",
    ],
    palette: { y: "#f5ff00", d: "#a8b000", h: "#fbffb3", g: LEAF },
  },
  sandia: {
    rows: [
      "..........",
      "..........",
      "rrrrrrrrrr",
      "rrkrrrrkrr",
      "wrrrrkrrrw",
      "gwrrrrrrwg",
      ".gwrrrrwg.",
      "..gwwwwg..",
      "...gggg...",
      "..........",
    ],
    palette: { r: "#ff4d6d", k: "#1a0a10", w: "#d8ffc2", g: "#1f9e4a" },
  },
};
export const FRUIT_KINDS = Object.keys(FRUITS) as FruitKind[];
/** La manzana con la paleta dorada y un anillo de contorno de 1 píxel alrededor de su
 *  silueta: 12×12. Se calcula una vez; es arte, no estado de partida. */
const GOLDEN: Sprite = {
  rows: outlined(FRUITS.manzana.rows, "o"),
  palette: {
    r: COLORS.golden,
    d: COLORS.goldenDark,
    h: COLORS.goldenHighlight,
    b: COLORS.goldenDark,
    g: COLORS.goldenDark,
    o: COLORS.goldenOutline,
  },
};
/** Añade un borde de 1 píxel a la matriz y rellena con `mark` cada hueco que toca la
 *  silueta en cualquiera de las 8 direcciones. */
function outlined(rows: readonly string[], mark: string): string[] {
  const h = rows.length + 2;
  const w = rows[0].length + 2;
  const at = (x: number, y: number): string => rows[y - 1]?.[x - 1] ?? ".";
  const out: string[] = [];
  for (let y = 0; y < h; y++) {
    let line = "";
    for (let x = 0; x < w; x++) {
      const c = at(x, y);
      if (c !== ".") {
        line += c;
        continue;
      }
      let touches = false;
      for (let dy = -1; dy <= 1 && !touches; dy++)
        for (let dx = -1; dx <= 1; dx++) if (at(x + dx, y + dy) !== ".") touches = true;
      line += touches ? mark : ".";
    }
    out.push(line);
  }
  return out;
}
/** Dibuja la matriz centrada en la caja de `size` × `size` cuya esquina es (x, y), con
 *  píxeles enteros e iguales: cada píxel mide floor(size / lado) px. */
function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  size: number
): void {
  const side = sprite.rows.length;
  const px = Math.max(1, Math.floor(size / side));
  const ox = Math.round(x + (size - side * px) / 2);
  const oy = Math.round(y + (size - side * px) / 2);
  for (let r = 0; r < side; r++) {
    const row = sprite.rows[r];
    for (let c = 0; c < row.length; c++) {
      const color = sprite.palette[row[c]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + c * px, oy + r * px, px, px);
    }
  }
}
/** Una fruta normal en la caja de `size` px con esquina en (x, y). */
export function drawFruit(
  ctx: CanvasRenderingContext2D,
  kind: FruitKind,
  x: number,
  y: number,
  size: number
): void {
  drawSprite(ctx, FRUITS[kind], x, y, size);
}
/** La fruta dorada (12×12 con contorno) en la caja de `size` px con esquina en (x, y). */
export function drawGoldenFruit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  drawSprite(ctx, GOLDEN, x, y, size);
}
