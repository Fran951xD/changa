import { describe, expect, it } from "vitest";
import { AREAS, AREA_BY_SLUG, areasOf, nearestArea } from "./areas";
import { PROVINCES } from "./provinces";

describe("barrios y ciudades", () => {
  it("cada provincia tiene ciudades y todas caen dentro de Argentina", () => {
    for (const p of PROVINCES) expect(areasOf(p.slug).length, p.name).toBeGreaterThan(2);
    for (const a of AREAS) {
      expect(a.lat, a.name).toBeGreaterThan(-55.5);
      expect(a.lat, a.name).toBeLessThan(-21.5);
      expect(a.lng, a.name).toBeGreaterThan(-74);
      expect(a.lng, a.name).toBeLessThan(-53.5);
    }
  });

  it("los slugs son únicos y los de CABA/GBA no cambiaron", () => {
    expect(new Set(AREAS.map((a) => a.slug)).size).toBe(AREAS.length);
    expect(AREA_BY_SLUG.get("palermo")?.province).toBe("caba");
    expect(AREA_BY_SLUG.get("merlo")?.region).toBe("GBA Zona Oeste");
    expect(AREA_BY_SLUG.get("merlo-san-luis")?.province).toBe("san-luis");
    expect(AREA_BY_SLUG.get("cordoba")?.province).toBe("cordoba");
  });

  it("encuentra la ciudad más cercana en cualquier provincia", () => {
    expect(nearestArea(-54.8, -68.3).name).toBe("Ushuaia");
    expect(nearestArea(-32.95, -60.64).name).toBe("Rosario");
  });
});
