import RankingNotice from "@/app/components/RankingNotice";
import type { Accent, PlayerRow } from "@/app/lib/types";
import { formatScore } from "@/app/lib/format";
// Matriz POR JUGADOR del hall of fame (spec 06). Server Component: recibe los
// datos ya leídos y no tiene estado. Se pinta dos veces y el CSS elige una:
// tabla en ≥ 768px y tarjetas apiladas por debajo, sin scroll horizontal.
export type MatrixColumn = { id: string; title: string; color: Accent };
/** Las tres primeras plazas usan los colores del podio. */
function placeClass(rank: number) {
  if (rank === 1) return " top1";
  if (rank === 2) return " top2";
  if (rank === 3) return " top3";
  return "";
}
const rankLabel = (rank: number) => "#" + String(rank).padStart(2, "0");
/**
 * `rows`: top 20 por marca individual más alta (`null` = no disponible).
 * `columns`: solo los juegos con al menos una puntuación, en el orden del catálogo.
 */
export default function PlayerMatrix({
  rows,
  columns,
}: {
  rows: PlayerRow[] | null;
  columns: MatrixColumn[];
}) {
  return (
    <section className="pm" aria-labelledby="pm-title">
      <div className="section-head">
        <h2 id="pm-title" className="section-title">
          POR JUGADOR
        </h2>
        <div className="section-rule" />
      </div>
      <p className="pm-sub">
        LA MEJOR MARCA DE CADA JUGADOR EN CADA JUEGO. ILUMINADA, LA QUE LE DA SU PUESTO.
      </p>
      {rows === null || rows.length === 0 ? (
        <div className="pm-frame">
          <RankingNotice rows={rows} />
        </div>
      ) : (
        <>
          {/* ≥ 768px: tabla */}
          <div className="pm-frame pm-desk">
            <table className="pm-table">
              <thead>
                <tr>
                  <th scope="col" className="pm-rk">
                    RANGO
                  </th>
                  <th scope="col" className="pm-pl">
                    JUGADOR
                  </th>
                  {columns.map((c) => (
                    <th key={c.id} scope="col" className={"pm-game " + c.color}>
                      {c.title}
                    </th>
                  ))}
                  <th scope="col" className="pm-best">
                    MEJOR
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} className={placeClass(r.rank).trim() || undefined}>
                    <td className="pm-rk">{rankLabel(r.rank)}</td>
                    <th scope="row" className="pm-pl">
                      {r.name}
                    </th>
                    {columns.map((c) => {
                      const score = r.scores[c.id];
                      if (score === undefined) {
                        return (
                          <td key={c.id} className="pm-cell none">
                            —
                          </td>
                        );
                      }
                      const lit = score === r.best;
                      return (
                        <td key={c.id} className={"pm-cell" + (lit ? " lit " + c.color : "")}>
                          {formatScore(score)}
                        </td>
                      );
                    })}
                    <td className="pm-best">{formatScore(r.best)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* < 768px: tarjetas. Solo los juegos en los que ha jugado: ni "—" ni scroll. */}
          <ol className="pm-cards">
            {rows.map((r) => (
              <li key={r.name} className={"pm-card" + placeClass(r.rank)}>
                <div className="pm-card-head">
                  <span className="pm-rk">{rankLabel(r.rank)}</span>
                  <span className="pm-pl">{r.name}</span>
                  <span className="pm-best">{formatScore(r.best)}</span>
                </div>
                <ul className="pm-lines">
                  {columns
                    .filter((c) => r.scores[c.id] !== undefined)
                    .map((c) => {
                      const score = r.scores[c.id];
                      return (
                        <li
                          key={c.id}
                          className={"pm-line " + c.color + (score === r.best ? " lit" : "")}
                        >
                          <span className="pm-line-title">{c.title}</span>
                          <span className="pm-leader" aria-hidden="true" />
                          <span className="pm-line-score">{formatScore(score)}</span>
                        </li>
                      );
                    })}
                </ul>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
