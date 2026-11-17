import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Las fotos ya se guardan como WebP redimensionado al subirlas; next/image las procesaría dos veces.
  { rules: { "@next/next/no-img-element": "off" } },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".data/**", "playwright-report/**", "test-results/**"]),
]);

export default eslintConfig;
