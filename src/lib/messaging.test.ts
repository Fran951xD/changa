import { afterEach, describe, expect, it, vi } from "vitest";
import { emailLoginEnabled, phoneMode } from "./messaging";

const prod = () => vi.stubEnv("NODE_ENV", "production");
afterEach(() => vi.unstubAllEnvs());

describe("modos de ingreso y de confirmación del celular", () => {
  it("en producción sin proveedores: solo Google y celular por WhatsApp", () => {
    prod();
    vi.stubEnv("DEMO_MODE", "");
    expect(emailLoginEnabled()).toBe(false);
    expect(phoneMode()).toBe("whatsapp");
  });

  it("con Resend y Twilio configurados: mail y SMS reales", () => {
    prod();
    vi.stubEnv("RESEND_API_KEY", "re_x");
    vi.stubEnv("TWILIO_ACCOUNT_SID", "AC1");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "t");
    vi.stubEnv("TWILIO_FROM", "+1");
    expect(emailLoginEnabled()).toBe(true);
    expect(phoneMode()).toBe("sms");
  });

  it("en modo demo: enlace y código en pantalla, salvo que se fuerce WhatsApp", () => {
    prod();
    vi.stubEnv("DEMO_MODE", "1");
    expect(emailLoginEnabled()).toBe(true);
    expect(phoneMode()).toBe("sms");
    vi.stubEnv("PHONE_VERIFICATION", "whatsapp");
    expect(phoneMode()).toBe("whatsapp");
  });

  it("sin DEMO_MODE=1 no hay modo demo, aunque NODE_ENV no sea production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEMO_MODE", "");
    expect(emailLoginEnabled()).toBe(false);
    expect(phoneMode()).toBe("whatsapp");
  });
});
