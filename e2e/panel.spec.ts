import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("el trabajador ve sus estadísticas, prende Disponible ahora y comparte su link con QR", async ({ page }) => {
  await login(page, "juan@changa.test", "/panel");
  await expect(page.getByRole("heading", { name: "Últimos 7 días" })).toBeVisible();
  await expect(page.getByText("visitas a tu perfil")).toBeVisible();
  await expect(page.getByRole("table")).toContainText("Semana del");

  const sw = page.getByRole("switch", { name: "Disponible ahora" });
  const before = await sw.getAttribute("aria-checked");
  await sw.click();
  await expect(sw).not.toHaveAttribute("aria-checked", before!);

  await page.getByRole("link", { name: "Compartir" }).click();
  await expect(page.getByText("/juan-plomero", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("img", { name: /Código QR/ }).locator("svg")).toBeVisible();

  // Link propio: valida, cambia y el perfil responde en la URL nueva.
  await page.getByLabel(/Cambiar tu link/).fill("Juan Plomero!");
  await page.getByRole("button", { name: "Guardar link" }).click();
  await expect(page.getByText("Usá solo letras sin tilde")).toBeVisible();
  await page.getByLabel(/Cambiar tu link/).fill("buscar");
  await page.getByRole("button", { name: "Guardar link" }).click();
  await expect(page.getByText("Ese link está reservado")).toBeVisible();
  await page.getByLabel(/Cambiar tu link/).fill("juan-plomero-palermo");
  await page.getByRole("button", { name: "Guardar link" }).click();
  await expect(page.getByText("¡Listo! Tu link nuevo ya funciona.")).toBeVisible();
  await page.goto("/juan-plomero-palermo");
  await expect(page.getByRole("heading", { level: 1, name: "Juan Pérez" })).toBeVisible();

  // Lo dejamos como estaba para las demás pruebas.
  await page.goto("/panel/compartir");
  await page.getByLabel(/Cambiar tu link/).fill("juan-plomero");
  await page.getByRole("button", { name: "Guardar link" }).click();
  await expect(page.getByText("¡Listo! Tu link nuevo ya funciona.")).toBeVisible();

  await page.goto("/panel/compartir/imprimir");
  await expect(page.locator(".tarjeta")).toHaveCount(10);
});

test("un usuario puede borrar su cuenta y todos sus datos", async ({ page }) => {
  await login(page, `borrar.${Date.now()}@changa.test`, "/panel");
  await page.getByRole("button", { name: "Armar mi tarjeta" }).click();
  await page.goto("/panel/cuenta");
  await page.getByRole("button", { name: "Borrar mi cuenta y mis datos" }).click();
  await expect(page.getByText("escribí BORRAR en el campo")).toBeVisible();
  await page.getByLabel("Escribí BORRAR para confirmar").fill("borrar");
  await page.getByRole("button", { name: "Borrar mi cuenta y mis datos" }).click();
  await expect(page.getByText("Borramos tu cuenta y todos tus datos.")).toBeVisible();
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/ingresar/);
});
