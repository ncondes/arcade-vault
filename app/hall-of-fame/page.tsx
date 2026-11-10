import type { Metadata } from "next";
import HallOfFameBoard from "@/app/components/HallOfFameBoard";
import PlayerMatrix, { type MatrixColumn } from "@/app/components/PlayerMatrix";
import { getGames } from "@/app/lib/data/games";
import { getGameStats, getLeaderboard, getPlayerMatrix } from "@/app/lib/data/scores";
import type { ScoreRow } from "@/app/lib/types";
export const metadata: Metadata = {
  title: "Salón de la Fama",
};
const HALL_LIMIT = 12;
const MATRIX_LIMIT = 20;
// Todo se lee aquí, en el servidor, y baja por props al componente cliente de las
// pestañas: el navegador no habla con Supabase. Un ranking por juego, en paralelo
// (9 lecturas por carga; ver Riesgos en la spec 06). Si falla el catálogo,
// `getGames` lanza y sale error.tsx; si falla un ranking, solo su bloque degrada.
export default async function HallOfFamePage() {
  const games = await getGames();
  const [boards, matrix, stats] = await Promise.all([
    Promise.all(games.map((g) => getLeaderboard(g.id, HALL_LIMIT))),
    getPlayerMatrix(MATRIX_LIMIT),
    getGameStats(),
  ]);
  const rowsByGame: Record<string, ScoreRow[] | null> = {};
  games.forEach((g, i) => (rowsByGame[g.id] = boards[i]));
  // Columnas: solo los juegos con al menos una puntuación, en el orden del
  // catálogo. Sin estadísticas no se sabe cuáles son, y la matriz entera se da
  // por no disponible en vez de pintar columnas a medias.
  const columns: MatrixColumn[] = games
    .filter((g) => (stats?.get(g.id)?.count ?? 0) > 0)
    .map((g) => ({ id: g.id, title: g.title, color: g.color }));
  return (
    <HallOfFameBoard tabs={games.map((g) => ({ id: g.id, title: g.title }))} rows={rowsByGame}>
      {/* Server Component pasado como hijo del componente cliente de las pestañas. */}
      <PlayerMatrix rows={stats ? matrix : null} columns={columns} />
    </HallOfFameBoard>
  );
}
