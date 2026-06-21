import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

/**
 * Archivo afectado:
 * eslint.config.mjs
 *
 * Configuración de ESLint para el proyecto.
 *
 * Importante:
 * ESLint solo debe revisar nuestro código fuente.
 * No debe revisar:
 * - .next/
 * - node_modules/
 * - dist/
 * - build/
 *
 * Esas carpetas contienen código generado por herramientas externas.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;