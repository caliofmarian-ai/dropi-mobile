from pathlib import Path
import json


def edit(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"Expected block not found in {path}: {old[:100]!r}")
    p.write_text(text.replace(old, new, 1))


# Drizzle user schema: nullable for backward compatibility, unique when present.
edit(
    "drizzle/schema.ts",
    '  email: varchar("email", { length: 320 }),\n  loginMethod: varchar("loginMethod", { length: 64 }),',
    '  email: varchar("email", { length: 320 }),\n  username: varchar("username", { length: 64 }).unique(),\n  loginMethod: varchar("loginMethod", { length: 64 }),',
)

# Canonical TEST identities receive deterministic usernames.
edit(
    "shared/test-role-accounts.ts",
    "  humanEmail: string;\n  aiEmail: string;\n  humanOpenId: string;",
    "  humanEmail: string;\n  aiEmail: string;\n  humanUsername: string;\n  aiUsername: string;\n  humanOpenId: string;",
)
edit(
    "shared/test-role-accounts.ts",
    "export function buildTestRoleOpenId(role: DropiRole, kind: TestIdentityKind): string {\n  return `dropi-test-${kind}-${role}`;\n}",
    "export function buildTestRoleUsername(role: DropiRole, kind: TestIdentityKind): string {\n  return `${kind}.${role}`;\n}\n\nexport function buildTestRoleOpenId(role: DropiRole, kind: TestIdentityKind): string {\n  return `dropi-test-${kind}-${role}`;\n}",
)
edit(
    "shared/test-role-accounts.ts",
    '  humanEmail: buildTestRoleEmail(config.role, "human"),\n  aiEmail: buildTestRoleEmail(config.role, "ai"),\n  humanOpenId:',
    '  humanEmail: buildTestRoleEmail(config.role, "human"),\n  aiEmail: buildTestRoleEmail(config.role, "ai"),\n  humanUsername: buildTestRoleUsername(config.role, "human"),\n  aiUsername: buildTestRoleUsername(config.role, "ai"),\n  humanOpenId:',
)

# DB lookup accepts normalized email or normalized username, recovery remains email-only.
edit(
    "server/db.ts",
    "export async function getUserByEmail(email: string) {\n  const db = await getDb();\n  if (!db) return undefined;\n  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);\n  return result.length > 0 ? result[0] : undefined;\n}\n\nexport async function getUserById",
    "export async function getUserByEmail(email: string) {\n  const db = await getDb();\n  if (!db) return undefined;\n  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);\n  return result.length > 0 ? result[0] : undefined;\n}\n\nexport async function getUserByLoginIdentifier(identifier: string) {\n  const db = await getDb();\n  if (!db) return undefined;\n  const normalized = identifier.toLowerCase().trim();\n  const result = await db\n    .select()\n    .from(users)\n    .where(or(eq(users.email, normalized), eq(users.username, normalized)))\n    .limit(1);\n  return result.length > 0 ? result[0] : undefined;\n}\n\nexport async function getUserById",
)

# Provisioning writes canonical username together with email/openId.
edit(
    "server/test-account-provisioning.ts",
    "    email: string;\n    name: string;",
    "    email: string;\n    username: string;\n    name: string;",
)
edit(
    "server/test-account-provisioning.ts",
    '    email: input.email,\n    loginMethod: "password",',
    '    email: input.email,\n    username: input.username,\n    loginMethod: "password",',
)
edit(
    "server/test-account-provisioning.ts",
    '        email: identity.humanEmail,\n        name: `Test ${identity.label}`,',
    '        email: identity.humanEmail,\n        username: identity.humanUsername,\n        name: `Test ${identity.label}`,',
)
edit(
    "server/test-account-provisioning.ts",
    '        email: identity.aiEmail,\n        name: `AI ${identity.label} Agent`,',
    '        email: identity.aiEmail,\n        username: identity.aiUsername,\n        name: `AI ${identity.label} Agent`,',
)

# Public login transport becomes identifier + password.
auth = Path("server/auth-router.ts")
text = auth.read_text()
schema_old = 'const loginSchema = z.object({\n  email: z.string().email(),\n  password: z.string().min(1),\n});'
schema_new = 'const loginSchema = z.object({\n  identifier: z.string().trim().min(3).max(320),\n  password: z.string().min(1),\n});'
if schema_old not in text:
    raise SystemExit("auth login schema not found")
