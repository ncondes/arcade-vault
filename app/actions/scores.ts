"use server";
import { isPlayable } from "@/app/lib/arcade/registry";
import { getGame } from "@/app/lib/data/games";
import { createClient } from "@/app/lib/supabase/server";
/**
 * Guarda la puntuación de una partida terminada (spec 06).
 *
 * `"use server"` hace de este export un endpoint público: la entrada llega de
 * la red y se trata como no fiable. Se valida en el orden de la spec —tipos,
 * nombre, rango, jugable, existe— y, si algo falla, no se inserta nada.
 *
 * Esta validación da mensajes legibles; la barrera real es la BD (`check` de la
 * tabla y `with check` de la política), porque la REST API es pública. Las
 * mismas reglas viven en los tres sitios. `isPlayable` solo se comprueba aquí:
 * el registro es la única fuente de verdad de "jugable".
 */
export type SaveScoreResult = { ok: true } | { ok: false; error: string };
const NAME_RE = /^[A-Z0-9_]{1,10}$/;
const MAX_SCORE = 10_000_000;
export async function saveScore(input: {
  gameId: string;
  name: string;
  score: number;
}): Promise<SaveScoreResult> {
  // 1) Tipos. TypeScript no llega a la red: lo que entra puede ser cualquier cosa.
  const { gameId, name, score } = (input ?? {}) as Record<string, unknown>;
  if (typeof gameId !== "string" || typeof name !== "string" || typeof score !== "number") {
    return { ok: false, error: "DATOS NO VÁLIDOS" };
  }
  // 2) Nombre: 1–10 caracteres A-Z, 0-9 o _.
  if (!NAME_RE.test(name)) {
    return { ok: false, error: "INICIALES: 1-10 LETRAS A-Z, 0-9 O _" };
  }
  // 3) Score: entero entre 0 y 10.000.000.
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return { ok: false, error: "PUNTUACIÓN NO VÁLIDA" };
  }
  // 4) Solo los juegos registrados tienen partida real que guardar.
  if (!isPlayable(gameId)) {
    return { ok: false, error: "ESTE JUEGO NO GUARDA PUNTUACIONES" };
  }
  // 5) Y que el juego exista en el catálogo. `getGame` lanza si falla la BD.
  try {
    const game = await getGame(gameId);
    if (!game) return { ok: false, error: "JUEGO NO ENCONTRADO" };
    const supabase = await createClient();
    // Sin `.select()`: el rol solo tiene `insert` en estas tres columnas, y
    // `id`/`created_at` los pone la BD.
    const { error } = await supabase.from("scores").insert({ game_id: gameId, name, score });
    if (error) {
      // El detalle se queda en el servidor; al modal solo llega el estado.
      console.error("[scores] Supabase rechazó el insert:", error);
      return { ok: false, error: "NO SE PUDO GUARDAR. INTÉNTALO DE NUEVO" };
    }
    return { ok: true };
  } catch (cause) {
    console.error("[scores] Excepción al guardar:", cause);
    return { ok: false, error: "NO SE PUDO GUARDAR. INTÉNTALO DE NUEVO" };
  }
}
