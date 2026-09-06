import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.hoisted(() => vi.fn());

const { resolveMailTransportConfig, sendPlatformEmail } = await import(
  "../server/_core/mail"
);

describe("sendPlatformEmail — Resend-only HTTPS transport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("RESEND_API_KEY", "configured-for-test");
    vi.stubEnv("RESEND_FROM", '"DROPi Platform" <onboarding@resend.dev>');
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("resolves a complete Resend configuration", () => {
    expect(resolveMailTransportConfig()).toEqual({
      mode: "resend",
      from: '"DROPi Platform" <onboarding@resend.dev>',
      apiKey: "configured-for-test",
    });
  });

  it("fails closed when RESEND_API_KEY is missing", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect(resolveMailTransportConfig()).toBeNull();
  });

  it("fails closed when RESEND_FROM is missing", () => {
    vi.stubEnv("RESEND_FROM", "");
    expect(resolveMailTransportConfig()).toBeNull();
  });

  it("sends recovery mail through the Resend HTTPS API", async () => {
    const result = await sendPlatformEmail({
      to: "dropi.deliveries@gmail.com",
      subject: "DROPi Password Reset",
      html: "<p>123456</p>",
      logLabel: "password reset email",
    });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      from: '"DROPi Platform" <onboarding@resend.dev>',
      to: ["dropi.deliveries@gmail.com"],
      subject: "DROPi Password Reset",
      html: "<p>123456</p>",
    });
  });

  it("returns false on provider HTTP failure", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await sendPlatformEmail({
      to: "dropi.deliveries@gmail.com",
      subject: "DROPi Password Reset",
      html: "<p>123456</p>",
      logLabel: "password reset email",
    });
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("via resend: HTTP 403"));
  });

  it("returns false when Resend configuration is incomplete and never attempts fetch", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await sendPlatformEmail({
      to: "dropi.deliveries@gmail.com",
      subject: "DROPi Password Reset",
      html: "<p>123456</p>",
      logLabel: "password reset email",
    });
    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Resend is not configured"));
  });
});
