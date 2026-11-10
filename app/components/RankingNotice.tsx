// Los dos estados sin filas de cualquier bloque de ranking (spec 06). La capa de
// datos los distingue y la UI no los confunde: `null` es que la lectura falló,
// `[]` es que todavía nadie ha guardado una puntuación.
export const RANKING_UNAVAILABLE = "RANKING NO DISPONIBLE";
export const RANKING_EMPTY = "SIN PUNTUACIONES TODAVÍA";
/** El aviso para `rows` vacío o `null`, o `null` si hay filas que pintar. */
export default function RankingNotice({ rows }: { rows: readonly unknown[] | null }) {
  if (rows === null) {
    return (
      <div className="rank-notice off" role="status">
        {RANKING_UNAVAILABLE}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rank-notice" role="status">
        {RANKING_EMPTY}
      </div>
    );
  }
  return null;
}
