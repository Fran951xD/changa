import { test, expect } from "@playwright/test";
import sharp from "sharp";
import { login } from "./helpers";

test("un trabajador nuevo se registra, verifica su celular y publica su tarjeta", async ({ page }) => {
  await login(page, `nueva.electricista.${Date.now()}@changa.test`);
  await page.getByRole("button", { name: "Armar mi tarjeta" }).click();
  await expect(page.getByRole("heading", { name: "Tu tarjeta" })).toBeVisible();

  // Publicar sin datos explica qué falta.
  await page.getByLabel("Tu nombre").fill("Rosa Benítez");
  await page.getByRole("button", { name: "Guardar y publicar" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Para publicar te falta" })).toContainText("al menos un oficio");

  // Celular: número como lo escribe la gente; el código aparece en modo demo.
  await page.getByLabel("Número de celular").fill("11 15 4321-0000");
  await page.getByRole("button", { name: "Seguir" }).click();
  // Sin SMS (como en producción): se abre WhatsApp hacia el número cargado y el trabajador confirma que es su chat.
  await expect(page.getByRole("link", { name: "Abrir WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/5491143210000\?text=/);
  await page.getByRole("button", { name: "Sí, se abrió mi chat" }).click();
  await expect(page.getByText("Confirmado: 11 4321-0000")).toBeVisible();

  await page.getByPlaceholder("Buscar: gas, pintor, aire…").fill("electri");
  await page.getByText("Electricidad", { exact: true }).click();
  await page.getByLabel("Provincia", { exact: true }).selectOption("caba");
  await page.getByLabel("Agregá ciudades o barrios").fill("caba");
  await page.getByRole("option", { name: /Caballito/ }).click();
  await page.getByLabel("Agregá ciudades o barrios").fill("almag");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Quitar Almagro" })).toBeVisible();
  await page.getByLabel("Atiendo urgencias fuera de horario").check();
  await page.getByLabel("Número de matrícula").fill("MAT-12345");

  await page.getByRole("button", { name: "Guardar y publicar" }).click();
  await expect(page).toHaveURL(/\/panel\?publicado=1/);
  await expect(page.getByText("¡Publicaste tu tarjeta!")).toBeVisible();

  await page.getByRole("link", { name: "Ver mi perfil público" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Rosa Benítez" })).toBeVisible();
  await expect(page.getByText("Matrícula informada").first()).toBeVisible();
  // El teléfono no está en el HTML del perfil.
  expect(await page.content()).not.toContain("5491143210000");

  // Foto de varios MB, como sale de un celular: se achica en el navegador y se sube.
  const big = await sharp({ create: { width: 3200, height: 2400, channels: 3, background: "#808080", noise: { type: "gaussian", mean: 128, sigma: 40 } } }).jpeg({ quality: 95 }).toBuffer();
  expect(big.length).toBeGreaterThan(4.5 * 1024 * 1024);
  await page.goto("/panel/perfil");
  await page.getByLabel(/Foto de perfil/).setInputFiles({ name: "foto.jpg", mimeType: "image/jpeg", buffer: big });
  await expect(page.getByText("Foto actualizada.")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("img", { name: "Tu foto de perfil" })).toBeVisible();
});
