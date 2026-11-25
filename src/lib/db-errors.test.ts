import { beforeAll, describe, expect, it } from "vitest";
import { createDb, schema, type DB } from "@/db";
import { runMigrations } from "@/db/migrate";
import { isUniqueViolation } from "./db-errors";

let db: DB;
let review: typeof schema.reviews.$inferInsert;

beforeAll(async () => {
  db = createDb("memory");
  await runMigrations(db, "memory");
  const [u] = await db.insert(schema.users).values({ email: "r@t.test" }).returning();
  const [w] = await db.insert(schema.workers).values({ userId: u.id, slug: "r", displayName: "R" }).returning();
  review = { workerId: w.id, authorId: u.id, authorName: "Ana", rating: 5, text: "Muy bien, llegó a horario." };
  await db.insert(schema.reviews).values(review);
});

const errorOf = (p: Promise<unknown>) => p.then(() => null, (e: unknown) => e);

describe("isUniqueViolation (con Postgres real en PGlite)", () => {
  it("reconoce la segunda reseña del mismo autor al mismo trabajador", async () => {
    const e = await errorOf(db.insert(schema.reviews).values(review));
    expect(e).not.toBeNull();
    expect(isUniqueViolation(e)).toBe(true);
  });

  it("no confunde otros errores de la base con una reseña repetida", async () => {
    const e = await errorOf(db.insert(schema.reviews).values({ ...review, workerId: crypto.randomUUID() }));
    expect(e).not.toBeNull();
    expect(isUniqueViolation(e)).toBe(false);
  });

  it("no rompe con valores que no son errores", () => {
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation("23505")).toBe(false);
  });
});
