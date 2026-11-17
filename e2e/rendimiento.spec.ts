import { test, expect } from "@playwright/test";

// Presupuesto de bytes transferidos (comprimidos, como viajan por datos móviles) sobre el build de producción.
// La base inevitable es React + runtime de Next (~110 KB gzip) y la fuente variable Archivo (~88 KB).
const BUDGET_KB = { "/": 300, "/plomeros/palermo": 340, "/juan-plomero": 340 };

for (const [path, budget] of Object.entries(BUDGET_KB)) {
  test(`${path} transfiere menos de ${budget} KB y no carga el mapa si no se pide`, async ({ page }) => {
    const responses: Promise<{ url: string; bytes: number }>[] = [];
    page.on("requestfinished", (req) => {
      responses.push(req.sizes().then((s) => ({ url: req.url(), bytes: s.responseBodySize + s.responseHeadersSize })));
    });
    await page.goto(path, { waitUntil: "networkidle" });
    const sizes = await Promise.all(responses);
    const total = sizes.reduce((a, s) => a + s.bytes, 0) / 1024;
    console.log(`${path}: ${total.toFixed(0)} KB transferidos en ${sizes.length} pedidos`);
    expect(total).toBeLessThan(budget);
    expect(sizes.some((s) => s.url.includes("leaflet") || s.url.includes("openstreetmap"))).toBe(false);
  });
}
