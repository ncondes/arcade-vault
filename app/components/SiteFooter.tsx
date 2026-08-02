// Estilos en línea portados de `references/templates/app.jsx:43-45`.
// `globals.css` no define ninguna clase para el pie y esta spec no lo modifica.
const footerStyle: React.CSSProperties = {
  borderTop: "1px solid var(--line)",
  padding: "20px 32px",
  textAlign: "center",
  color: "var(--ink-faint)",
  fontFamily: "var(--mono)",
  fontSize: 11,
  letterSpacing: "0.16em",
};

export default function SiteFooter() {
  return (
    <footer style={footerStyle}>
      © 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0
    </footer>
  );
}
