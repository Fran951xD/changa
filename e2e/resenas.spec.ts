import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.beforeEach(async ({ context }) => {
  await context.route("https://wa.me/**", (route) => route.fulfill({ body: "ok" }));
});

test("una clienta que contactó hace 3 días deja una reseña, y no puede dejar otra", async ({ page }) => {
  await login(page, "cliente@changa.test", "/juan-plomero/resenar");
  await page.getByLabel(/Excelente/).check();
  await page.getByLabel("Contá tu experiencia").fill("Vino puntual, arregló la pérdida del baño y dejó todo limpio.");
  await page.getByLabel("Puntual").check();
  await page.getByLabel("Tu nombre").fill("Ana Castro");
  await page.getByRole("button", { name: "Publicar reseña" }).click();

  await expect(page).toHaveURL(/\/juan-plomero\?resena=ok/);
  await expect(page.getByText("¡Gracias! Tu reseña ya está publicada.")).toBeVisible();
  await expect(page.locator(".resena").first()).toContainText("Ana C.");
  await expect(page.locator(".resena").first()).toContainText("dejó todo limpio");

  await page.goto("/juan-plomero/resenar");
  await expect(page.getByText("Ya dejaste una reseña para Juan")).toBeVisible();
});

test("quien contacta recién tiene que esperar un día; sin contacto no puede reseñar", async ({ page }) => {
  const email = `vecino.${Date.now()}@changa.test`;
  await login(page, email, "/juan-plomero/resenar");
  await expect(page.getByText("solo pueden opinar quienes contactaron a Juan desde Changa")).toBeVisible();

  await page.goto("/juan-plomero");
  await page.locator(".perfil-side").getByRole("button", { name: /por WhatsApp/ }).click();
  await page.goto("/juan-plomero/resenar");
  await expect(page.getByText("Le escribiste hace poco. Podés dejar tu reseña desde el")).toBeVisible();
});

test("el trabajador responde una reseña en público y la puede denunciar, pero no borrar", async ({ page }) => {
  await login(page, "juan@changa.test", "/panel/resenas");
  const first = page.locator("li.panel").first();
  await first.getByRole("textbox").fill("¡Gracias por la confianza, un gusto!");
  await first.getByRole("button", { name: /respuesta/ }).click();
  await expect(first.getByText("Tu respuesta (podés editarla)")).toBeVisible();
  await expect(page.getByRole("button", { name: /borrar/i })).toHaveCount(0);

  await page.goto("/juan-plomero");
  await expect(page.locator(".respuesta").filter({ hasText: "¡Gracias por la confianza, un gusto!" })).toBeVisible();
});

test("un vecino pide presupuesto a 3 plomeros y le llega a Juan en su panel", async ({ page }) => {
  await page.goto("/presupuesto?oficio=plomeria&zona=palermo");
  await page.getByLabel("Describí el trabajo").fill("Se tapó la pileta de la cocina y pierde el sifón. Departamento en planta baja.");
  await expect(page.locator('input[name="workers"]:checked')).toHaveCount(3);
  await page.getByLabel("Tu nombre").fill("Marta");
  await page.getByLabel("Tu celular con WhatsApp").fill("11 5555-1234");
  await page.getByRole("button", { name: /Mandar pedido a 3 trabajadores/ }).click();
  await expect(page.getByRole("heading", { name: "¡Pedido enviado!" })).toBeVisible();

  await page.context().clearCookies();
  await login(page, "juan@changa.test", "/panel/pedidos");
  const pedido = page.locator("li.panel").filter({ hasText: "Se tapó la pileta" });
  await expect(pedido).toContainText("Marta");
  await expect(pedido.getByRole("link", { name: "Responder por WhatsApp" })).toHaveAttribute("href", /wa\.me\/5491155551234/);
});

test("el presupuesto valida los datos y explica cómo corregirlos", async ({ page }) => {
  await page.goto("/presupuesto?oficio=plomeria&zona=palermo");
  await page.getByLabel("Describí el trabajo").fill("corto");
  await page.getByLabel("Tu celular con WhatsApp").fill("2345");
  await page.getByRole("button", { name: /Mandar pedido/ }).click();
  await expect(page.getByText("Contá un poco más del trabajo")).toBeVisible();
  await expect(page.getByText("Revisá el celular: escribilo con código de área")).toBeVisible();
});
