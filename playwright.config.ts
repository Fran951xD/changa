import { defineConfig, devices } from "@playwright/test";

// Corre contra el build de producción con una base PGlite aparte, recién sembrada.
// DEMO_MODE=1 muestra en pantalla el enlace mágico y el código SMS (no hay mail ni SMS reales).
const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, locale: "es-AR", trace: "retain-on-failure" },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run db:seed && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: { DATABASE_URL: ".data/e2e", DEMO_MODE: "1", PHONE_VERIFICATION: "whatsapp", RATE_LIMIT_PER_MIN: "100000", NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}` },
  },
});
