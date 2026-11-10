import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Leaderboard from "@/app/components/Leaderboard";
import { isPlayable } from "@/app/lib/arcade/registry";
import { getGame } from "@/app/lib/data/games";
import { getGameStats, getLeaderboard } from "@/app/lib/data/scores";
import { formatScore } from "@/app/lib/format";
type Props = { params: Promise<{ id: string }> };
// Se renderiza en cada petición (spec 06): una puntuación recién guardada tiene
// que verse al recargar, sin rebuild ni caché. Un id desconocido cae en notFound().
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(id);
  return { title: game?.title ?? "Juego no encontrado" };
}
export default async function GameDetailPage({ params }: Props) {
  const { id } = await params;
  // `getGame` lanza si falla el catálogo (lo recoge error.tsx); las puntuaciones
  // devuelven `null` y solo degradan su bloque.
  const [game, rows, stats] = await Promise.all([
    getGame(id),
    getLeaderboard(id, 10),
    getGameStats(),
  ]);
  if (!game) notFound();
  // Sin lectura de estadísticas no se sabe ni el récord ni el conteo: "—".
  // Con lectura pero sin filas del juego, el récord es "—" y el conteo es 0.
  const gameStats = stats?.get(game.id);
  const best = gameStats ? formatScore(gameStats.best) : "—";
  const count = stats ? formatScore(gameStats?.count ?? 0) : "—";
  return (
    <div className="av-detail fade-in">
      <div>
        <div className="detail-cover">
          <div className={"cover-bg " + game.cover} />
          {isPlayable(game.id) && <div className="playable-badge">JUGABLE</div>}
        </div>
        <div style={{ marginTop: 20 }} className="detail-info">
          <div className="detail-tags">
            <span>{game.cat}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>
          <h2 className="neon-cyan">{game.title}</h2>
          <p>{game.long}</p>
          <div className="stat-strip">
            <div>
              <div className="l">Puntuaciones</div>
              <div className="v">{count}</div>
            </div>
            <div>
              <div className="l">Mejor global</div>
              <div
                className="v"
                style={{
                  color: "var(--magenta)",
                  textShadow: "0 0 6px rgba(255,0,110,0.5)",
                }}
              >
                {best}
              </div>
            </div>
            <div>
              <div className="l">Dificultad</div>
              <div
                className="v"
                style={{
                  color: "var(--yellow)",
                  textShadow: "0 0 6px rgba(245,255,0,0.5)",
                }}
              >
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>
          <div className="detail-actions">
            <Link className="btn xl pulse" href={`/games/${game.id}/play`}>
              ▶ JUGAR AHORA
            </Link>
            <Link className="btn ghost lg" href="/games">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>
      <aside>
        <Leaderboard rows={rows} />
      </aside>
    </div>
  );
}
