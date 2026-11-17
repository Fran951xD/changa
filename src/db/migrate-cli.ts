/* Aplica las migraciones pendientes. Uso: DATABASE_URL=postgres://… npm run db:migrate */
import { createDb } from "./index";
import { runMigrations } from "./migrate";

runMigrations(createDb())
  .then(() => { console.log("Migraciones aplicadas."); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
