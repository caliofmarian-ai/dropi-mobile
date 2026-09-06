from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise AssertionError(f"missing patch anchor: {label}")
    return text.replace(old, new, 1)

# server/auth-router.ts
path = Path("server/auth-router.ts")
s = path.read_text()
s = replace_once(
    s,
    '''async function sendRecoveryEmail(toEmail: string, code: string): Promise<boolean> {\n  return sendPlatformEmail({\n    to: toEmail,\n    subject: "DROPi - Password Reset Code",\n    logLabel: "password reset email",\n    html: `\n''',
    '''async function sendRecoveryEmail(\n  toEmail: string,\n  code: string,\n  recoveryAccountLabel?: string | null,\n): Promise<boolean> {\n  const accountMarker = recoveryAccountLabel\n    ? `<p data-dropi-recovery-account="${recoveryAccountLabel}" style="color:#666;font-size:13px;">Account: <strong>${recoveryAccountLabel}</strong></p>`\n    : "";\n  return sendPlatformEmail({\n    to: toEmail,\n    subject: recoveryAccountLabel\n      ? `DROPi - Password Reset Code — ${recoveryAccountLabel}`\n      : "DROPi - Password Reset Code",\n    logLabel: "password reset email",\n    html: `\n''',
    "sendRecoveryEmail signature",
)
s = replace_once(
    s,
    '''          <p>You requested a password reset. Use the code below to set a new password:</p>\n          <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">\n''',
    '''          <p>You requested a password reset. Use the code below to set a new password:</p>\n          ${accountMarker}\n          <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">\n''',
    "recovery account marker",
)
s = replace_once(
    s,
    '''const CANONICAL_TEST_ACCOUNT_EMAILS = new Set(\n  TEST_ROLE_IDENTITIES.flatMap((identity) => [identity.humanEmail, identity.aiEmail])\n    .map((email) => email.trim().toLowerCase()),\n);\n\nfunction resolveRecoveryDeliveryEmail(accountEmail: string): string {\n  const normalized = accountEmail.trim().toLowerCase();\n  return CANONICAL_TEST_ACCOUNT_EMAILS.has(normalized)\n    ? DROPI_TEST_BASE_INBOX\n    : normalized;\n}\n''',
    '''const CANONICAL_TEST_ACCOUNT_EMAILS = new Set(\n  TEST_ROLE_IDENTITIES.flatMap((identity) => [identity.humanEmail, identity.aiEmail])\n    .map((email) => email.trim().toLowerCase()),\n);\n\nfunction resolveCanonicalTestRecoveryLabel(accountEmail: string): string | null {\n  const normalized = accountEmail.trim().toLowerCase();\n  for (const identity of TEST_ROLE_IDENTITIES) {\n    if (identity.humanEmail.toLowerCase() === normalized) return identity.humanUsername;\n    if (identity.aiEmail.toLowerCase() === normalized) return identity.aiUsername;\n  }\n  return null;\n}\n\nfunction resolveRecoveryDeliveryEmail(accountEmail: string): string {\n  const normalized = accountEmail.trim().toLowerCase();\n  return CANONICAL_TEST_ACCOUNT_EMAILS.has(normalized)\n    ? DROPI_TEST_BASE_INBOX\n    : normalized;\n}\n\nfunction maskRecoveryIdentifier(identifier: string): string {\n  return identifier.includes("@")\n    ? maskEmail(identifier)\n    : `${identifier.slice(0, 2)}***`;\n}\n''',
    "canonical recovery helpers",
)
s = replace_once(
    s,
    '''const forgotPasswordSchema = z.object({\n  email: z.string().email(),\n});\n''',
    '''const forgotPasswordSchema = z.union([\n  z.object({ email: z.string().email() }),\n  z.object({ identifier: z.string().trim().min(3).max(320) }),\n]);\n''',
    "forgot password schema",
)
s = replace_once(
    s,
    '''  forgotPassword: publicProcedure.input(forgotPasswordSchema).mutation(async ({ input, ctx }) => {\n    const normalizedEmail = input.email.toLowerCase().trim();\n    if (!checkWindowLimit(recoveryRequests, normalizedEmail, RECOVERY_RATE_LIMIT_MAX)) {\n      throw new TRPCError({\n        code: "TOO_MANY_REQUESTS",\n        message: "Too many password recovery requests. Please try again in 15 minutes.",\n      });\n    }\n\n    const user = await db.getUserByEmail(normalizedEmail);\n    // Always return success to prevent email enumeration.\n    if (!user) {\n      return { success: true, message: "If this email is registered, a 6-digit code has been sent." };\n    }\n\n    // Generate 6-digit verification code. db.setResetToken protects it at rest.\n    const code = String(randomInt(100000, 1_000_000));\n    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes\n    await db.setResetToken(user.id, code, expiry);\n    const recoveryDeliveryEmail = resolveRecoveryDeliveryEmail(normalizedEmail);\n''',
    '''  forgotPassword: publicProcedure.input(forgotPasswordSchema).mutation(async ({ input, ctx }) => {\n    const normalizedIdentifier = ("identifier" in input ? input.identifier : input.email)\n      .toLowerCase()\n      .trim();\n    const identifierType = normalizedIdentifier.includes("@") ? "email" : "username";\n    const maskedIdentifier = maskRecoveryIdentifier(normalizedIdentifier);\n\n    if (!checkWindowLimit(recoveryRequests, normalizedIdentifier, RECOVERY_RATE_LIMIT_MAX)) {\n      console.warn(`[PASSWORD RESET] outcome=rate_limited identifier_type=${identifierType} identifier=${maskedIdentifier}`);\n      throw new TRPCError({\n        code: "TOO_MANY_REQUESTS",\n        message: "Too many password recovery requests. Please try again in 15 minutes.",\n      });\n    }\n\n    const user = await db.getUserByLoginIdentifier(normalizedIdentifier);\n    // Always return generic success to prevent account enumeration. The server\n    // records only a masked diagnostic outcome for owner troubleshooting.\n    if (!user) {\n      console.info(`[PASSWORD RESET] outcome=user_not_found identifier_type=${identifierType} identifier=${maskedIdentifier}`);\n      return { success: true, message: "If this account is registered, a 6-digit code has been sent." };\n    }\n\n    const normalizedEmail = user.email?.toLowerCase().trim() || "";\n    if (!normalizedEmail) {\n      console.error(`[PASSWORD RESET] outcome=missing_email userId=${user.id}`);\n      return { success: true, message: "If this account is registered, a 6-digit code has been sent." };\n    }\n\n    console.info(`[PASSWORD RESET] outcome=user_found userId=${user.id} identifier_type=${identifierType}`);\n\n    // Generate 6-digit verification code. db.setResetToken protects it at rest.\n    const code = String(randomInt(100000, 1_000_000));\n    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes\n    await db.setResetToken(user.id, code, expiry);\n    const recoveryDeliveryEmail = resolveRecoveryDeliveryEmail(normalizedEmail);\n    const recoveryAccountLabel = resolveCanonicalTestRecoveryLabel(normalizedEmail);\n''',
    "forgot password lookup",
)
s = replace_once(
    s,
    '''        email: normalizedEmail,\n        codeGenerated: true,\n        recoveryDeliveryRoutedToBaseInbox: recoveryDeliveryEmail !== normalizedEmail,\n''',
    '''        email: normalizedEmail,\n        identifierType,\n        codeGenerated: true,\n        recoveryDeliveryRoutedToBaseInbox: recoveryDeliveryEmail !== normalizedEmail,\n        canonicalTestRecovery: Boolean(recoveryAccountLabel),\n''',
    "recovery audit details",
)
s = replace_once(
    s,
    '''    const emailSent = await sendRecoveryEmail(recoveryDeliveryEmail, code);\n    if (!emailSent) {\n      await db.clearResetToken(user.id);\n      console.error(`[PASSWORD RESET] Delivery failed for userId=${user.id} email=${maskEmail(normalizedEmail)}`);\n      throw new TRPCError({\n        code: "INTERNAL_SERVER_ERROR",\n        message: "Unable to send reset code right now. Please try again later.",\n      });\n    }\n\n    return { success: true, message: "If this email is registered, a 6-digit code has been sent." };\n''',
    '''    console.info(`[PASSWORD RESET] outcome=delivery_attempted userId=${user.id} routed_to_base=${recoveryDeliveryEmail !== normalizedEmail}`);\n    const emailSent = await sendRecoveryEmail(recoveryDeliveryEmail, code, recoveryAccountLabel);\n    if (!emailSent) {\n      await db.clearResetToken(user.id);\n      console.error(`[PASSWORD RESET] outcome=provider_rejected userId=${user.id} email=${maskEmail(normalizedEmail)}`);\n      throw new TRPCError({\n        code: "INTERNAL_SERVER_ERROR",\n        message: "Unable to send reset code right now. Please try again later.",\n      });\n    }\n\n    console.info(`[PASSWORD RESET] outcome=provider_accepted userId=${user.id}`);\n    return { success: true, message: "If this account is registered, a 6-digit code has been sent." };\n''',
    "recovery delivery diagnostics",
)
path.write_text(s)

