import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createTransportMock = vi.hoisted(() => vi.fn());
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
}));

vi.mock("node:dns/promises", () => ({ resolve4: vi.fn() }));

const { resolveMailTransportConfig, sendPlatformEmail } = await import(
  "../server/_core/mail"
);

describe("sendPlatformEmail — HTTPS/Resend transport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("RESEND_FROM", '"DROPi Platform" <onboarding@resend.dev>');
    vi.stubEnv("SMTP_HOST", "");
    vi.stubEnv("SMTP_PASS", "");
    vi.stubEnv("GMAIL_APP_PASSWORD", "");
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("prefers HTTPS transport when RESEND_API_KEY is configured", () => {
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_PASS", "smtp-test-value");
    vi.stubEnv("SMTP_USER", "mailer@example.com");

    expect(resolveMailTransportConfig()?.mode).toBe("resend");
  });

  it("sends recovery mail through HTTPS without opening SMTP", async () => {
    const result = await sendPlatformEmail({
      to: "dropi.deliveries@gmail.com",
      subject: "DROPi Password Reset",
      html: "<p>123456</p>",
      logLabel: "password reset email",
    });

    expect(result).toBe(true);
    expect(createTransportMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body).toEqual({
      from: '"DROPi Platform" <onboarding@resend.dev>',
      to: ["dropi.deliveries@gmail.com"],
      subject: "DROPi Password Reset",
      html: "<p>123456</p>",
    });
  });

  it("returns false on an HTTP provider failure", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendPlatformEmail({
      to: "dropi.deliveries@gmail.com",
      subject: "DROPi Password Reset",
      html: "<p>123456</p>",
      logLabel: "password reset email",
    });

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("via resend: HTTP 403"),
    );
  });

  it("returns false when the HTTPS request throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendPlatformEmail({
      to: "dropi.deliveries@gmail.com",
      subject: "DROPi Password Reset",
      html: "<p>123456</p>",
      logLabel: "password reset email",
    });

    expect(result).toBe(false);
  });

  it("does not log the configured API key on failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("request failed"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await sendPlatformEmail({
      to: "dropi.deliveries@gmail.com",
      subject: "DROPi Password Reset",
      html: "<p>123456</p>",
      logLabel: "password reset email",
    });

    for (const call of consoleSpy.mock.calls) {
      expect(call.map(String).join(" ")).not.toContain("test-key");
    }
  });
});
