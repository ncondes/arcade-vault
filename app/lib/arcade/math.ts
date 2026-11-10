// Utilidades numéricas compartidas por los juegos del runtime.
export type Point = { x: number; y: number };
/** Envuelve `v` en [0, max): el espacio toroidal de los juegos. */
export const wrap = (v: number, max: number): number => ((v % max) + max) % max;
export const dist = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
/** Real aleatorio en [min, max). */
export const rand = (min: number, max: number): number => min + Math.random() * (max - min);
/** Entero aleatorio en [min, max], ambos incluidos. */
export const randInt = (min: number, max: number): number => Math.floor(rand(min, max + 1));
