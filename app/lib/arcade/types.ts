// Contrato del runtime de juegos. No importa nada de React ni de Next: lo
// implementan los motores en TypeScript puro y lo consume GameCanvas.
/** Estado que el motor expone al exterior. El "muerto, esperando reaparecer"
 *  del original es interno: hacia fuera sigue siendo "playing". */
export type ArcadeStatus = "idle" | "playing" | "paused" | "gameover";
/** Lo que el HUD necesita. Solo valores discretos: cambian en eventos del juego
 *  (impacto, muerte, nivel), nunca cada fotograma. */
export type ArcadeSnapshot = {
  score: number;
  lives: number;
  level: number;
  status: ArcadeStatus;
};
export type ArcadeEngineOptions = {
  canvas: HTMLCanvasElement;
  /** Se invoca solo cuando algún campo de la instantánea cambia de valor. */
  onSnapshot: (snapshot: ArcadeSnapshot) => void;
};
/** Un motor ya montado sobre un canvas. Todas las órdenes son idempotentes. */
export type ArcadeEngine = {
  /** Arranca el bucle. De "idle" a "playing". */
  start(): void;
  pause(): void;
  resume(): void;
  /** Aborta la partida: pasa a "gameover" con la puntuación actual. No toca vidas. */
  end(): void;
  /** Nivel 1, puntuación a cero, vidas a 3. */
  restart(): void;
  /** Cancela el rAF y suelta todos los listeners. Se puede llamar dos veces. */
  destroy(): void;
};
/** Cada juego exporta esto por defecto desde su `index.ts`. */
export type ArcadeGameModule = {
  /** Resolución interna del canvas. El CSS la escala manteniendo el aspecto. */
  width: number;
  height: number;
  /** Filas de la ayuda de controles del overlay de arranque: [tecla, acción]. */
  controls: [string, string][];
  createEngine: (options: ArcadeEngineOptions) => ArcadeEngine;
};
