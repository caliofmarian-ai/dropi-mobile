/**
 * Tests for scripts/provision-admin.ts
 *
 * Covers:
 *  - successful administrator creation
 *  - correct password hashing and verification (real bcrypt — no mock)
 *  - correct canonical DROPi administrator RBAC fields
 *  - email normalisation (lowercase + trim)
 *  - idempotency: second call with same email returns "already_exists"
 *  - existing account is never overwritten
 *  - missing or invalid environment variables fail safely and descriptively
 *  - secrets (password, hash, DATABASE_URL) are never written to any log channel
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import {
  provisionAdmin,
  validateEnv,
  type ProvisionDb,
  type ProvisionInput,
} from "../scripts/provision-admin";

// ===== MOCK DB FACTORY =====

/**
 * Creates a lightweight in-memory ProvisionDb mock.
 *
 * @param existingUsers  - rows returned by SELECT (simulates "account already exists")
 */
function createMockDb(existingUsers: unknown[] = []): {
  db: ProvisionDb;
  getInsertedValues: () => unknown;
  insertCallCount: () => number;
} {
  let insertedValues: unknown = undefined;
  let insertCallCount = 0;

  const db: ProvisionDb = {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(existingUsers),
        }),
      }),
    }),
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((data: unknown) => {
        insertedValues = data;
        insertCallCount++;
        return Promise.resolve({ insertId: 1 });
      }),
    })),
  };

  return {
    db,
    getInsertedValues: () => insertedValues,
    insertCallCount: () => insertCallCount,
  };
}

const VALID_INPUT: ProvisionInput = {
  email: "admin@example.com",
  password: "SecureAdmin1",
  name: "Test Admin",
};

// ===== CORE PROVISIONING TESTS =====

describe("provisionAdmin — successful creation", () => {
  it("returns status 'created' when the email does not exist", async () => {
    const { db } = createMockDb([]);
    const result = await provisionAdmin(db, VALID_INPUT);

    expect(result.status).toBe("created");
    expect(result.email).toBe("admin@example.com");
  });

  it("inserts exactly one row into the users table", async () => {
    const { db, insertCallCount } = createMockDb([]);
    await provisionAdmin(db, VALID_INPUT);

    expect(insertCallCount()).toBe(1);
  });
});