text = text.replace(schema_old, schema_new, 1)
start = text.index("  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {")
end = text.index("  logout: protectedProcedure.mutation", start)
new_login = '''  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const ip = getClientIp(ctx.req);
    const normalizedIdentifier = input.identifier.toLowerCase().trim();
    const identifierType = normalizedIdentifier.includes("@") ? "email" : "username";
    const maskedIdentifier = identifierType === "email"
      ? maskEmail(normalizedIdentifier)
      : `${normalizedIdentifier.slice(0, 2)}***`;

    console.info(`[AUTH LOGIN] request_received identifier_type=${identifierType} identifier=${maskedIdentifier}`);

    if (!checkRateLimit(normalizedIdentifier)) {
      console.warn(`[AUTH LOGIN] failure_reason=rate_limited identifier_type=${identifierType} identifier=${maskedIdentifier}`);
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many login attempts for this account. Please try again in 15 minutes." });
    }

    const user = await db.getUserByLoginIdentifier(normalizedIdentifier);
    console.info(`[AUTH LOGIN] user_found=${user ? "yes" : "no"} identifier_type=${identifierType} identifier=${maskedIdentifier}`);
    if (!user || !user.passwordHash) {
      console.warn(`[AUTH LOGIN] failure_reason=${!user ? "user_not_found" : "missing_password_hash"} identifier_type=${identifierType} identifier=${maskedIdentifier}`);
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email/username or password" });
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      console.warn(`[AUTH LOGIN] failure_reason=account_locked userId=${user.id}`);
      const minutesLeft = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      throw new TRPCError({ code: "FORBIDDEN", message: `Account locked. Try again in ${minutesLeft} minutes.` });
    }

    if (!user.isActive) {
      console.warn(`[AUTH LOGIN] failure_reason=account_inactive userId=${user.id}`);
      throw new TRPCError({ code: "FORBIDDEN", message: "Account has been deactivated. Contact support." });
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    console.info(`[AUTH LOGIN] bcrypt_compare=${valid} userId=${user.id}`);
    if (!valid) {
      console.warn(`[AUTH LOGIN] failure_reason=invalid_password userId=${user.id}`);
      await db.incrementFailedLogin(user.id);
      if ((user.failedLoginAttempts || 0) + 1 >= 10) {
        await db.lockAccount(user.id, new Date(Date.now() + 30 * 60 * 1000));
      }
      await createAuditLog({
        userId: user.id,
        userRole: user.dropiRole,
        action: "auth.login_failed",
        resourceType: "user",
        resourceId: String(user.id),
        severity: "warning",
        channel: user.channel as any,
        isAIAction: user.isAIAgent,
        isPhantomMode: false,
        ipAddress: ip,
        userAgent: getDeviceInfo(ctx.req),
        details: { identifierType, reason: "invalid_password" },
      });
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email/username or password" });
    }

    await db.resetFailedLogin(user.id);
    await db.updateUserLastLogin(user.id, ip, getDeviceInfo(ctx.req));

    const token = await sdk.createSessionToken(user.openId, { name: user.name || "" });
    console.info(`[AUTH LOGIN] jwt_created=true userId=${user.id}`);

    await db.createSession({
      userId: user.id,
      token,
      deviceInfo: getDeviceInfo(ctx.req),
      ipAddress: ip,
      isPhantom: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await createAuditLog({
      userId: user.id,
      userRole: user.dropiRole,
      action: "auth.login",
      resourceType: "user",
      resourceId: String(user.id),
      severity: "info",
      channel: user.channel as any,
      isAIAction: user.isAIAgent,
      isPhantomMode: false,
      ipAddress: ip,
      userAgent: getDeviceInfo(ctx.req),
      details: { identifierType },
    });

    return { user, token };
  }),

'''
text = text[:start] + new_login + text[end:]
auth.write_text(text)

# Mobile auth context sends identifier through the same real-session path.
p = Path("lib/auth-context.tsx")
text = p.read_text()
text = text.replace(
    "login: (email: string, password: string) => Promise<AuthActionResult>;",
    "login: (identifier: string, password: string) => Promise<AuthActionResult>;",
)
old = '''  const login = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const result = await apiCall("dropiAuth.login", { email: normalizedEmail, password });
      if (!result?.token || !result?.user) throw new Error("Login response did not contain a valid session");
      await applyAuthenticatedSession(
        toDropiUser(result.user, normalizedEmail.split("@")[0]),
        result.token,
        false,
      );
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Login failed" };
    }
  }, [applyAuthenticatedSession]);'''
