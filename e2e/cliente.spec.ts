import { test, expect } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  // No salimos a internet: WhatsApp se simula y validamos a dónde iba el redirect.
  await context.route("https://wa.me/**", (route) => route.fulfill({ body: "WhatsApp simulado" }));
  await context.route("https://tile.openstreetmap.org/**", (route) => route.fulfill({ status: 204 }));
});

test("desde la portada encuentra un electricista disponible en su barrio y lo contacta por WhatsApp", async ({ page }) => {
  const start = Date.now();
  await page.goto("/");
  await page.getByLabel("Qué necesitás").selectOption("electricidad");
  await page.getByLabel("Provincia", { exact: true }).selectOption("caba");
  await page.getByLabel("Ciudad o barrio").fill("palerm");
  await page.getByRole("option", { name: /Palermo/ }).click();
  await page.getByRole("button", { name: "Buscar" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toContainText("cerca de Palermo");
  await page.getByLabel("Disponible ahora").check();
  await expect(page).toHaveURL(/ahora=1/);
  const first = page.locator(".iman").first();
  await expect(first.getByText("Disponible ahora")).toBeVisible();

  const waRequest = page.context().waitForEvent("request", (r) => r.url().startsWith("https://wa.me/"));
  await first.getByRole("button", { name: /^WhatsApp, escribirle a/ }).click();
  const url = new URL((await waRequest).url());
  expect(url.hostname).toBe("wa.me");
  expect(url.pathname).toMatch(/^\/54911\d{8}$/);
  expect(url.searchParams.get("text")).toMatch(/^Hola \S+, te encontré en Changa\. Necesito un electricista en Palermo para $/);
  expect(Date.now() - start).toBeLessThan(30_000);
});

test("el botón Llamar revela el número solo al tocarlo", async ({ page }) => {
  await page.goto("/juan-plomero");
  expect(await page.content()).not.toContain("1100001000");
  await page.locator(".perfil-side").getByRole("button", { name: "Llamar a Juan" }).click();
  await expect(page.locator(".perfil-side").getByRole("link", { name: "11 0000-1000" })).toBeVisible();
});

test("la vista de mapa carga y los filtros sin resultados explican qué hacer", async ({ page }) => {
  await page.goto("/buscar?oficio=gas&zona=quilmes&min=5&matricula=1&urgencias=1&ahora=1");
  await expect(page.getByText("Probá sacando algún filtro")).toBeVisible();
  await page.goto("/plomeros/palermo?vista=mapa");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("plomeros cerca de Palermo");
  await expect(page.locator(".leaflet-container")).toBeVisible();
});

test("escribir el barrio completo sin elegirlo de la lista igual busca ahí (Flores, aunque exista Floresta)", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Provincia", { exact: true }).selectOption("caba");
  await page.getByLabel("Ciudad o barrio").fill("Flores");
  await page.getByRole("heading", { level: 1 }).click(); // cierra la lista, como haría una persona
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/zona=flores(&|$)/);

  // Algo que no es un barrio: el navegador frena el envío en vez de perder lo escrito.
  await page.goto("/");
  await page.getByLabel("Provincia", { exact: true }).selectOption("caba");
  await page.getByLabel("Ciudad o barrio").fill("San");
  await page.getByRole("heading", { level: 1 }).click();
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.getByLabel("Ciudad o barrio").evaluate((el: HTMLInputElement) => el.validationMessage)).toBe("Elegí tu ciudad o barrio de la lista.");
});

test("primero la provincia: las ciudades se filtran a esa provincia y se puede buscar en todo el país", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Ciudad o barrio")).toBeDisabled();
  await page.getByLabel("Provincia", { exact: true }).selectOption("mendoza");
  await page.getByLabel("Ciudad o barrio").fill("san");
  const options = page.getByRole("listbox", { name: "Sugerencias" }).getByRole("option");
  await expect(options.first()).toBeVisible();
  const names = await options.allTextContents();
  expect(names).toEqual(expect.arrayContaining(["San Rafael", "San Martín"]));
  expect(names.join()).not.toMatch(/San Telmo|San Isidro|San Juan/); // nada de otras provincias
  await page.getByRole("option", { name: "San Rafael" }).click();
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/zona=san-rafael/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("cerca de San Rafael");
});

test("hay trabajadores de ejemplo en otras provincias, con página indexable", async ({ page, request }) => {
  await page.goto("/plomeros/cordoba");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("cerca de Córdoba");
  await expect(page.locator(".iman").first()).toBeVisible();
  await page.goto("/electricistas/la-plata");
  await expect(page.locator(".iman").first()).toBeVisible();
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/plomeros/cordoba</loc>");
});

test("al sacar los filtros, los chips quedan destildados", async ({ page }) => {
  await page.goto("/buscar?oficio=gas&zona=quilmes&min=5&matricula=1&urgencias=1&ahora=1");
  await page.getByRole("link", { name: "Ver todos sin filtros" }).click();
  await expect(page).toHaveURL(/\/buscar\?oficio=gas&zona=quilmes$/);
  for (const name of ["Disponible ahora", "Urgencias", "Con matrícula"]) await expect(page.getByLabel(name)).not.toBeChecked();
});
