import { describe, expect, it } from "vitest";
import { formatArPhone, normalizeArPhone, whatsappLink } from "./phone";

describe("normalizeArPhone", () => {
  it.each([
    ["11 2345-6789", "5491123456789"],
    ["1123456789", "5491123456789"],
    ["011 15 2345-6789", "5491123456789"],
    ["11 15 2345 6789", "5491123456789"],
    ["+54 9 11 2345-6789", "5491123456789"],
    ["+54 11 2345 6789", "5491123456789"],
    ["5491123456789", "5491123456789"],
    ["0221 15 456-7890", "5492214567890"],
    ["(0221) 456-7890", "5492214567890"],
    ["02944 15 123456", "5492944123456"],
    ["11 1523-4567", "5491115234567"], // número que empieza con 15 pero sin el prefijo
  ])("%s → %s", (input, expected) => {
    expect(normalizeArPhone(input)).toBe(expected);
  });

  it.each(["", "2345-6789", "15 2345 6789", "123", "11 2345 678", "abc"])("rechaza %j", (input) => {
    expect(normalizeArPhone(input)).toBeNull();
  });
});

describe("formatArPhone", () => {
  it("muestra el número como lo escribe la gente", () => {
    expect(formatArPhone("5491123456789")).toBe("11 2345-6789");
    expect(formatArPhone("5492214567890")).toBe("221 456-7890");
  });
});

describe("whatsappLink", () => {
  it("codifica el mensaje prearmado", () => {
    expect(whatsappLink("5491123456789", "Hola Juan, ¿podés?")).toBe(
      "https://wa.me/5491123456789?text=Hola%20Juan%2C%20%C2%BFpod%C3%A9s%3F",
    );
  });
});
