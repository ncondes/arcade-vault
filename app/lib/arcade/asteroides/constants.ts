// Números y colores de Asteroides. Los números son los de
// references/started-games/02-asteroids/game.js, uno a uno: no se toca el balance.
// ── Mundo y bucle ──
export const W = 800;
export const H = 600;
/** El dt se capa a 50ms para que volver de una pestaña oculta no dispare la física. */
export const DT_MAX = 0.05;
// ── Partida ──
export const START_LIVES = 3;
/** Segundos de espera entre la muerte y la reaparición. */
export const RESPAWN_DELAY = 2;
export const FIRST_LEVEL_ASTEROIDS = 4;
/** A partir del nivel 2 aparecen `3 + nivel` asteroides. */
export const LEVEL_ASTEROIDS_BASE = 3;
/** Radio libre de asteroides alrededor del centro al generar un nivel. */
export const SAFE_DIST = 130;
// ── Nave ──
export const SHIP_RADIUS = 12;
export const SHIP_INVINCIBLE = 3;
/** rad/s */
export const SHIP_ROT = 3.5;
/** px/s² */
export const SHIP_THRUST = 260;
/** Fricción por fotograma a 60 Hz. El original la aplica por fotograma; aquí se
 *  aplica como DRAG ** (dt * 60), idéntica a 60 Hz e independiente de los fps. */
export const DRAG = 0.987;
export const SHOOT_COOLDOWN = 0.2;
/** Distancia del centro a la punta de la nave, de donde salen las balas. */
export const SHIP_NOSE = 21;
/** La colisión nave-asteroide usa el radio del asteroide por este factor. */
export const SHIP_HIT_FUDGE = 0.82;
// ── Balas ──
export const BULLET_SPEED = 520;
export const BULLET_TTL = 1.1;
export const BULLET_RADIUS = 2;
// ── Asteroides (indexados por tamaño: 1 pequeño, 2 mediano, 3 grande) ──
export const RADII = [0, 16, 30, 50];
export const SPEEDS = [0, 85, 55, 32];
export const POINTS = [0, 100, 50, 20];
export const ASTEROID_SPEED_JITTER = 15;
export const ASTEROID_ROT_SPEED = 1.2;
export const ASTEROID_MIN_VERTS = 8;
export const ASTEROID_MAX_VERTS = 13;
// ── Power-up 3x ──
export const POWERUP_DROP_CHANCE = 0.15;
/** Impactos del nivel tras los que el power-up aparece seguro. */
export const POWERUP_GUARANTEED_KILLS = 5;
export const POWERUP_DURATION = 5;
export const POWERUP_TTL = 12;
export const POWERUP_RADIUS = 12;
export const POWERUP_MIN_SPEED = 20;
export const POWERUP_MAX_SPEED = 40;
export const TRIPLE_SPREAD = 0.18;
// ── Partículas ──
export const PARTICLE_MIN_SPEED = 30;
export const PARTICLE_MAX_SPEED = 130;
export const PARTICLE_MIN_LIFE = 0.4;
export const PARTICLE_MAX_LIFE = 1.1;
export const EXPLODE_DEFAULT = 8;
export const EXPLODE_SHIP = 14;
/** Partículas por unidad de tamaño al destruir un asteroide. */
export const EXPLODE_PER_SIZE = 5;
// ── Colores: la paleta de la plataforma, no el wireframe blanco del original ──
export const COLORS = {
  /** Casi negro, para que las scanlines del CRT sigan leyéndose por encima. */
  background: "#04050a",
  ship: "#f5ff00",
  bullet: "#f5ff00",
  asteroid: "rgba(230, 233, 255, 0.72)",
  powerUp: "#00f5ff",
  thrust: "rgba(255, 130, 0, 0.85)",
  /** Naranja cálido; la opacidad la pone cada partícula según su vida. */
  particleRgb: "255, 150, 40",
} as const;
