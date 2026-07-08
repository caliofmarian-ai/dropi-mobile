import { describe, it, expect } from "vitest";
import * as nodemailer from "nodemailer";
import "dotenv/config";

describe("SMTP Gmail Configuration", () => {
  it("should verify SMTP credentials are valid", async () => {
    const password = process.env.GMAIL_APP_PASSWORD;
    expect(password).toBeDefined();
    expect(password!.length).toBeGreaterThanOrEqual(10);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "dropi.deliveries@gmail.com",
        pass: password,
      },
    });

    // verify() checks the connection without sending an email
    const result = await transporter.verify();
    expect(result).toBe(true);
  }, 15000);
});