# lib/auth-context.tsx
path = Path("lib/auth-context.tsx")
s = path.read_text()
s = s.replace(
    'forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;',
    'forgotPassword: (identifier: string) => Promise<{ success: boolean; message?: string }>;',
    1,
)
s = replace_once(
    s,
    '''  const forgotPassword = useCallback(async (email: string): Promise<{ success: boolean; message?: string }> => {\n    try {\n      const result = await apiCall("dropiAuth.forgotPassword", { email: email.toLowerCase().trim() });\n''',
    '''  const forgotPassword = useCallback(async (identifier: string): Promise<{ success: boolean; message?: string }> => {\n    try {\n      const result = await apiCall("dropiAuth.forgotPassword", { identifier: identifier.toLowerCase().trim() });\n''',
    "auth context recovery identifier",
)
path.write_text(s)

# app/forgot-password.tsx
path = Path("app/forgot-password.tsx")
s = path.read_text()
s = s.replace('const [email, setEmail] = useState("");', 'const [identifier, setIdentifier] = useState("");', 1)
s = replace_once(
    s,
    '''    if (!email.trim()) {\n      setError("Please enter your email address");\n      return;\n    }\n''',
    '''    if (!identifier.trim()) {\n      setError("Please enter your email address or username");\n      return;\n    }\n''',
    "forgot UI validation",
)
s = s.replace('const result = await forgotPassword(email);', 'const result = await forgotPassword(identifier);', 1)
s = s.replace('}, [email, forgotPassword]);', '}, [identifier, forgotPassword]);', 1)
s = s.replace('Enter your email address and we\'ll send you a 6-digit verification code.', 'Enter your email address or username and we\'ll send a 6-digit verification code to the account email.', 1)
s = s.replace('Enter the 6-digit code sent to your email.', 'Enter the 6-digit code sent to the account email.', 1)
s = s.replace('Email Address</Text>', 'Email or Username</Text>', 1)
s = s.replace('placeholder="your@email.com"', 'placeholder="email@example.com or username"', 1)
s = s.replace('value={email}', 'value={identifier}', 1)
s = s.replace('onChangeText={(t) => { setEmail(t); setError(""); }}', 'onChangeText={(t) => { setIdentifier(t); setError(""); }}', 1)
s = s.replace('keyboardType="email-address"', 'keyboardType="default"', 1)
path.write_text(s)

