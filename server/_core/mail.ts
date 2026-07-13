import nodemailer from "nodemailer";
import { resolve4 } from "node:dns/promises";

type MailEnv = Readonly<Record<string, string | undefined>>;

type MailTransportConfig =
  | {
    mode: "smtp";
    from: string;
    user: string;
    host: string;
    port: number;
    secure: boolean;
    pass: string;
  }
  | {
    mode: "gmail";
    from: string;
    user: string;
    pass: string;
  };

export function maskEmail(email: string): string {
  const [localPart = "", domain = ""] = email.split("@");
  if (!localPart || !domain) return "***";
  if (localPart.length <= 2) return `${localPart[0] ?? "*"}***@${domain}`;
  return `${localPart.slice(0, 2)}***@${domain}`;
}

function getMailFromAddress(user: string, env: MailEnv): string {
  return env.SMTP_FROM?.trim() || `"DROPi Platform" <${user}>`;
}

export function resolveMailTransportConfig(
  env: MailEnv = process.env,
): MailTransportConfig | null {
  const smtpHost = env.SMTP_HOST?.trim() || "";
  const explicitSmtpUser = env.SMTP_USER?.trim() || "";
  const smtpPass = env.SMTP_PASS?.trim() || "";
  const gmailPass = env.GMAIL_APP_PASSWORD?.trim() || "";
  const smtpPort = Number(env.SMTP_PORT || "587");

  if (smtpHost && smtpPass) {
    const user = explicitSmtpUser || "noreply";
    const from = getMailFromAddress(user, env);
    const port = Number.isFinite(smtpPort) && smtpPort > 0 ? smtpPort : 587;
    return {
      mode: "smtp",
      from,
      user,
      host: smtpHost,
      port,
      secure: port === 465,
      pass: smtpPass,
    };
  }

  if (gmailPass) {
    if (!explicitSmtpUser) {
      // SMTP_USER is required for Gmail App Password authentication.
      // Each Gmail App Password is bound to a specific account; without the
      // account address, authentication will fail with a 535 error.
      console.error(
        "[SMTP] Gmail mode requires SMTP_USER to be set to the Gmail address " +
        "that owns the GMAIL_APP_PASSWORD. " +
        "Add SMTP_USER=<your-gmail-address> as a Railway environment variable.",
      );
      return null;
    }
    const from = getMailFromAddress(explicitSmtpUser, env);
    return {
      mode: "gmail",
      from,
      user: explicitSmtpUser,
      pass: gmailPass,
    };
  }

  return null;
}

/**
 * Pre-resolve a hostname to its first IPv4 address.
 *
 * This prevents ENETUNREACH failures on Railway and similar cloud environments
 * where outbound IPv6 connectivity is unreliable:
 * - Nodemailer 9.x resolves both IPv4 and IPv6 addresses and randomly picks
 *   one for the initial connection attempt.
 * - When an IPv6 address is picked and the network has no IPv6 route to the
 *   internet, the connection immediately fails with ENETUNREACH.
 * - By passing a pre-resolved IPv4 address as `host`, net.isIP() returns 4,
 *   Nodemailer skips its own DNS stage, and the connection goes to IPv4 only.
 *
 * Falls back to the original hostname when dns.resolve4 fails so that existing
 * SMTP connectivity is never broken by a transient DNS hiccup.
 */
export async function resolveIPv4Host(hostname: string): Promise<string> {
  try {
    const addresses = await resolve4(hostname);
    if (addresses.length > 0) return addresses[0];
  } catch {
    // resolve4 failed — fall back to hostname-based connection
  }
  return hostname;
}

export async function sendPlatformEmail(input: {
  to: string;
  subject: string;
  html: string;
  logLabel: string;
}): Promise<boolean> {
  const config = resolveMailTransportConfig();
  if (!config) {
    console.error(`[SMTP] ${input.logLabel} skipped: no mail transport configured`);
    return false;
  }

  // Shared timeout options — prevent indefinite hangs on broken connections.
  const timeoutOpts = {
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  };

  const transporter =
    config.mode === "smtp"
      ? nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass,
        },
        ...timeoutOpts,
      })
      : nodemailer.createTransport({
        // Explicit host/port/secure — do NOT use `service: "gmail"`.
        // Railway (and many cloud platforms) have unreliable IPv6 outbound routing.
        // Nodemailer's built-in DNS resolver randomly selects from IPv4 + IPv6
        // addresses; when IPv6 is picked the connection fails with ENETUNREACH.
        // We pre-resolve smtp.gmail.com to IPv4 via dns.resolve4() so that
        // Nodemailer's internal resolver (net.isIP check) bypasses DNS entirely
        // and connects directly to the IPv4 address.
        // tls.servername is set so TLS SNI + certificate verification still use
        // the official hostname, not the raw IP.
        host: await resolveIPv4Host("smtp.gmail.com"),
        port: 465,
        secure: true,
        tls: { servername: "smtp.gmail.com" },
        auth: {
          user: config.user,
          pass: config.pass,
        },
        ...timeoutOpts,
      });

  try {
    await transporter.sendMail({
      from: config.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    console.log(`[SMTP] ${input.logLabel} sent to ${maskEmail(input.to)} via ${config.mode}`);
    return true;
  } catch (error) {
    // Log only the error message — never log the full error object which may
    // contain App Password, SMTP credentials, or sensitive connection details.
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[SMTP] ${input.logLabel} failed for ${maskEmail(input.to)} via ${config.mode}: ${errMsg}`);
    return false;
  }
}
