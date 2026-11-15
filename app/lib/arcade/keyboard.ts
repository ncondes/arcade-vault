// Teclado compartido por los juegos del runtime. Escucha en `window`, no en el
// canvas: si escuchara en el elemento, un keyup fuera de él dejaría la tecla
// pegada. Quien decide si el juego debe correr es el envoltorio (GameCanvas).
export type Keyboard = {
  /** La tecla está mantenida ahora mismo. */
  held(code: string): boolean;
  /** La tecla se pulsó desde la última lectura. Se consume al leerla, no al
   *  final del fotograma: es el `pressed()` del juego original. */
  pressed(code: string): boolean;
  /** Cuántos keydown llegaron desde la última lectura, autorrepetición del sistema incluida.
   *  Se consume al leerlo. `clear()` y `detach()` también lo vacían. */
  typed(code: string): number;
  /** Olvida todas las teclas mantenidas y pulsadas (al pausar). */
  clear(): void;
  attach(): void;
  /** Idempotente: se puede llamar sin haber llamado a attach. */
  detach(): void;
};
export function createKeyboard(target: Window = window): Keyboard {
  const keys = new Map<string, boolean>();
  const justPressed = new Map<string, boolean>();
  const typedCount = new Map<string, number>();
  let attached = false;
  const onKeyDown = (e: KeyboardEvent) => {
    // `typed()` sí cuenta la autorrepetición: cada keydown suma uno.
    typedCount.set(e.code, (typedCount.get(e.code) ?? 0) + 1);
    // La autorrepetición del sistema no cuenta como pulsación nueva.
    if (!keys.get(e.code)) justPressed.set(e.code, true);
    keys.set(e.code, true);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys.set(e.code, false);
  };
  return {
    held: (code) => keys.get(code) === true,
    pressed(code) {
      const val = justPressed.get(code) === true;
      justPressed.set(code, false);
      return val;
    },
    typed(code) {
      const n = typedCount.get(code) ?? 0;
      typedCount.delete(code);
      return n;
    },
    clear() {
      keys.clear();
      justPressed.clear();
      typedCount.clear();
    },
    attach() {
      if (attached) return;
      attached = true;
      target.addEventListener("keydown", onKeyDown);
      target.addEventListener("keyup", onKeyUp);
    },
    detach() {
      if (!attached) return;
      attached = false;
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("keyup", onKeyUp);
      keys.clear();
      justPressed.clear();
      typedCount.clear();
    },
  };
}
