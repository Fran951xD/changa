import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("un vecino denuncia una reseña, la moderación la oculta y deja de verse en el perfil", async ({ page }) => {
  await page.goto("/juan-plomero");
  const review = page.locator(".resena").last();
  const text = (await review.locator("p").nth(2).textContent())!;
  const domId = (await review.getAttribute("id"))!; // los textos de la semilla se repiten: identificamos por id
  await review.getByRole("link", { name: "Denunciar reseña" }).click();

  await page.getByLabel("Es ofensivo o discriminatorio").check();
  await page.getByLabel(/Contanos más/).fill("Insulta al trabajador.");
  await page.getByRole("button", { name: "Enviar denuncia" }).click();
  await expect(page.getByText("Recibimos tu denuncia.")).toBeVisible();

  // Un usuario común no entra a moderación.
  await login(page, "cliente@changa.test", "/panel");
  await page.goto("/admin");
  await expect(page).toHaveURL("/");

  await page.context().clearCookies();
  await login(page, "admin@changa.test", "/admin");
  const item = page.locator("li.panel").filter({ hasText: "Insulta al trabajador." });
  await expect(item).toContainText(text);
  await item.getByRole("button", { name: "Ocultar reseña" }).click();
  await expect(page.getByText("No hay denuncias abiertas.")).toBeVisible();

  await page.goto("/juan-plomero");
  await expect(page.locator(`#${domId}`)).toHaveCount(0);

  await page.goto("/admin?ver=resueltas");
  await expect(page.locator("li.panel").filter({ hasText: "Insulta al trabajador." }).getByRole("button", { name: "Volver a mostrar" })).toBeVisible();
});

test("SEO: sitemap, robots, datos estructurados y metadatos del perfil", async ({ page, request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/juan-plomero</loc>");
  expect(sitemap).toContain("/plomeros/palermo</loc>");
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /panel");

  await page.goto("/juan-plomero");
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld["@type"]).toBe("LocalBusiness");
  expect(ld.aggregateRating.reviewCount).toBeGreaterThan(0);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/api\/img\/[0-9a-f-]{36}$/);
  // La foto del perfil tiene que cargar de verdad (no solo estar en el HTML).
  const src = await page.locator(".perfil-grid img.iman-foto").first().getAttribute("src");
  const img = await page.request.get(src!);
  expect(img.status()).toBe(200);
  expect(img.headers()["content-type"]).toBe("image/webp");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/juan-plomero$/);
  await expect(page).toHaveTitle("Juan Pérez, plomero en Palermo · Changa");
});
