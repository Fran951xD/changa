import {
  pgTable, uuid, text, timestamp, boolean, integer, smallint, real, jsonb, date,
  primaryKey, index, uniqueIndex, customType,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType: () => "bytea",
  fromDriver: (v) => Buffer.from(v),
});

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ---------- Cuentas ----------
export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  googleId: text("google_id").unique(),
  name: text("name"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: createdAt(),
});

export const sessions = pgTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (t) => [index("sessions_user_idx").on(t.userId)]);

export const loginTokens = pgTable("login_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  email: text("email").notNull(),
  next: text("next"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

// ---------- Imágenes (guardadas ya comprimidas en WebP) ----------
// shortcut: bytes en Postgres (~60 KB c/u, entra en el plan gratis); con miles de fotos pasar a R2/Blob.
export const images = pgTable("images", {
  id: id(),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  data: bytea("data").notNull(),
  thumb: bytea("thumb").notNull(),
  createdAt: createdAt(),
});

// ---------- Trabajadores ----------
export type Schedule = { days: number[]; from: string; to: string };

export const workers = pgTable("workers", {
  id: id(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  photoId: uuid("photo_id").references(() => images.id, { onDelete: "set null" }),
  description: text("description").notNull().default(""),
  yearsExperience: smallint("years_experience"),
  phone: text("phone"), // normalizado para WhatsApp: 5491123456789
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  phoneCodeHash: text("phone_code_hash"),
  phoneCodeExpiresAt: timestamp("phone_code_expires_at", { withTimezone: true }),
  phoneCodeAttempts: smallint("phone_code_attempts").notNull().default(0),
  pendingPhone: text("pending_phone"),
  licenseNumber: text("license_number"),
  urgencies: boolean("urgencies").notNull().default(false),
  availableUntil: timestamp("available_until", { withTimezone: true }), // "Disponible ahora" vence solo
  paymentMethods: text("payment_methods").array().notNull().default([]),
  schedule: jsonb("schedule").$type<Schedule>(),
  zoneMode: text("zone_mode", { enum: ["areas", "radius"] }).notNull().default("areas"),
  baseLat: real("base_lat"),
  baseLng: real("base_lng"),
  radiusKm: smallint("radius_km"),
  status: text("status", { enum: ["draft", "published", "hidden"] }).notNull().default("draft"),
  ratingAvg: real("rating_avg").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("workers_status_idx").on(t.status), index("workers_geo_idx").on(t.baseLat, t.baseLng)]);

export const workerTrades = pgTable("worker_trades", {
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  trade: text("trade").notNull(),
}, (t) => [primaryKey({ columns: [t.workerId, t.trade] }), index("worker_trades_trade_idx").on(t.trade)]);

// Las coordenadas se copian del listado de barrios para poder calcular distancias en SQL.
export const workerAreas = pgTable("worker_areas", {
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  area: text("area").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
}, (t) => [primaryKey({ columns: [t.workerId, t.area] }), index("worker_areas_area_idx").on(t.area)]);

export const workerPhotos = pgTable("worker_photos", {
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  imageId: uuid("image_id").notNull().references(() => images.id, { onDelete: "cascade" }),
  position: smallint("position").notNull(),
}, (t) => [primaryKey({ columns: [t.workerId, t.imageId] })]);

// ---------- Contactos y visitas ----------
// visitorId = cookie anónima; así un cliente sin cuenta puede reseñar después de loguearse.
export const contacts = pgTable("contacts", {
  id: id(),
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  visitorId: text("visitor_id").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  channel: text("channel", { enum: ["whatsapp", "call", "quote"] }).notNull(),
  createdAt: createdAt(),
}, (t) => [
  index("contacts_worker_idx").on(t.workerId, t.createdAt),
  index("contacts_visitor_idx").on(t.visitorId),
  index("contacts_user_idx").on(t.userId),
]);

export const profileViews = pgTable("profile_views", {
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  day: date("day").notNull(),
  count: integer("count").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.workerId, t.day] })]);

// ---------- Reseñas ----------
export const reviews = pgTable("reviews", {
  id: id(),
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  rating: smallint("rating").notNull(),
  text: text("text").notNull(),
  punctual: boolean("punctual"),
  tidy: boolean("tidy"),
  fairPrice: boolean("fair_price"),
  reply: text("reply"),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  status: text("status", { enum: ["visible", "hidden"] }).notNull().default("visible"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("reviews_one_per_pair").on(t.workerId, t.authorId), index("reviews_worker_idx").on(t.workerId)]);

// ---------- Pedidos de presupuesto ----------
export const quoteRequests = pgTable("quote_requests", {
  id: id(),
  visitorId: text("visitor_id").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  trade: text("trade").notNull(),
  area: text("area").notNull(),
  description: text("description").notNull(),
  photoIds: uuid("photo_ids").array().notNull().default([]),
  createdAt: createdAt(),
});

export const quoteRecipients = pgTable("quote_recipients", {
  quoteId: uuid("quote_id").notNull().references(() => quoteRequests.id, { onDelete: "cascade" }),
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  seenAt: timestamp("seen_at", { withTimezone: true }),
}, (t) => [primaryKey({ columns: [t.quoteId, t.workerId] }), index("quote_recipients_worker_idx").on(t.workerId)]);

// ---------- Moderación ----------
export const reports = pgTable("reports", {
  id: id(),
  targetType: text("target_type", { enum: ["worker", "review"] }).notNull(),
  targetId: uuid("target_id").notNull(),
  reason: text("reason").notNull(),
  details: text("details").notNull().default(""),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status", { enum: ["open", "resolved", "dismissed"] }).notNull().default("open"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("reports_status_idx").on(t.status)]);

// ---------- Límites de uso (funciona en serverless: el estado vive en la base) ----------
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull(),
});
