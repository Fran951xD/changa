import { describe, expect, it } from "vitest";
import { profileSlugBase, slugify } from "./slug";

describe("slug del perfil", () => {
  it("suma el oficio al nombre", () => {
    expect(profileSlugBase("Juan Pérez", "plomero")).toBe("juan-perez-plomero");
  });
  it("no repite el oficio si ya está en el nombre", () => {
    expect(profileSlugBase("Juan el Plomero", "plomero")).toBe("juan-el-plomero");
    expect(profileSlugBase("Rosa Electricista", "electricista")).toBe("rosa-electricista");
  });
  it("saca tildes y símbolos", () => {
    expect(slugify("  Ñandú & Cía. ")).toBe("nandu-cia");
  });
});
