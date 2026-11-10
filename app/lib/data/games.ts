import "server-only";
import { cache } from "react";
import { createClient } from "@/app/lib/supabase/server";
import type { Database } from "@/app/lib/supabase/database.types";
import type { Accent, Category, CoverClass, Game } from "@/app/lib/types";
// Lectura del catálogo (tabla `games`). Si Supabase falla, estas funciones LANZAN:
// sin catálogo no hay página que salvar, y el error lo recoge `app/error.tsx`.
type GameRow = Pick<
  Database["public"]["Tables"]["games"]["Row"],
  "id" | "title" | "short" | "long" | "category" | "cover" | "color"
>;
const COLUMNS = "id, title, short, long, category, cover, color";
function toGame(row: GameRow): Game {
  return {
    id: row.id,
    title: row.title,
    short: row.short,
    long: row.long,
    // `category` y `color` los acota el `check` de la tabla. `cover` lleva un
    // `check` laxo (`cover-%`): su lista cerrada vive en `CoverClass`.
    cat: row.category as Category,
    cover: row.cover as CoverClass,
    color: row.color as Accent,
  };
}
/** El catálogo entero, en el orden de `position`. */
export const getGames = cache(async (): Promise<Game[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("games").select(COLUMNS).order("position");
  if (error) throw new Error(`No se pudo leer el catálogo: ${error.message}`);
  return data.map(toGame);
});
/** Un juego por id, o `null` si no existe (la página llama a `notFound()`). */
export const getGame = cache(async (id: string): Promise<Game | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("games").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo leer el juego "${id}": ${error.message}`);
  return data ? toGame(data) : null;
});
