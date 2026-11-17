import { test, devices } from "@playwright/test";
import { login } from "./helpers";

// Genera las capturas del README: CAPTURAS=1 npx playwright test capturas
test.skip(!process.env.CAPTURAS, "solo para regenerar capturas");
test.use({ ...devices["Pixel 7"] });

test.beforeEach(async ({ context }) => {
  await context.route("https://tile.openstreetmap.org/**", (route) => route.continue());
});

const shot = (name: string) => ({ path: `docs/capturas/${name}.png`, fullPage: false });

test("capturas celular", async ({ page }) => {
  await page.goto("/");
  await page.screenshot(shot("portada"));
  await page.goto("/electricistas/palermo");
  await page.waitForLoadState("networkidle");
  await page.screenshot(shot("resultados"));
  await page.goto("/juan-plomero");
  await page.waitForLoadState("networkidle");
  await page.screenshot(shot("perfil"));
  await page.goto("/plomeros/palermo?vista=mapa");
  await page.waitForTimeout(2500);
  await page.screenshot(shot("mapa"));
  await login(page, "juan@changa.test", "/panel");
  await page.screenshot(shot("panel"));
  await page.goto("/panel/compartir");
  await page.screenshot(shot("compartir"));
});

test("captura escritorio", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto("/juan-plomero");
  await page.waitForLoadState("networkidle");
  await page.screenshot(shot("perfil-escritorio"));
  await page.goto("/buscar?oficio=plomeria&zona=palermo");
  await page.waitForLoadState("networkidle");
  await page.screenshot(shot("resultados-escritorio"));
});
