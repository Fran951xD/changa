import { expect, type Page } from "@playwright/test";

/** Entra con enlace mágico usando el modo demo (el enlace aparece en pantalla). */
export async function login(page: Page, email: string, next = "/panel") {
  await page.goto(`/ingresar?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Tu email").fill(email);
  await page.getByRole("button", { name: "Mandame el enlace" }).click();
  await page.getByRole("link", { name: "entrar con este enlace" }).click();
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(new RegExp(next.replace(/[/?]/g, "\\$&")));
}

export async function logout(page: Page) {
  await page.context().clearCookies();
}
