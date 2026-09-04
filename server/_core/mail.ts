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

export async function resolveIPv4Host(hostname: string): Promise<string> {
  try {
    const addresses = await resolve4(hostname);
    if (addresses.length > 0) return addresses[0];
  } catch {
    // resolve4 failed — fall back to hostname-based connection
  }
  return hostname;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Canonical branded password-recovery email.
 *
 * The authentication flow still owns code generation and the 15-minute expiry.
 * This function is presentation only. Social icons are intentionally not links
 * until the official Facebook, TikTok, and Telegram destinations are approved.
 */
export function renderPasswordRecoveryEmail(innerHtml: string): string {
  const resetCode = innerHtml.match(/\b\d{6}\b/)?.[0];
  if (!resetCode) return innerHtml;

  const safeCode = escapeHtml(resetCode);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>DROPi Password Reset</title>
  </head>
  <body style="margin:0;padding:0;background:#F5F7FB;font-family:Arial,Helvetica,sans-serif;color:#172033;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Your DROPi password reset code is ${safeCode}. It expires in 15 minutes.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F5F7FB;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;background:#FFFFFF;border-radius:18px;overflow:hidden;border:1px solid #E8ECF4;box-shadow:0 12px 34px rgba(26,44,82,0.10);">
            <tr>
              <td align="center" style="padding:34px 30px 18px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="display:inline-table;vertical-align:middle;margin-right:10px;">
                  <tr>
                    <td style="width:11px;height:11px;border:2px solid #075FD8;border-radius:50%;font-size:0;line-height:0;">&nbsp;</td>
                    <td style="width:8px;border-top:2px solid #075FD8;font-size:0;line-height:0;">&nbsp;</td>
                    <td rowspan="2" style="width:27px;height:16px;background:#075FD8;border-radius:9px;text-align:center;vertical-align:middle;"><span style="display:inline-block;width:7px;height:7px;background:#DCEBFF;border-radius:50%;font-size:0;line-height:0;">&nbsp;</span></td>
                    <td style="width:8px;border-top:2px solid #075FD8;font-size:0;line-height:0;">&nbsp;</td>
                    <td style="width:11px;height:11px;border:2px solid #075FD8;border-radius:50%;font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="width:11px;height:11px;border:2px solid #075FD8;border-radius:50%;font-size:0;line-height:0;">&nbsp;</td>
                    <td style="width:8px;border-top:2px solid #075FD8;font-size:0;line-height:0;">&nbsp;</td>
                    <td style="width:8px;border-top:2px solid #075FD8;font-size:0;line-height:0;">&nbsp;</td>
                    <td style="width:11px;height:11px;border:2px solid #075FD8;border-radius:50%;font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                </table>
                <span style="display:inline-block;vertical-align:middle;color:#075FD8;font-size:44px;line-height:48px;font-weight:800;letter-spacing:-2px;">DROPi</span>
                <div style="margin-top:7px;color:#697386;font-size:14px;line-height:20px;">Logistics Platform</div>
              </td>
            </tr>
            <tr><td style="padding:6px 42px 0;"><div style="height:1px;background:#E8ECF4;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
            <tr>
              <td align="center" style="padding:28px 38px 4px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 14px;"><tr><td align="center" style="width:54px;height:54px;border-radius:15px;background:#EAF2FF;border:1px solid #D5E5FF;color:#075FD8;font-size:26px;line-height:54px;">&#128274;</td></tr></table>
                <div style="font-size:25px;line-height:32px;font-weight:700;color:#1D2638;">Password Reset Request</div>
                <p style="margin:13px auto 0;max-width:470px;color:#6A7487;font-size:14px;line-height:22px;">We received a request to reset your DROPi account password.<br />Use the verification code below to continue.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:21px 36px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;background:#EFF5FF;border:1px solid #D8E7FF;border-radius:14px;"><tr><td style="padding:18px 28px;text-align:center;"><div style="color:#075FD8;font-size:34px;line-height:40px;font-weight:800;letter-spacing:9px;">${safeCode}</div></td></tr></table>
                <div style="margin-top:11px;color:#7A8495;font-size:12px;line-height:18px;">This code expires in <strong>15 minutes</strong>.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 38px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F3F7FC;border-radius:12px;"><tr><td style="padding:16px 18px;color:#5C687B;font-size:12px;line-height:19px;"><strong style="color:#39465B;">&#128274; Security notice</strong><br />If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</td></tr></table>
              </td>
            </tr>
            <tr><td align="center" style="padding:25px 38px 7px;color:#5D687A;font-size:12px;line-height:19px;">For your security, never share this verification code with anyone.<br />DROPi will never ask you for your password or recovery code by email.</td></tr>
            <tr><td style="padding:18px 42px 0;"><div style="height:1px;background:#E8ECF4;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
            <tr>
              <td align="center" style="padding:22px 32px 6px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;"><tr>
                  <td style="padding:0 7px;"><span title="Facebook link to be added" style="display:inline-block;width:34px;height:34px;border-radius:50%;background:#075FD8;color:#FFFFFF;font-size:20px;font-weight:700;line-height:34px;text-align:center;">f</span></td>
                  <td style="padding:0 7px;"><span title="TikTok link to be added" style="display:inline-block;width:34px;height:34px;border-radius:50%;background:#075FD8;color:#FFFFFF;font-size:16px;font-weight:700;line-height:34px;text-align:center;">&#9835;</span></td>
                  <td style="padding:0 7px;"><span title="Telegram link to be added" style="display:inline-block;width:34px;height:34px;border-radius:50%;background:#075FD8;color:#FFFFFF;font-size:16px;font-weight:700;line-height:34px;text-align:center;">&#10148;</span></td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:12px 30px 28px;color:#8A94A5;font-size:11px;line-height:18px;">
                <div style="color:#748095;">Support &amp; Help Center&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;Privacy Policy</div>
                <div style="margin-top:7px;">&copy; 2026 DROPi Logistics Platform. All rights reserved.</div>
                <div style="margin-top:3px;">Secure. Fast. Delivered.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function prepareEmailHtml(input: { html: string; logLabel: string }): string {
  const isCanonicalRecoveryBody =
    input.logLabel === "password reset email" &&
    input.html.includes("You requested a password reset");

  return isCanonicalRecoveryBody
    ? renderPasswordRecoveryEmail(input.html)
    : input.html;
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
      console.error(`[MAIL] ${input.logLabel} failed for ${maskEmail(input.to)} via resend: HTTP ${response.status}`);
      return false;
    }

    console.log(`[MAIL] ${input.logLabel} sent to ${maskEmail(input.to)} via resend`);
    return true;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[MAIL] ${input.logLabel} failed for ${maskEmail(input.to)} via resend: ${errMsg}`);
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

  const preparedInput = {
    ...input,
    html: prepareEmailHtml(input),
  };

  if (config.mode === "resend") {
    return sendViaResend(config, preparedInput);
  }

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
        auth: { user: config.user, pass: config.pass },
        ...timeoutOpts,
      })
      : nodemailer.createTransport({
        host: await resolveIPv4Host("smtp.gmail.com"),
        port: 465,
        secure: true,
        tls: { servername: "smtp.gmail.com" },
        auth: { user: config.user, pass: config.pass },
        ...timeoutOpts,
      });

  try {
    await transporter.sendMail({
      from: config.from,
      to: preparedInput.to,
      subject: preparedInput.subject,
      html: preparedInput.html,
    });
    console.log(`[MAIL] ${input.logLabel} sent to ${maskEmail(input.to)} via ${config.mode}`);
    return true;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[MAIL] ${input.logLabel} failed for ${maskEmail(input.to)} via ${config.mode}: ${errMsg}`);
    return false;
  }
}