new = '''  const login = useCallback(async (identifier: string, password: string): Promise<AuthActionResult> => {
    try {
      const normalizedIdentifier = identifier.toLowerCase().trim();
      const result = await apiCall("dropiAuth.login", { identifier: normalizedIdentifier, password });
      if (!result?.token || !result?.user) throw new Error("Login response did not contain a valid session");
      const fallbackName = normalizedIdentifier.includes("@")
        ? normalizedIdentifier.split("@")[0]
        : normalizedIdentifier;
      await applyAuthenticatedSession(
        toDropiUser(result.user, fallbackName),
        result.token,
        false,
      );
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Login failed" };
    }
  }, [applyAuthenticatedSession]);'''
if old not in text:
    raise SystemExit("auth-context login block not found")
p.write_text(text.replace(old, new, 1))

# Login UI states the identifier contract explicitly.
p = Path("app/login.tsx")
text = p.read_text()
text = text.replace("Please enter email and password", "Please enter email or username and password")
text = text.replace(
    '<Text className="text-sm font-medium text-foreground mb-1.5">Email</Text>',
    '<Text className="text-sm font-medium text-foreground mb-1.5">Email or Username</Text>',
    1,
)
text = text.replace('placeholder="your@email.com"', 'placeholder="email@example.com or username"', 1)
text = text.replace('keyboardType="email-address"', 'keyboardType="default"', 1)
p.write_text(text)

# Phantom Console projection can show/search username without exposing credentials.
p = Path("server/phantom-console-router.ts")
text = p.read_text()
text = text.replace("  email: users.email,\n  dropiRole:", "  email: users.email,\n  username: users.username,\n  dropiRole:", 1)
text = text.replace(
    "          like(users.email, `%${search}%`),\n          like(users.dropiRole,",
    "          like(users.email, `%${search}%`),\n          like(users.username, `%${search}%`),\n          like(users.dropiRole,",
    1,
)
p.write_text(text)

# Migration 0023.
Path("drizzle/0023_usernames.sql").write_text(
    "ALTER TABLE `users` ADD `username` varchar(64);\n"
    "--> statement-breakpoint\n"
    "ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);\n"
)

journal_path = Path("drizzle/meta/_journal.json")
journal = json.loads(journal_path.read_text())
if not any(e.get("tag") == "0023_usernames" for e in journal["entries"]):
    journal["entries"].append(
        {
            "idx": 23,
            "version": "5",
            "when": 1788697200000,
            "tag": "0023_usernames",
            "breakpoints": True,
        }
    )
journal_path.write_text(json.dumps(journal, indent=2) + "\n")

