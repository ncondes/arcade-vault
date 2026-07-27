import Link from "next/link";

// Cubre a la vez el notFound() del detalle y cualquier URL sin ruta.
// Compuesta solo con utilidades ya existentes en globals.css.
export default function NotFound() {
  return (
    <div
      className="fade-in"
      style={{ textAlign: "center", padding: "120px 32px 140px" }}
    >
      <div
        className="pixel neon-magenta"
        style={{ fontSize: 56, letterSpacing: "0.12em" }}
      >
        404
      </div>

      <div className="pixel neon-cyan" style={{ fontSize: 14, marginTop: 22 }}>
        SEÑAL PERDIDA
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
        ESTA PANTALLA NO EXISTE EN EL VAULT
      </p>

      <div style={{ marginTop: 36 }}>
        <Link href="/" className="btn lg">
          VOLVER AL VAULT
        </Link>
      </div>
    </div>
  );
}
