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
  const smtpUser = env.SMTP_USER?.trim() || "dropi.deliveries@gmail.com";
  const smtpPass = env.SMTP_PASS?.trim() || "";
  const gmailPass = env.GMAIL_APP_PASSWORD?.trim() || "";
  const smtpPort = Number(env.SMTP_PORT || "587");
  const smtpFrom = getMailFromAddress(smtpUser, env);

  if (smtpHost && smtpPass) {
    const port = Number.isFinite(smtpPort) && smtpPort > 0 ? smtpPort : 587;
    return {
      mode: "smtp",
      from: smtpFrom,
      user: smtpUser,
      host: smtpHost,
      port,
      secure: port === 465,
      pass: smtpPass,
    };
  }

  if (gmailPass) {
    return {
      mode: "gmail",
      from: smtpFrom,
      user: smtpUser,
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
    console.error(`[SMTP] ${input.logLabel} failed for ${maskEmail(input.to)} via ${config.mode}:`, error);
    return false;
  }
}
