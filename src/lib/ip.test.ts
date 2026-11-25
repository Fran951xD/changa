import { describe, expect, it } from "vitest";
import { ipFromHeaders } from "./ip";

describe("ipFromHeaders", () => {
  it("usa la IP que agrega el proxy, no las que manda el cliente", () => {
    expect(ipFromHeaders(new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2, 203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("dos pedidos con distinta IP inventada desde la misma IP real cuentan como uno", () => {
    const a = ipFromHeaders(new Headers({ "x-forwarded-for": "9.9.9.1, 203.0.113.7" }));
    const b = ipFromHeaders(new Headers({ "x-forwarded-for": "9.9.9.2, 203.0.113.7" }));
    expect(a).toBe(b);
  });

  it("sin X-Forwarded-For usa x-real-ip, y si no hay nada, 'local'", () => {
    expect(ipFromHeaders(new Headers({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    expect(ipFromHeaders(new Headers())).toBe("local");
  });
});