# Runtime regression: both email and username normalize into one lookup.
Path("tests/auth.login-normalize.test.ts").write_text(r'''import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";

const dbMock = vi.hoisted(() => ({
  getUserByLoginIdentifier: vi.fn(),
  incrementFailedLogin: vi.fn(),
  resetFailedLogin: vi.fn(),
  updateUserLastLogin: vi.fn(),
  createSession: vi.fn(),
  createAuditLog: vi.fn(),
}));
const sdkMock = vi.hoisted(() => ({ sdk: { createSessionToken: vi.fn(), authenticateRequest: vi.fn() } }));
const mailMock = vi.hoisted(() => ({
  sendPlatformEmail: vi.fn(),
  maskEmail: vi.fn((email: string) => email.replace(/(^.).*(@.*$)/, "$1***$2")),
}));
vi.mock("../server/db", () => dbMock);
vi.mock("../server/_core/sdk", () => sdkMock);
vi.mock("../server/_core/mail", () => mailMock);
const { dropiAuthRouter } = await import("../server/auth-router");

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { headers: {}, ip: "127.0.0.1" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

async function getLookupIdentifier(identifier: string): Promise<string> {
  dbMock.getUserByLoginIdentifier.mockResolvedValue(undefined);
  const caller = dropiAuthRouter.createCaller(createPublicContext());
  await caller.login({ identifier, password: "any" }).catch(() => {});
  const calls = dbMock.getUserByLoginIdentifier.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return String(calls[0]?.[0] ?? "");
}

describe("dropiAuth.login — email or username normalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.createAuditLog.mockResolvedValue(undefined);
    dbMock.incrementFailedLogin.mockResolvedValue(undefined);
    dbMock.resetFailedLogin.mockResolvedValue(undefined);
    dbMock.updateUserLastLogin.mockResolvedValue(undefined);
    dbMock.createSession.mockResolvedValue(undefined);
    sdkMock.sdk.createSessionToken.mockResolvedValue("jwt-token");
  });

  it("normalizes uppercase email before lookup", async () => {
    expect(await getLookupIdentifier("ADMIN@EXAMPLE.COM")).toBe("admin@example.com");
  });

  it("normalizes mixed-case username before lookup", async () => {
    expect(await getLookupIdentifier("Human.Delivery_Partner")).toBe("human.delivery_partner");
  });

  it("trims either identifier before lookup", async () => {
    expect(await getLookupIdentifier("  human.delivery_partner  ")).toBe("human.delivery_partner");
  });

  it("rejects an empty identifier before DB lookup", async () => {
    const caller = dropiAuthRouter.createCaller(createPublicContext());
    await expect(caller.login({ identifier: "  ", password: "any" })).rejects.toThrow();
    expect(dbMock.getUserByLoginIdentifier).not.toHaveBeenCalled();
  });
});
''')

Path("tests/auth.username-login-384-contract.test.ts").write_text(r'''import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("AUTH-384 username login contract", () => {
  it("adds a unique nullable username and migration", () => {
    const schema = source("drizzle/schema.ts");
    const migration = source("drizzle/0023_usernames.sql");
    const journal = source("drizzle/meta/_journal.json");
    expect(schema).toContain('username: varchar("username", { length: 64 }).unique()');
    expect(migration).toContain('UNIQUE(`username`)');
    expect(journal).toContain('"tag": "0023_usernames"');
  });

  it("provisions deterministic human and AI usernames", () => {
    const registry = source("shared/test-role-accounts.ts");
    const provisioning = source("server/test-account-provisioning.ts");
    expect(registry).toContain('return `${kind}.${role}`');
    expect(provisioning).toContain("username: identity.humanUsername");
    expect(provisioning).toContain("username: identity.aiUsername");
  });

  it("uses normalized email-or-username lookup while recovery stays email-only", () => {
    const auth = source("server/auth-router.ts");
    const db = source("server/db.ts");
    expect(auth).toContain("identifier: z.string().trim().min(3).max(320)");
    expect(auth).toContain("db.getUserByLoginIdentifier(normalizedIdentifier)");
    expect(db).toContain("or(eq(users.email, normalized), eq(users.username, normalized))");
    expect(auth).toContain("forgotPassword: publicProcedure.input(forgotPasswordSchema)");
    expect(auth).toContain("const forgotPasswordSchema = z.object({\n  email: z.string().email()");
    expect(auth).not.toContain("getUserById(Number(input.identifier))");
  });

  it("updates mobile login wording and transport", () => {
    const screen = source("app/login.tsx");
    const context = source("lib/auth-context.tsx");
    expect(screen).toContain("Email or Username");
    expect(context).toContain('apiCall("dropiAuth.login", { identifier: normalizedIdentifier, password })');
  });
});
''')

# Wire new migration/test into Security Assurance.
workflow = Path(".github/workflows/validate-security-assurance-pr.yml")
text = workflow.read_text()
text = text.replace(
    "      - drizzle/0022_verification_evidence_attachments.sql\n",
    "      - drizzle/0022_verification_evidence_attachments.sql\n      - drizzle/0023_usernames.sql\n",
    1,
)
text = text.replace(
    "      - tests/auth.login-normalize.test.ts\n",
    "      - tests/auth.login-normalize.test.ts\n      - tests/auth.username-login-384-contract.test.ts\n",
    1,
)
text = text.replace(
    "          tests/auth.login-normalize.test.ts\n          tests/auth.login-session.test.ts",
    "          tests/auth.login-normalize.test.ts\n          tests/auth.username-login-384-contract.test.ts\n          tests/auth.login-session.test.ts",
    1,
)
workflow.write_text(text)
