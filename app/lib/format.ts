// Formato de puntuaciones y conteos de toda la web: "1.200", "12.800", "10.000.000".
// `toLocaleString("es-ES")` no agrupa los números de 4 cifras ("1200") por la regla
// de agrupación mínima del español en CLDR, y en una misma columna se veían "8259"
// y "12.807" juntos. `useGrouping: "always"` agrupa siempre. Una sola instancia
// compartida: se usa en servidor y en cliente, y da lo mismo en los dos.
const SCORE_FORMAT = new Intl.NumberFormat("es-ES", { useGrouping: "always" });
export function formatScore(n: number): string {
  return SCORE_FORMAT.format(n);
}
