import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzleLite } from "drizzle-orm/pglite";
import postgres from "postgres";
import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

export type DB = ReturnType<typeof drizzlePg<typeof schema>>;

/**
 * Con DATABASE_URL (Neon/Supabase) usa postgres-js. Sin ella, PGlite: Postgres real
 * corriendo en el proceso, guardado en .data/ — así se clona y corre sin instalar nada.
 */
export function createDb(url = process.env.DATABASE_URL): DB {
  if (url?.startsWith("postgres")) {
    return drizzlePg(postgres(url, { prepare: false, max: 5 }), { schema });
  }
  const dir = url === "memory" ? undefined : url || ".data/pglite";
  if (dir) mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  // Mismo query builder; los tipos difieren solo en el resultado de execute(), que no usamos.
  return drizzleLite(client, { schema }) as unknown as DB;
}

// Se conecta recién en la primera consulta: el build de Next importa los módulos sin usar la base.
const g = globalThis as unknown as { __db?: DB };
export const db = new Proxy({} as DB, {
  get(_, prop) {
    const real = (g.__db ??= createDb());
    const value = Reflect.get(real, prop);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
export { schema };