# server/_core/mail.ts
path = Path("server/_core/mail.ts")
s = path.read_text()
s = replace_once(
    s,
    '''  const safeCode = escapeHtml(resetCode);\n\n  return `<!doctype html>\n''',
    '''  const safeCode = escapeHtml(resetCode);\n  const recoveryAccount = innerHtml.match(/data-dropi-recovery-account="([a-z0-9._-]+)"/i)?.[1];\n  const safeRecoveryAccount = recoveryAccount ? escapeHtml(recoveryAccount) : null;\n\n  return `<!doctype html>\n''',
    "mail account extraction",
)
s = replace_once(
    s,
    '''                <p style="margin:13px auto 0;max-width:470px;color:#6A7487;font-size:14px;line-height:22px;">We received a request to reset your DROPi account password.<br />Use the verification code below to continue.</p>\n              </td>\n''',
    '''                <p style="margin:13px auto 0;max-width:470px;color:#6A7487;font-size:14px;line-height:22px;">We received a request to reset your DROPi account password.<br />Use the verification code below to continue.</p>\n                ${safeRecoveryAccount ? `<div style="margin-top:12px;color:#39465B;font-size:13px;line-height:20px;">Account: <strong>${safeRecoveryAccount}</strong></div>` : ""}\n              </td>\n''',
    "mail account presentation",
)
path.write_text(s)

