import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login } from "./helpers";

// Chequeo automático WCAG 2.2 AA con axe. No reemplaza probar con lector de pantalla, pero frena regresiones.
async function audit(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .exclude(".leaflet-container")
    .analyze();
  const summary = violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`);
  expect(summary).toEqual([]);
}

test.beforeEach(async ({ context }) => {
  await context.route("https://tile.openstreetmap.org/**", (route) => route.fulfill({ status: 204 }));
});

for (const path of ["/", "/buscar?oficio=electricidad&zona=palermo", "/plomeros/palermo", "/juan-plomero", "/presupuesto?oficio=plomeria&zona=palermo", "/ingresar", "/trabajadores", "/privacidad", "/no-existe/nada"]) {
  test(`sin violaciones WCAG AA en ${path}`, async ({ page }) => {
    await page.goto(path);
    await audit(page);
  });
}

test("sin violaciones WCAG AA en el panel del trabajador", async ({ page }) => {
  await login(page, "juan@changa.test", "/panel");
  await audit(page);
  for (const p of ["/panel/perfil", "/panel/resenas", "/panel/pedidos", "/panel/compartir", "/panel/cuenta"]) {
    await page.goto(p);
    await audit(page);
  }
});

test("la búsqueda se puede usar solo con teclado", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
  await page.getByLabel("Qué necesitás").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Dónde")).toBeFocused();
  await page.keyboard.type("cabal");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Dónde")).toHaveValue("Caballito");
  await page.getByRole("button", { name: "Buscar" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/zona=caballito/);
});
