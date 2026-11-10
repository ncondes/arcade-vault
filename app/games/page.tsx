import type { Metadata } from "next";
import GameLibrary from "@/app/components/GameLibrary";
import { getGames } from "@/app/lib/data/games";
import { getGameStats } from "@/app/lib/data/scores";
export const metadata: Metadata = {
  title: "Biblioteca",
};
// El catálogo y los récords se leen aquí, en el servidor, y bajan por props: el
// navegador no habla con Supabase. Si falla el catálogo, `getGames` lanza y sale
// error.tsx; si fallan las puntuaciones, cada tarjeta muestra "—".
export default async function GamesPage() {
  const [games, stats] = await Promise.all([getGames(), getGameStats()]);
  // gameId -> récord, como objeto plano para cruzar la frontera al Client Component.
  const bests: Record<string, number> = {};
  for (const [id, s] of stats ?? []) bests[id] = s.best;
  return <GameLibrary games={games} bests={bests} />;
}
