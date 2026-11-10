import RankingNotice from "@/app/components/RankingNotice";
import type { ScoreRow } from "@/app/lib/types";
import { formatScore } from "@/app/lib/format";
/** Las tres primeras filas llevan clase propia (`top1`/`top2`/`top3`) en globals.css. */
function podiumClass(index: number) {
  if (index === 0) return " top1";
  if (index === 1) return " top2";
  if (index === 2) return " top3";
  return "";
}
/** `rows`: `null` = "RANKING NO DISPONIBLE", `[]` = "SIN PUNTUACIONES TODAVÍA". */
export default function Leaderboard({ rows }: { rows: ScoreRow[] | null }) {
  return (
    <div className="leaderboard">
      <h3>MEJORES PUNTUACIONES</h3>
      <RankingNotice rows={rows} />
      {rows?.map((r, i) => (
        <div key={r.name} className={"lb-row" + podiumClass(i)}>
          <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
          <div className="pl">
            {r.name}
            <div
              style={{
                fontSize: 10,
                color: "var(--ink-faint)",
                letterSpacing: "0.1em",
              }}
            >
              {r.date}
            </div>
          </div>
          <div className="sc">{formatScore(r.score)}</div>
        </div>
      ))}
    </div>
  );
}
