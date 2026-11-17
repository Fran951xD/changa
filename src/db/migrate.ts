import { migrate as migratePg } from "drizzle-orm/postgres-js/migrator";
import { migrate as migrateLite } from "drizzle-orm/pglite/migrator";
import type { DB } from "./index";

export async function runMigrations(db: DB, url = process.env.DATABASE_URL) {
  const opts = { migrationsFolder: "drizzle" };
  if (url?.startsWith("postgres")) await migratePg(db, opts);
  else await migrateLite(db as never, opts);
}
