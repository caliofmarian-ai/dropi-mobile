import nodemailer from "nodemailer";
import { resolve4 } from "node:dns/promises";

type MailEnv = Readonly<Record<string, string | undefined>>;

type MailTransportConfig =
  | {
    mode: "resend";
    from: string;
    apiKey: string;
  }
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

const RESEND_EMAIL_API_URL = "https://api.resend.com/emails";
const RESEND_DEVELOPMENT_FROM = '"DROPi Platform" <onboarding@resend.dev>';

export function maskEmail(email: string): string {
  const [localPart = "", domain = ""] = email.split("@");
  if (!localPart || !domain) return "***";
  if (localPart.length <= 2) return `${localPart[0] ?? "*"}***@${domain}`;
  return `${localPart.slice(0, 2)}***@${domain}`;
}

function getMailFromAddress(user: string, env: MailEnv): string {
  return env.SMTP_FROM?.trim() || `"DROPi Platform" <${user}>`;
}

function getResendFromAddress(env: MailEnv): string {
  return env.RESEND_FROM?.trim() || RESEND_DEVELOPMENT_FROM;
}

export function resolveMailTransportConfig(
  env: MailEnv = process.env,
): MailTransportConfig | null {
  const resendApiKey = env.RESEND_API_KEY?.trim() || "";
  const smtpHost = env.SMTP_HOST?.trim() || "";
  const explicitSmtpUser = env.SMTP_USER?.trim() || "";
  const smtpPass = env.SMTP_PASS?.trim() || "";
  const gmailPass = env.GMAIL_APP_PASSWORD?.trim() || "";
  const smtpPort = Number(env.SMTP_PORT || "587");

  // HTTPS mail is preferred when configured. Railway Hobby blocks outbound SMTP,
  // while normal HTTPS requests are allowed. Keeping SMTP/Gmail as fallbacks lets
  // production move between providers without changing the auth/recovery flows.
  if (resendApiKey) {
    return {
      mode: "resend",
      from: getResendFromAddress(env),
      apiKey: resendApiKey,
    };
  }

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
        "[MAIL] Gmail mode requires SMTP_USER to be set to the Gmail address " +
        "that owns the GMAIL_APP_PASSWORD. " +
        "Add SMTP_USER=<your-gmail-address> as an environment variable.",
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
 * This prevents ENETUNREACH failures on cloud environments where outbound IPv6
 * connectivity is unreliable. SMTP remains a supported fallback transport, but
 * Railway Hobby should use the HTTPS transport above.
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

async function sendViaResend(
  config: Extract<MailTransportConfig, { mode: "resend" }>,
  input: { to: string; subject: string; html: string; logLabel: string },
): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(RESEND_EMAIL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `[MAIL] ${input.logLabel} failed for ${maskEmail(input.to)} via resend: HTTP ${response.status}`,
      );
      return false;
    }

    console.log(
      `[MAIL] ${input.logLabel} sent to ${maskEmail(input.to)} via resend`,
    );
    return true;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(
      `[MAIL] ${input.logLabel} failed for ${maskEmail(input.to)} via resend: ${errMsg}`,
    );
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendPlatformEmail(input: {
  to: string;
  subject: string;
  html: string;
  logLabel: string;
}): Promise<boolean> {
  const config = resolveMailTransportConfig();
  if (!config) {
    console.error(`[MAIL] ${input.logLabel} skipped: no mail transport configured`);
    return false;
  }

  if (config.mode === "resend") {
    return sendViaResend(config, input);
  }

  // Shared timeout options — prevent indefinite hangs on broken SMTP connections.
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
        // Pre-resolve smtp.gmail.com to IPv4 to avoid unreliable IPv6 routes.
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
    console.log(
      `[MAIL] ${input.logLabel} sent to ${maskEmail(input.to)} via ${config.mode}`,
    );
    return true;
  } catch (error) {
    // Log only the error message — never log full error objects which may
    // contain App Passwords, SMTP credentials, or other sensitive details.
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(
      `[MAIL] ${input.logLabel} failed for ${maskEmail(input.to)} via ${config.mode}: ${errMsg}`,
    );
    return false;
  }
}
