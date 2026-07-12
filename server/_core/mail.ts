import nodemailer from "nodemailer";

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
      })
      : nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: config.user,
          pass: config.pass,
        },
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
