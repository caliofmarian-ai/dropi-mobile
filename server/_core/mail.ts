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

function decoratePasswordRecoveryEmail(innerHtml: string): string {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>DROPi Password Recovery</title>
      </head>
      <body style="margin:0; padding:0; background:#F1F5F9; font-family:Arial,Helvetica,sans-serif; color:#0F172A;">
        <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
          Your secure DROPi password reset code is ready. It expires in 15 minutes.
        </div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; background:#F1F5F9;">
          <tr>
            <td align="center" style="padding:32px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:600px; background:#FFFFFF; border-radius:20px; overflow:hidden; box-shadow:0 10px 30px rgba(15,23,42,0.08);">
                <tr>
                  <td style="background:#0F172A; padding:30px 32px 26px; text-align:center;">
                    <div style="display:inline-block; padding:8px 14px; border:1px solid rgba(255,255,255,0.22); border-radius:999px; color:#7DD3FC; font-size:11px; font-weight:700; letter-spacing:1.8px; text-transform:uppercase;">
                      Account Security
                    </div>
                    <div style="margin-top:18px; color:#FFFFFF; font-size:38px; line-height:42px; font-weight:800; letter-spacing:-1px;">
                      DROP<span style="color:#38BDF8;">i</span>
                    </div>
                    <p style="margin:8px 0 0; color:#CBD5E1; font-size:15px; line-height:22px;">
                      Secure access to a smarter delivery experience.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:8px 26px 0;">
                    ${innerHtml}
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 32px 30px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; background:#EFF6FF; border:1px solid #DBEAFE; border-radius:14px;">
                      <tr>
                        <td style="padding:18px 20px;">
                          <div style="color:#1D4ED8; font-size:13px; font-weight:700; letter-spacing:0.2px; margin-bottom:6px;">
                            More than a password reset
                          </div>
                          <div style="color:#334155; font-size:13px; line-height:20px;">
                            DROPi brings marketplace access, delivery workflows and role-based operations into one connected platform — designed to make every delivery clearer, faster and easier to coordinate.
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:18px 4px 0; color:#64748B; font-size:12px; line-height:18px; text-align:center;">
                      Security matters at every step. DROPi will never ask you to send your password or recovery code by reply email.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="background:#F8FAFC; border-top:1px solid #E2E8F0; padding:18px 28px; text-align:center;">
                    <div style="color:#475569; font-size:12px; line-height:18px;">
                      DROPi Deliveries &middot; Connected logistics, built around people and operations.
                    </div>
                    <div style="margin-top:4px; color:#94A3B8; font-size:11px; line-height:16px;">
                      This is an automated security message. Please do not reply with credentials or recovery codes.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
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

  const html = input.logLabel === "password reset email"
    ? decoratePasswordRecoveryEmail(input.html)
    : input.html;

  try {
    await transporter.sendMail({
      from: config.from,
      to: input.to,
      subject: input.subject,
      html,
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
