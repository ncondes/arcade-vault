import type { FaqItem, Feature, HomeStat } from "@/app/lib/types";
/**
 * Datos estáticos de la pantalla de inicio. Lo que sale de la BD (destacados,
 * número de juegos, últimas puntuaciones y top jugadores) lo lee `app/page.tsx`
 * con la capa de datos de `app/lib/data/`.
 */
export const FEATURES: Feature[] = [
  {
    icon: "GAMEPAD",
    title: "JUEGOS CLÁSICOS",
    // El mockup nombraba "Arkanoid, Tetris, Snake": marcas ajenas que este
    // catálogo no ofrece. Se citan tres juegos que sí están en el catálogo.
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
/**
 * La primera cifra ("N+ JUEGOS") no está aquí: la compone `app/page.tsx` con el
 * tamaño real del catálogo de la BD, para que no se desincronice nunca.
 */
export const HOME_STATS: HomeStat[] = [
  { value: "MILES", unit: "DE PARTIDAS", note: "JUGADAS CADA DÍA" },
  { value: "GLOBAL", unit: "RANKING", note: "COMPITE CON EL MUNDO" },
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
