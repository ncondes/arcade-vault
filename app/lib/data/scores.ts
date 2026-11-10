import "server-only";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/app/lib/supabase/server";
import type {
  Accent,
  GameStats,
  PlayerRow,
  RecentScore,
  ScoreRow,
  TopPlayer,
} from "@/app/lib/types";
// Rankings y estadísticas, leídos de `scores` y de sus tres vistas. Ninguna función
// lanza: `null` significa "RANKING NO DISPONIBLE" y `[]` "SIN PUNTUACIONES TODAVÍA",
// para que un fallo de las puntuaciones degrade solo su bloque y no la página.
// El rango no se guarda en ninguna parte: es el índice + 1 tras ordenar, y con la
// misma puntuación gana quien la consiguió antes (`achieved_at` ascendente).
const TIME_ZONE = "Europe/Madrid";
/** "07/03/2026" en la zona de Madrid, sea cual sea la de la máquina que renderiza. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
/** "hace N s" / "hace N min" / "hace N h" por debajo de 24 h; a partir de ahí, la fecha. */
function formatAgo(iso: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `hace ${seconds} s`;
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
  return formatDate(iso);
}
/** Las columnas de las vistas salen nullable en los tipos generados; aquí nunca lo son. */
function present<T>(value: T | null): value is T {
  return value !== null;
}
/** Envuelve una lectura: cualquier error (de Supabase o de red) se registra y da `null`. */
async function safely<T>(label: string, read: () => Promise<T>): Promise<T | null> {
  try {
    return await read();
  } catch (err) {
    // `cookies()` (dentro de `createClient`) lanza una señal interna de Next al
    // intentar prerenderizar: hay que dejarla pasar para que la ruta sea dinámica.
    // Si se tragara, la página se generaría estática con "RANKING NO DISPONIBLE".
    unstable_rethrow(err);
    console.error(`[scores] ${label}:`, err);
    return null;
  }
}
/** gameId -> { récord, filas guardadas }. Un juego sin puntuaciones no aparece. */
export const getGameStats = cache((): Promise<Map<string, GameStats> | null> =>
  safely("getGameStats", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("game_stats").select("game_id, best, score_count");
    if (error) throw error;
    const stats = new Map<string, GameStats>();
    for (const row of data) {
      if (!present(row.game_id) || !present(row.best) || !present(row.score_count)) continue;
      stats.set(row.game_id, { best: row.best, count: row.score_count });
    }
    return stats;
  })
);
/** Top `limit` de un juego, una fila por nombre con su mejor marca. */
export const getLeaderboard = cache((gameId: string, limit: number): Promise<ScoreRow[] | null> =>
  safely(`getLeaderboard(${gameId})`, async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("game_player_bests")
      .select("name, score, achieved_at")
      .eq("game_id", gameId)
      .order("score", { ascending: false })
      .order("achieved_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data
      .filter((r) => present(r.name) && present(r.score) && present(r.achieved_at))
      .map((r, i) => ({
        rank: i + 1,
        name: r.name!,
        score: r.score!,
        date: formatDate(r.achieved_at!),
      }));
  })
);
/** Las `limit` puntuaciones más recientes, con "hace X" calculado ahora, en el servidor. */
export const getRecentScores = cache((limit: number): Promise<RecentScore[] | null> =>
  safely("getRecentScores", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("scores")
      .select("name, game_id, score, created_at, games(color)")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);
    if (error) throw error;
    const now = Date.now();
    return data.map((r) => ({
      player: r.name,
      gameId: r.game_id,
      score: r.score,
      ago: formatAgo(r.created_at, now),
      // El `check` de `games.color` garantiza que es un `Accent`.
      accent: (r.games?.color ?? "cyan") as Accent,
    }));
  })
);
/** Top `limit` jugadores por su marca individual más alta en cualquier juego. */
export const getTopPlayers = cache((limit: number): Promise<TopPlayer[] | null> =>
  safely("getTopPlayers", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("player_bests")
      .select("name, best")
      .order("best", { ascending: false })
      .order("achieved_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data
      .filter((r) => present(r.name) && present(r.best))
      .map((r) => ({ player: r.name!, score: r.best! }));
  })
);
/**
 * Matriz POR JUGADOR: los `limit` mejores nombres (orden de `player_bests`) y, de
 * cada uno, su mejor marca en cada juego en el que tiene alguna. Dos lecturas de
 * vistas: el agregado lo hace Postgres, aquí solo se cruzan las filas.
 */
export const getPlayerMatrix = cache((limit: number): Promise<PlayerRow[] | null> =>
  safely("getPlayerMatrix", async () => {
    const supabase = await createClient();
    const top = await supabase
      .from("player_bests")
      .select("name, best")
      .order("best", { ascending: false })
      .order("achieved_at", { ascending: true })
      .limit(limit);
    if (top.error) throw top.error;
    const players = top.data.filter((r) => present(r.name) && present(r.best));
    if (players.length === 0) return [];
    const names = players.map((r) => r.name!);
    const bests = await supabase
      .from("game_player_bests")
      .select("game_id, name, score")
      .in("name", names);
    if (bests.error) throw bests.error;
    const byName = new Map<string, Record<string, number>>(names.map((n) => [n, {}]));
    for (const row of bests.data) {
      if (!present(row.name) || !present(row.game_id) || !present(row.score)) continue;
      const scores = byName.get(row.name);
      if (scores) scores[row.game_id] = row.score;
    }
    return players.map((r, i) => ({
      rank: i + 1,
      name: r.name!,
      best: r.best!,
      scores: byName.get(r.name!) ?? {},
    }));
  })
);
