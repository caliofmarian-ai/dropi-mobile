import { describe, expect, it } from "vitest";
import { maskEmail, resolveMailTransportConfig } from "../server/_core/mail";

describe("resolveMailTransportConfig", () => {
  it("prefers explicit SMTP settings when provided", () => {
    const config = resolveMailTransportConfig({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "465",
      SMTP_USER: "ops@example.com",
      SMTP_PASS: "smtp-secret",
      SMTP_FROM: "DROPi <noreply@example.com>",
      GMAIL_APP_PASSWORD: "gmail-secret",
    });

    expect(config).toEqual({
      mode: "smtp",
      host: "smtp.example.com",
      port: 465,
      secure: true,
      user: "ops@example.com",
      pass: "smtp-secret",
      from: "DROPi <noreply@example.com>",
    });
  });

  it("falls back to Gmail app password when SMTP host is absent", () => {
    const config = resolveMailTransportConfig({
      GMAIL_APP_PASSWORD: "gmail-secret",
      SMTP_USER: "dropi.deliveries@gmail.com",
    });

    expect(config).toEqual({
      mode: "gmail",
      user: "dropi.deliveries@gmail.com",
      pass: "gmail-secret",
      from: '"DROPi Platform" <dropi.deliveries@gmail.com>',
    });
  });

  it("returns null when no supported credentials are configured", () => {
    expect(resolveMailTransportConfig({})).toBeNull();
  });
});

describe("maskEmail", () => {
  it("redacts the local part", () => {
    expect(maskEmail("dropi.deliveries@gmail.com")).toBe("dr***@gmail.com");
  });
});
