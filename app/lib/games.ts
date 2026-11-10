import type { CategoryFilter } from "@/app/lib/types";
// El catálogo vive en la tabla `games` de Supabase y se lee con `app/lib/data/games.ts`.
// Aquí solo queda lo que es de UI: los filtros de la biblioteca.
export const CATEGORY_FILTERS: CategoryFilter[] = [
  "TODOS",
  "ARCADE",
  "PUZZLE",
  "SHOOTER",
  "VERSUS",
];
