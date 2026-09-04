import { describe, expect, it } from "vitest";
import { renderPasswordRecoveryEmail } from "../server/_core/mail";

describe("DROPi password recovery email template", () => {
  it("renders the approved branded layout and preserves the reset code", () => {
    const html = renderPasswordRecoveryEmail(`
      <div>
        <h2>DROPi</h2>
        <p>You requested a password reset. Use the code below to set a new password:</p>
        <span>771415</span>
        <p>This code expires in <strong>15 minutes</strong>.</p>
      </div>
    `);

    expect(html).toContain("DROPi");
    expect(html).toContain("Logistics Platform");
    expect(html).toContain("Password Reset Request");
    expect(html).toContain("771415");
    expect(html).toContain("15 minutes");
    expect(html).toContain("Security notice");
    expect(html).toContain("Secure. Fast. Delivered.");
  });

  it("shows Facebook, TikTok and Telegram as non-clickable placeholders", () => {
    const html = renderPasswordRecoveryEmail(`
      <p>You requested a password reset. Use the code below to set a new password:</p>
      <span>123456</span>
    `);

    expect(html).toContain("Facebook link to be added");
    expect(html).toContain("TikTok link to be added");
    expect(html).toContain("Telegram link to be added");
    expect(html).not.toContain("href=");
  });

  it("falls back to the supplied body if a six-digit reset code is missing", () => {
    const source = "<p>You requested a password reset.</p>";
    expect(renderPasswordRecoveryEmail(source)).toBe(source);
  });
});
