"use client";
import { useEffect } from "react";
// Frontera de error de toda la app (spec 06): salta cuando falla el catálogo, que
// es lo único que lanza en la capa de datos — sin juegos no hay página que salvar.
// Si solo fallan las puntuaciones, cada bloque degrada a "RANKING NO DISPONIBLE" y
// esta pantalla no aparece. Misma composición que `not-found.tsx`.
// `unstable_retry` (Next 16) vuelve a pedir los datos y a renderizar el segmento;
// `reset` solo re-renderiza sin volver a pedir nada, y no serviría aquí.
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="fade-in" style={{ textAlign: "center", padding: "120px 32px 140px" }}>
      <div className="pixel neon-magenta" style={{ fontSize: 56, letterSpacing: "0.12em" }}>
        ERROR
      </div>
      <div className="pixel neon-cyan" style={{ fontSize: 14, marginTop: 22 }}>
        EL VAULT NO RESPONDE
      </div>
      <p
        className="mono"
        style={{
          marginTop: 16,
          fontSize: 12,
          color: "var(--ink-dim)",
          letterSpacing: "0.16em",
        }}
      >
        NO SE PUDO CARGAR EL CATÁLOGO DE JUEGOS
      </p>
      {error.digest && (
        <p
          className="mono"
          style={{
            marginTop: 8,
            fontSize: 10,
            color: "var(--ink-dim)",
            letterSpacing: "0.16em",
          }}
        >
          REF {error.digest}
        </p>
      )}
      <div style={{ marginTop: 36 }}>
        <button type="button" className="btn lg" onClick={() => unstable_retry()}>
          REINTENTAR
        </button>
      </div>
    </div>
  );
}
