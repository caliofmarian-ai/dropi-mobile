import "dotenv/config";
import { describe, it, expect } from "vitest";
import * as nodemailer from "nodemailer";

const password = process.env.GMAIL_APP_PASSWORD ?? process.env.SMTP_PASS;
const smtpUser = process.env.SMTP_USER ?? "dropi.deliveries@gmail.com";

describe("SMTP Gmail Configuration", () => {
  it.skipIf(!password || password.length < 10)("should verify SMTP credentials are valid", async () => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
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
