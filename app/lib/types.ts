export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

/** "TODOS" solo existe como valor del filtro de la biblioteca, no como categoría. */
export type CategoryFilter = "TODOS" | Category;

/** Acento del botón JUGAR de la tarjeta. Se corresponde con las clases `.btn.magenta` / `.btn.yellow`. */
export type Accent = "cyan" | "magenta" | "yellow" | "green";

/** Clases de portada ya definidas en `app/globals.css`. */
export type CoverClass =
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
  /** 28450 -> se muestra con toLocaleString("es-ES") */
  best: number;
  /** "12.4K", ya viene formateado; NO es un número */
  plays: string;
};

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
  /** "NEONFOX", uno de los alias de `PLAYERS` */
  player: string;
  /** "caida" — el título sale de GAMES, no se duplica aquí */
  gameId: string;
  score: number;
  /** "hace 2 min", cadena fija: no se recalcula */
  ago: string;
  accent: Accent;
};

export type TopPlayer = {
  player: string;
  /** El rango (#01..#05) es el índice + 1, no se guarda */
  score: number;
};

export type FaqItem = { q: string; a: string };