describe("provisionAdmin — correct RBAC fields", () => {
  it("assigns the canonical DROPi system administrator RBAC fields", async () => {
    const { db, getInsertedValues } = createMockDb([]);
    await provisionAdmin(db, VALID_INPUT);

    const inserted = getInsertedValues() as Record<string, unknown>;

    expect(inserted.role).toBe("admin");
    expect(inserted.dropiRole).toBe("system_administrator");
    expect(inserted.channel).toBe("ADMIN");
    expect(inserted.loginMethod).toBe("password");
    expect(inserted.isActive).toBe(true);
    expect(inserted.isVerified).toBe(true);
    expect(inserted.emailVerified).toBe(true);
    expect(inserted.isAIAgent).toBe(false);
    expect(inserted.zone).toBeNull();
  });

  it("sets a non-empty unique openId prefixed with dropi_admin_", async () => {
    const { db, getInsertedValues } = createMockDb([]);
    await provisionAdmin(db, VALID_INPUT);

    const inserted = getInsertedValues() as Record<string, unknown>;
    expect(typeof inserted.openId).toBe("string");
    expect((inserted.openId as string).startsWith("dropi_admin_")).toBe(true);
    expect((inserted.openId as string).length).toBeGreaterThan(20);
  });

  it("sets lastSignedIn to a current Date", async () => {
    const before = Date.now();
    const { db, getInsertedValues } = createMockDb([]);
    await provisionAdmin(db, VALID_INPUT);
    const after = Date.now();

    const inserted = getInsertedValues() as Record<string, unknown>;
    expect(inserted.lastSignedIn).toBeInstanceOf(Date);
    const ts = (inserted.lastSignedIn as Date).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("uses the provided name", async () => {
    const { db, getInsertedValues } = createMockDb([]);
    await provisionAdmin(db, { ...VALID_INPUT, name: "DROPi Super Admin" });

    const inserted = getInsertedValues() as Record<string, unknown>;
    expect(inserted.name).toBe("DROPi Super Admin");
  });
});

describe("provisionAdmin — password hashing", () => {
  it("stores a non-empty passwordHash (never the raw password)", async () => {
    const { db, getInsertedValues } = createMockDb([]);
    await provisionAdmin(db, VALID_INPUT);

    const inserted = getInsertedValues() as Record<string, unknown>;
    const hash = inserted.passwordHash as string;

    expect(hash).toBeTruthy();
    expect(hash).not.toBe(VALID_INPUT.password);
  });

  it("stores a bcrypt hash that verifies against the original password", async () => {
    const { db, getInsertedValues } = createMockDb([]);
    await provisionAdmin(db, VALID_INPUT);

    const inserted = getInsertedValues() as Record<string, unknown>;
    const hash = inserted.passwordHash as string;

    const match = await bcrypt.compare(VALID_INPUT.password, hash);
    expect(match).toBe(true);
  });

  it("rejects an incorrect password against the stored hash", async () => {
    const { db, getInsertedValues } = createMockDb([]);
    await provisionAdmin(db, VALID_INPUT);

    const inserted = getInsertedValues() as Record<string, unknown>;
    const hash = inserted.passwordHash as string;

    const match = await bcrypt.compare("WrongPassword9", hash);
    expect(match).toBe(false);
  });
});

describe("provisionAdmin — email normalisation", () => {
  it("normalises email to lowercase", async () => {
    const { db, getInsertedValues } = createMockDb([]);
    await provisionAdmin(db, { ...VALID_INPUT, email: "ADMIN@Example.COM" });

    const inserted = getInsertedValues() as Record<string, unknown>;
    expect(inserted.email).toBe("admin@example.com");
  });

  it("trims whitespace from email", async () => {
    const { db, getInsertedValues } = createMockDb([]);
    await provisionAdmin(db, { ...VALID_INPUT, email: "  admin@example.com  " });

    const inserted = getInsertedValues() as Record<string, unknown>;
    expect(inserted.email).toBe("admin@example.com");
  });

  it("returns the normalised email in the result", async () => {
    const { db } = createMockDb([]);
    const result = await provisionAdmin(db, { ...VALID_INPUT, email: "  ADMIN@Example.COM  " });

    expect(result.email).toBe("admin@example.com");
  });
});

describe("provisionAdmin — idempotency", () => {
  it("returns 'already_exists' when a user with that email is found in the DB", async () => {
    const { db, insertCallCount } = createMockDb([{ id: 42 }]);
    const result = await provisionAdmin(db, VALID_INPUT);

    expect(result.status).toBe("already_exists");
    expect(result.email).toBe("admin@example.com");
    // No insert must happen
    expect(insertCallCount()).toBe(0);
  });

  it("never calls insert when the account already exists", async () => {
    const { db, insertCallCount } = createMockDb([{ id: 1 }]);
    await provisionAdmin(db, VALID_INPUT);

    expect(insertCallCount()).toBe(0);
  });
});

describe("provisionAdmin — secrets not logged", () => {
  it("does not write the password to any console channel during creation", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { db } = createMockDb([]);
    await provisionAdmin(db, VALID_INPUT);

    const allLogged = [
      ...logSpy.mock.calls,
      ...warnSpy.mock.calls,
      ...errorSpy.mock.calls,
    ]
      .flat()
      .map(String);

    for (const line of allLogged) {
      expect(line).not.toContain(VALID_INPUT.password);
    }

    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("does not write the password hash to any console channel during creation", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { db, getInsertedValues } = createMockDb([]);
    await provisionAdmin(db, VALID_INPUT);

    const hash = (getInsertedValues() as Record<string, unknown>).passwordHash as string;

    const allLogged = [
      ...logSpy.mock.calls,
      ...warnSpy.mock.calls,
      ...errorSpy.mock.calls,
    ]
      .flat()
      .map(String);

    for (const line of allLogged) {
      expect(line).not.toContain(hash);
    }

    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

// ===== ENVIRONMENT VARIABLE VALIDATION TESTS =====

describe("validateEnv — missing required variables", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset to a known valid state before each test
    process.env.DATABASE_URL = "******host:3306/db";
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.ADMIN_PASSWORD = "SecureAdmin1";
    delete process.env.ADMIN_NAME;
  });

  afterEach(() => {
    // Restore original env
    for (const key of ["DATABASE_URL", "ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_NAME"]) {
      if (originalEnv[key] !== undefined) {
        process.env[key] = originalEnv[key];
      } else {
        delete process.env[key];
      }
    }
  });

  it("throws when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    expect(() => validateEnv()).toThrow("DATABASE_URL environment variable is required");
  });

  it("throws when ADMIN_EMAIL is missing", () => {
    delete process.env.ADMIN_EMAIL;
    expect(() => validateEnv()).toThrow("ADMIN_EMAIL environment variable is required");
  });

  it("throws when ADMIN_PASSWORD is missing", () => {
    delete process.env.ADMIN_PASSWORD;
    expect(() => validateEnv()).toThrow("ADMIN_PASSWORD environment variable is required");
  });

  it("throws when ADMIN_PASSWORD is shorter than 8 characters", () => {
    process.env.ADMIN_PASSWORD = "Short1";
    expect(() => validateEnv()).toThrow("ADMIN_PASSWORD must be at least 8 characters");
  });

  it("throws when ADMIN_PASSWORD has no uppercase letter", () => {
    process.env.ADMIN_PASSWORD = "alllower1";
    expect(() => validateEnv()).toThrow(
      "ADMIN_PASSWORD must contain at least one uppercase letter",
    );
  });

  it("throws when ADMIN_PASSWORD has no digit", () => {
    process.env.ADMIN_PASSWORD = "NoDigitsHere";
    expect(() => validateEnv()).toThrow("ADMIN_PASSWORD must contain at least one number");
  });

  it("returns all fields when environment is valid", () => {
    const env = validateEnv();
    expect(env.databaseUrl).toBe("******host:3306/db");
    expect(env.email).toBe("admin@example.com");
    expect(env.password).toBe("SecureAdmin1");
    expect(env.name).toBe("Super Admin"); // ADMIN_NAME not set → default
  });

  it("uses ADMIN_NAME when provided", () => {
    process.env.ADMIN_NAME = "My Custom Admin";
    const env = validateEnv();
    expect(env.name).toBe("My Custom Admin");
  });

  it("does not log the password when validation fails", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    process.env.ADMIN_PASSWORD = "weak";
    try {
      validateEnv();
    } catch {
      // expected
    }

    const allLogged = [
      ...errorSpy.mock.calls,
      ...logSpy.mock.calls,
      ...warnSpy.mock.calls,
    ]
      .flat()
      .map(String);

    for (const line of allLogged) {
      expect(line).not.toContain("weak");
    }

    errorSpy.mockRestore();
    logSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
