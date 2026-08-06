import { GAMES } from "@/app/lib/games";
import type {
  FaqItem,
  Feature,
  HomeStat,
  RecentScore,
  TopPlayer,
} from "@/app/lib/types";

/**
 * Datos de la pantalla de inicio. Todo son literales estáticos: no hay backend,
 * no se persiste nada y nada se recalcula en tiempo de ejecución.
 *
 * La dependencia va en un solo sentido: este fichero importa de `games.ts`,
 * nunca al revés.
 */

export const FEATURES: Feature[] = [
  {
    icon: "GAMEPAD",
    title: "JUEGOS CLÁSICOS",
    // El mockup nombraba "Arkanoid, Tetris, Snake": marcas ajenas que este
    // catálogo no ofrece. Se citan tres juegos que sí están en GAMES.
    desc: "Bloque Buster, Caída, Serpentina y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.",
    accent: "cyan",
  },
  {
    icon: "FREE",
    title: "100% GRATIS",
    desc: "Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.",
    accent: "yellow",
  },
  {
    icon: "TROPHY",
    // El mockup decía "LADDER BOARDS": único título en inglés de una interfaz
    // en español, y nombraba con otra palabra la sección que el nav ya llama así.
    title: "SALÓN DE LA FAMA",
    desc: "Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.",
    accent: "magenta",
  },
  {
    icon: "ROCKET",
    title: "SIEMPRE CRECIENDO",
    desc: "Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.",
    accent: "green",
  },
];

export const HOME_STATS: HomeStat[] = [
  // El mockup decía "12+" con 8 juegos en el catálogo, y la biblioteca que
  // desmiente esa cifra está a un clic. Se deriva de GAMES para que no vuelva
  // a desincronizarse.
  { value: `${GAMES.length}+`, unit: "JUEGOS", note: "Y CONTANDO" },
  { value: "MILES", unit: "DE PARTIDAS", note: "JUGADAS CADA DÍA" },
  { value: "GLOBAL", unit: "RANKING", note: "COMPITE CON EL MUNDO" },
];

/**
 * Ticker de "últimas puntuaciones". Los `ago` son cadenas fijas: no hay
 * temporizador ni `Date` detrás.
 *
 * Las puntuaciones coinciden con el `best` de cada juego por herencia del
 * mockup, pero se guardan como literal a propósito: "última puntuación" y
 * "récord" son conceptos distintos y no tienen por qué moverse juntos.
 */
export const RECENT_SCORES: RecentScore[] = [
  { player: "NEONFOX", gameId: "caida", score: 184220, ago: "hace 2 min", accent: "magenta" },
  { player: "PX_KAI", gameId: "gloton", score: 96400, ago: "hace 5 min", accent: "yellow" },
  { player: "Z3R0COOL", gameId: "invasores", score: 54190, ago: "hace 8 min", accent: "green" },
  { player: "VAULT_07", gameId: "rocas", score: 41200, ago: "hace 12 min", accent: "cyan" },
  { player: "GLITCHA", gameId: "bloque-buster", score: 28450, ago: "hace 18 min", accent: "cyan" },
  { player: "ARKADYA", gameId: "serpentina", score: 7820, ago: "hace 24 min", accent: "green" },
  { player: "CYBER_LU", gameId: "ranaria", score: 18900, ago: "hace 31 min", accent: "yellow" },
];

/** Ya ordenados de mayor a menor: el rango sale del índice. */
export const TOP_PLAYERS: TopPlayer[] = [
  { player: "NEONFOX", score: 312840 },
  { player: "PX_KAI", score: 248110 },
  { player: "M00NRYU", score: 196720 },
  { player: "VAULT_07", score: 154300 },
  { player: "GLITCHA", score: 138900 },
];

export const FAQ: FaqItem[] = [
  {
    q: "¿REALMENTE ES GRATIS?",
    a: 'Sí. Arcade Vault es un proyecto sin fines de lucro hecho por amor a los clásicos. No hay versión "premium" escondida.',
  },
  {
    q: "¿NECESITO CREAR CUENTA?",
    a: "No. Puedes jugar como invitado. Si quieres guardar tu puntuación y aparecer en el ranking, regístrate en 10 segundos.",
  },
  {
    q: "¿CÓMO SOBREVIVEN SIN COBRAR?",
    a: "Es un proyecto comunitario. Si te gusta, compártelo. Esa es toda la moneda que aceptamos.",
  },
];