# tests/auth.forgot-password.test.ts
path = Path("tests/auth.forgot-password.test.ts")
s = path.read_text()
s = s.replace('  getUserByEmail: vi.fn(),', '  getUserByLoginIdentifier: vi.fn(),', 1)
s = s.replace('dbMock.getUserByEmail', 'dbMock.getUserByLoginIdentifier')
s = s.replace('caller.forgotPassword({ email: "missing@example.com" })', 'caller.forgotPassword({ identifier: "missing@example.com" })', 1)
s = s.replace('caller.forgotPassword({ email: "user@example.com" })', 'caller.forgotPassword({ identifier: "user@example.com" })')
s = s.replace('caller.forgotPassword({ email: alias })', 'caller.forgotPassword({ identifier: alias })')
s = s.replace('caller.forgotPassword({ email: "normal.user@example.org" })', 'caller.forgotPassword({ identifier: "normal.user@example.org" })', 1)
s = s.replace('expect(dbMock.getUserByLoginIdentifier).toHaveBeenCalledWith(alias);', 'expect(dbMock.getUserByLoginIdentifier).toHaveBeenCalledWith(alias);', 1)
# add username fields to canonical rows and assert labeled subject
s = s.replace('      email: alias,\n      dropiRole: "delivery_partner",', '      email: alias,\n      username: "human.delivery_partner",\n      dropiRole: "delivery_partner",', 1)
s = s.replace('      email: alias,\n      dropiRole: "delivery_partner",', '      email: alias,\n      username: "ai.delivery_partner",\n      dropiRole: "delivery_partner",', 1)
s = replace_once(
    s,
    '''    expect(mailMock.sendPlatformEmail).toHaveBeenCalledWith(\n      expect.objectContaining({ to: "dropi.deliveries@gmail.com" }),\n    );\n  });\n\n  it("routes canonical TEST AI recovery to the governed base inbox", async () => {\n''',
    '''    expect(mailMock.sendPlatformEmail).toHaveBeenCalledWith(\n      expect.objectContaining({\n        to: "dropi.deliveries@gmail.com",\n        subject: "DROPi - Password Reset Code — human.delivery_partner",\n        html: expect.stringContaining('data-dropi-recovery-account="human.delivery_partner"'),\n      }),\n    );\n  });\n\n  it("accepts a canonical TEST username and routes recovery to the governed base inbox", async () => {\n    const alias = "dropi.deliveries+human.delivery_partner@gmail.com";\n    dbMock.getUserByLoginIdentifier.mockResolvedValue({\n      id: 153,\n      email: alias,\n      username: "human.delivery_partner",\n      dropiRole: "delivery_partner",\n      channel: "C1",\n      isAIAgent: false,\n    });\n    const caller = dropiAuthRouter.createCaller(createPublicContext());\n\n    const result = await caller.forgotPassword({ identifier: "human.delivery_partner" });\n\n    expect(result.success).toBe(true);\n    expect(dbMock.getUserByLoginIdentifier).toHaveBeenCalledWith("human.delivery_partner");\n    expect(mailMock.sendPlatformEmail).toHaveBeenCalledWith(\n      expect.objectContaining({\n        to: "dropi.deliveries@gmail.com",\n        subject: "DROPi - Password Reset Code — human.delivery_partner",\n      }),\n    );\n  });\n\n  it("routes canonical TEST AI recovery to the governed base inbox", async () => {\n''',
    "test human labeled recovery",
)
path.write_text(s)

# tests/mail.password-recovery-template.test.ts
path = Path("tests/mail.password-recovery-template.test.ts")
s = path.read_text()
anchor = '''  it("shows Facebook, TikTok and Telegram as non-clickable placeholders", () => {\n'''
insert = '''  it("shows the canonical TEST account label when supplied", () => {\n    const html = renderPasswordRecoveryEmail(`\n      <p>You requested a password reset. Use the code below to set a new password:</p>\n      <p data-dropi-recovery-account="human.delivery_partner">Account: human.delivery_partner</p>\n      <span>654321</span>\n    `);\n\n    expect(html).toContain("Account:");\n    expect(html).toContain("human.delivery_partner");\n  });\n\n  it("shows Facebook, TikTok and Telegram as non-clickable placeholders", () => {\n'''
s = replace_once(s, anchor, insert, "mail test account label")
path.write_text(s)

# tests/test-account-auth-recovery-379-contract.test.ts
path = Path("tests/test-account-auth-recovery-379-contract.test.ts")
s = path.read_text()
s = s.replace(
    'expect(auth).toContain("const emailSent = await sendRecoveryEmail(recoveryDeliveryEmail, code)");',
    'expect(auth).toContain("const emailSent = await sendRecoveryEmail(recoveryDeliveryEmail, code, recoveryAccountLabel)");',
    1,
)
s = s.replace(
    'expect(auth).toContain("await db.setResetToken(user.id, code, expiry)");',
    'expect(auth).toContain("await db.setResetToken(user.id, code, expiry)");\n    expect(auth).toContain("db.getUserByLoginIdentifier(normalizedIdentifier)");\n    expect(auth).toContain("resolveCanonicalTestRecoveryLabel(normalizedEmail)");',
    1,
)
path.write_text(s)
