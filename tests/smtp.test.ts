import "dotenv/config";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as nodemailerRealModule from "nodemailer";

const password = process.env.GMAIL_APP_PASSWORD ?? process.env.SMTP_PASS;
const smtpUser = process.env.SMTP_USER ?? "dropi.deliveries@gmail.com";

describe("SMTP Gmail Configuration — live credentials (skipped without env)", () => {
  it.skipIf(!password || password.length < 10)("should verify SMTP credentials are valid", async () => {
    // Live test: uses explicit host/port/secure (not service: "gmail")
    const transporter = nodemailerRealModule.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: password,
      },
    });

    // verify() checks the connection without sending an email
    const result = await transporter.verify();
    expect(result).toBe(true);
  }, 15000);
});

// ---------------------------------------------------------------------------
// Unit tests — mock nodemailer and dns.promises to avoid real network I/O.
// ---------------------------------------------------------------------------

// Mocks must be hoisted before imports so vi.mock() intercepts the modules
// when mail.ts is first loaded.
const sendMailMock = vi.hoisted(() => vi.fn());
const createTransportMock = vi.hoisted(() =>
  vi.fn((_options: Record<string, unknown>) => ({ sendMail: sendMailMock })),
);
const dnsMock = vi.hoisted(() => ({ resolve4: vi.fn() }));

vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
}));

vi.mock("node:dns/promises", () => dnsMock);

const { resolveIPv4Host, sendPlatformEmail } = await import("../server/_core/mail");

describe("resolveIPv4Host", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns the first IPv4 address when dns.resolve4 resolves", async () => {
    dnsMock.resolve4.mockResolvedValueOnce(["142.250.80.21", "142.250.80.22"]);
    const host = await resolveIPv4Host("smtp.gmail.com");
    expect(host).toBe("142.250.80.21");
    expect(dnsMock.resolve4).toHaveBeenCalledWith("smtp.gmail.com");
  });

  it("falls back to the original hostname when dns.resolve4 rejects", async () => {
    dnsMock.resolve4.mockRejectedValueOnce(new Error("ENOTFOUND"));
    const host = await resolveIPv4Host("smtp.gmail.com");
    expect(host).toBe("smtp.gmail.com");
  });

  it("falls back to the original hostname when dns.resolve4 returns empty array", async () => {
    dnsMock.resolve4.mockResolvedValueOnce([]);
    const host = await resolveIPv4Host("smtp.gmail.com");
    expect(host).toBe("smtp.gmail.com");
  });
});

describe("sendPlatformEmail — Gmail transport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMailMock.mockResolvedValue({ messageId: "<test@gmail>" });
    // Default: IPv4 resolution succeeds
    dnsMock.resolve4.mockResolvedValue(["142.250.80.21"]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function withGmailEnv() {
    vi.stubEnv("GMAIL_APP_PASSWORD", "test-app-password");
    vi.stubEnv("SMTP_USER", "dropi@gmail.com");
    vi.stubEnv("SMTP_HOST", "");
    vi.stubEnv("SMTP_PASS", "");
  }

  it("uses explicit host/port/secure — NOT service:'gmail'", async () => {
    withGmailEnv();
    await sendPlatformEmail({ to: "u@x.com", subject: "S", html: "<p>H</p>", logLabel: "test" });

    expect(createTransportMock).toHaveBeenCalledTimes(1);
    const opts = createTransportMock.mock.calls[0][0] as Record<string, unknown>;
    // Must NOT use the service shorthand
    expect(opts).not.toHaveProperty("service");
    // Must use explicit smtp.gmail.com parameters
    expect(opts.port).toBe(465);
    expect(opts.secure).toBe(true);
    expect((opts.tls as any)?.servername).toBe("smtp.gmail.com");
  });

  it("forces IPv4: host is the resolved IPv4 address, not the gmail hostname", async () => {
    withGmailEnv();
    dnsMock.resolve4.mockResolvedValue(["142.250.80.21"]);
    await sendPlatformEmail({ to: "u@x.com", subject: "S", html: "<p>H</p>", logLabel: "test" });

    const opts = createTransportMock.mock.calls[0][0] as Record<string, unknown>;
    expect(opts.host).toBe("142.250.80.21");
    expect(dnsMock.resolve4).toHaveBeenCalledWith("smtp.gmail.com");
  });

  it("falls back to smtp.gmail.com hostname when IPv4 resolution fails", async () => {
    withGmailEnv();
    dnsMock.resolve4.mockRejectedValue(new Error("ENOTFOUND"));
    await sendPlatformEmail({ to: "u@x.com", subject: "S", html: "<p>H</p>", logLabel: "test" });

    const opts = createTransportMock.mock.calls[0][0] as Record<string, unknown>;
    // Falls back to hostname — Nodemailer handles DNS from here
    expect(opts.host).toBe("smtp.gmail.com");
  });

  it("sets connectionTimeout, greetingTimeout, and socketTimeout", async () => {
    withGmailEnv();
    await sendPlatformEmail({ to: "u@x.com", subject: "S", html: "<p>H</p>", logLabel: "test" });

    const opts = createTransportMock.mock.calls[0][0] as Record<string, unknown>;
    expect(opts.connectionTimeout).toBe(10_000);
    expect(opts.greetingTimeout).toBe(10_000);
    expect(opts.socketTimeout).toBe(15_000);
  });

  it("returns false (does not throw) when sendMail fails with ENETUNREACH", async () => {
    withGmailEnv();
    const enetErr = Object.assign(new Error("connect ENETUNREACH 2a00:1450:4025:401::6d:465"), {
      code: "ENETUNREACH",
    });
    sendMailMock.mockRejectedValueOnce(enetErr);

    const result = await sendPlatformEmail({
      to: "u@x.com",
      subject: "S",
      html: "<p>H</p>",
      logLabel: "password reset email",
    });

    expect(result).toBe(false);
  });

  it("returns false (does not throw) when sendMail times out", async () => {
    withGmailEnv();
    const timeoutErr = Object.assign(new Error("Connection timeout"), { code: "ETIMEDOUT" });
    sendMailMock.mockRejectedValueOnce(timeoutErr);

    const result = await sendPlatformEmail({
      to: "u@x.com",
      subject: "S",
      html: "<p>H</p>",
      logLabel: "verification email",
    });

    expect(result).toBe(false);
  });

  it("does not log credentials or App Password on delivery failure", async () => {
    withGmailEnv();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    sendMailMock.mockRejectedValueOnce(new Error("Auth failed"));

    await sendPlatformEmail({ to: "u@x.com", subject: "S", html: "<p>H</p>", logLabel: "test" });

    for (const call of consoleSpy.mock.calls) {
      const logged = call.map(String).join(" ");
      expect(logged).not.toContain("test-app-password");
      expect(logged).not.toContain("dropi@gmail.com");
    }
  });

  it("returns true on successful send", async () => {
    withGmailEnv();
    const result = await sendPlatformEmail({
      to: "u@x.com",
      subject: "Verify",
      html: "<p>Code: 123456</p>",
      logLabel: "verification email",
    });

    expect(result).toBe(true);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });
});
