import { describe, expect, it, vi, afterEach } from "vitest";
import { maskEmail, resolveMailTransportConfig } from "../server/_core/mail";

describe("resolveMailTransportConfig", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("falls back to Gmail app password when SMTP host is absent and SMTP_USER is set", () => {
    const config = resolveMailTransportConfig({
      GMAIL_APP_PASSWORD: "gmail-secret",
      SMTP_USER: "dropi@gmail.com",
    });

    expect(config).toEqual({
      mode: "gmail",
      user: "dropi@gmail.com",
      pass: "gmail-secret",
      from: '"DROPi Platform" <dropi@gmail.com>',
    });
  });

  it("returns null and logs an error when GMAIL_APP_PASSWORD is set but SMTP_USER is missing", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const config = resolveMailTransportConfig({ GMAIL_APP_PASSWORD: "gmail-secret" });

    expect(config).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("SMTP_USER"),
    );
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
