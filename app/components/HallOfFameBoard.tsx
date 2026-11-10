"use client";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import RankingNotice from "@/app/components/RankingNotice";
import type { ScoreRow } from "@/app/lib/types";
import { formatScore } from "@/app/lib/format";
/** Las tres primeras filas de la tabla llevan clase propia en globals.css. */
function podiumClass(index: number) {
  if (index === 0) return " top1";
  if (index === 1) return " top2";
  if (index === 2) return " top3";
  return "";
}
/** Una plaza del podio. Solo se pinta si existe la fila: el podio tolera 0, 1 o 2. */
function PodiumSlot({ row, place }: { row: ScoreRow; place: 1 | 2 | 3 }) {
  if (place === 1) {
    return (
      <div className="podium-slot gold">
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: "var(--gold)",
            letterSpacing: "0.18em",
          }}
        >
          CAMPEÓN
        </div>
        <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>
          01
        </div>
        <div className="name">{row.name}</div>
        <div className="score" style={{ fontSize: 20 }}>
          {formatScore(row.score)}
        </div>
        <div className="date">{row.date}</div>
      </div>
    );
  }
  return (
    <div className={"podium-slot " + (place === 2 ? "silver" : "bronze")}>
      <div className="rank-num">0{place}</div>
      <div className="name">{row.name}</div>
      <div className="score">{formatScore(row.score)}</div>
      <div className="date">{row.date}</div>
    </div>
  );
}
/**
 * `tabs`: el catálogo en orden. `rows`: gameId -> top 12 real (una fila por nombre);
 * `null` = "RANKING NO DISPONIBLE", `[]` = "SIN PUNTUACIONES TODAVÍA".
 * `children`: la matriz POR JUGADOR, que no depende de la pestaña activa.
 */
export default function HallOfFameBoard({
  tabs,
  rows: rowsByGame,
  children,
}: {
  tabs: { id: string; title: string }[];
  rows: Record<string, ScoreRow[] | null>;
  children?: ReactNode;
}) {
  const [tab, setTab] = useState(tabs[0]?.id ?? "");
  const rows = rowsByGame[tab] ?? null;
  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>
      <div className="hall-tabs">
        {tabs.map((g) => (
          <button
            key={g.id}
            className={"chip" + (tab === g.id ? " active" : "")}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>
      {rows && rows.length > 0 && (
        <div className="podium">
          {rows[1] && <PodiumSlot row={rows[1]} place={2} />}
          <PodiumSlot row={rows[0]} place={1} />
          {rows[2] && <PodiumSlot row={rows[2]} place={3} />}
        </div>
      )}
      <div className="hall-table">
        <RankingNotice rows={rows} />
        {rows && rows.length > 0 && (
          <div className="th">
            <div>RANGO</div>
            <div>JUGADOR</div>
            <div>PUNTUACIÓN</div>
            <div>FECHA</div>
          </div>
        )}
        {rows?.map((r, i) => (
          <div
            key={r.name}
            className={"tr" + podiumClass(i)}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
            <div className="pl">{r.name}</div>
            <div className="sc">{formatScore(r.score)}</div>
            <div className="dt">{r.date}</div>
          </div>
        ))}
      </div>
      {children}
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link className="btn lg" href="/games">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
