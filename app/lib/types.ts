export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
/** "TODOS" solo existe como valor del filtro de la biblioteca, no como categoría. */
export type CategoryFilter = "TODOS" | Category;
/** Acento del botón JUGAR de la tarjeta. Se corresponde con las clases `.btn.magenta` / `.btn.yellow`. */
export type Accent = "cyan" | "magenta" | "yellow" | "green";
/** Clases de portada ya definidas en `app/globals.css`. */
export type CoverClass =
  | "cover-asteroides"
  | "cover-bricks"
  | "cover-tetro"
  | "cover-snake"
  | "cover-glot"
  | "cover-invaders"
  | "cover-rocas"
  | "cover-rana"
  | "cover-duelo";
export type Game = {
  /** Slug de la URL: /games/bloque-buster */
  id: string;
  /** "BLOQUE BUSTER", ya en mayúsculas */
  title: string;
  /** Una línea, para la tarjeta */
  short: string;
  /** Párrafo, para el detalle */
  long: string;
  cat: Category;
  cover: CoverClass;
  color: Accent;
};
/** Derivado de `scores` (vista `game_stats`): récord y número de filas guardadas del juego. */
export type GameStats = { best: number; count: number };
export type ScoreRow = {
  rank: number;
  /** "PX_KAI" */
  name: string;
  score: number;
  /** "07/03/2026", ya formateado */
  date: string;
};
/* ===== pantalla de inicio ===== */
/** Los cuatro iconos SVG de las tarjetas de `// 01`, dibujados en `FeatureIcon`. */
export type FeatureIconKind = "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
export type Feature = {
  icon: FeatureIconKind;
  /** "JUEGOS CLÁSICOS", ya en mayúsculas */
  title: string;
  desc: string;
  accent: Accent;
};
export type HomeStat = {
  /** "8+", "MILES", "GLOBAL" — NO es un número */
  value: string;
  /** "JUEGOS" */
  unit: string;
  /** "Y CONTANDO" */
  note: string;
};
export type RecentScore = {
  /** "KAI": las iniciales con las que se guardó la puntuación */
  player: string;
  /** "caida" — el título sale del catálogo, no se duplica aquí */
  gameId: string;
  score: number;
  /** "hace 2 min", calculado en el servidor al renderizar (ver `app/lib/data/scores.ts`) */
  ago: string;
  accent: Accent;
};
export type TopPlayer = {
  player: string;
  /** El rango (#01..#05) es el índice + 1, no se guarda */
  score: number;
};
/** Una fila de la matriz POR JUGADOR del hall of fame. */
export type PlayerRow = {
  rank: number;
  name: string;
  best: number;
  /** Solo los juegos en los que tiene marca: gameId -> mejor score. */
  scores: Record<string, number>;
};
export type FaqItem = { q: string; a: string };
/* ===== acerca de y contacto ===== */
/** Los tres iconos SVG de las tarjetas del hero, dibujados en `HighlightIcon`. */
export type HighlightIconKind = "HEART" | "BROWSER" | "PLANT";
export type Highlight = {
  icon: HighlightIconKind;
  /** "HECHO CON ❤️ PARA JUGADORES", ya en mayúsculas */
  text: string;
  accent: Accent;
};
export type ContactTip = {
  /** "RESPUESTA EN 24-48H", ya en mayúsculas */
  text: string;
  /**
   * El color del punto. El CSS lo escribe con modificadores de una letra
   * (`.tip-led.y`, `.tip-led.m`, y verde sin modificador); la traducción vive
   * en el componente, porque el dato dice el color, no la clase.
   */
  led: "green" | "yellow" | "magenta";
};
