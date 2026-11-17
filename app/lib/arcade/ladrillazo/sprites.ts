// Sustituye a assets/spritesheet.js del original. Allí la imagen vivía en
// globales de módulo (ssImg, ssLoaded); aquí cada motor crea la suya.
import type { SpriteRect } from "./constants";
export type Spritesheet = {
  /** `true` cuando la imagen ha cargado; hasta entonces `draw` no pinta nada. */
  readonly ready: boolean;
  /** Dibuja el rectángulo `rect` del spritesheet en (x, y) con tamaño w×h. */
  draw(
    ctx: CanvasRenderingContext2D,
    rect: SpriteRect,
    x: number,
    y: number,
    w: number,
    h: number
  ): void;
  /** Suelta los callbacks de carga: tras esto `onLoad` ya no se llama. */
  dispose(): void;
};
/** Empieza a cargar `src` y llama a `onLoad` una vez, cuando la imagen está lista. */
export function createSpritesheet(src: string, onLoad?: () => void): Spritesheet {
  const img = new Image();
  let ready = false;
  img.onload = () => {
    ready = true;
    onLoad?.();
  };
  img.onerror = () => console.error("Failed to load spritesheet");
  img.src = src;
  return {
    get ready() {
      return ready;
    },
    draw(ctx, rect, x, y, w, h) {
      if (!ready) return;
      ctx.drawImage(img, rect.sx, rect.sy, rect.sw, rect.sh, x, y, w, h);
    },
    dispose() {
      img.onload = null;
      img.onerror = null;
    },
  };
}
