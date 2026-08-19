import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Código sin líneas en blanco: solo el código, sin aire de por medio.
  // Prettier colapsa varias líneas vacías en una; estas reglas la eliminan del todo
  // vía `--fix`. El hook de PostToolUse corre Prettier primero y ESLint después,
  // así que el resultado final no tiene ninguna. Solo aplica a archivos de código
  // (js/ts/jsx/tsx) — el Markdown conserva sus líneas en blanco, que ahí sí importan.
  {
    rules: {
      "no-multiple-empty-lines": ["error", { max: 0, maxEOF: 0, maxBOF: 0 }],
      "padded-blocks": ["error", "never"],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Plantillas de referencia: scripts UMD que toman React y sus componentes
    // de `window`, no módulos de la aplicación. No se importan desde `app/`.
    "references/**",
  ]),
]);
export default eslintConfig;
