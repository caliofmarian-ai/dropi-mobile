export const AUDIT_CHANNELS = ["C1", "C2", "C3", "ADMIN"] as const;

export type AuditChannel = (typeof AUDIT_CHANNELS)[number];

export type AuditSessionLike = {
  isPhantom: boolean;
  phantomAdminId: number | null;
} | null | undefined;

export type AuditAttribution = {
  channel: AuditChannel;
  isPhantomMode: boolean;
  phantomAdminId: number | null;
};

export function isAuditChannel(value: unknown): value is AuditChannel {
  return typeof value === "string" && (AUDIT_CHANNELS as readonly string[]).includes(value);
}

export function requireAuditChannel(value: unknown): AuditChannel {
  if (!isAuditChannel(value)) {
    throw new Error("Audit channel must be one of C1, C2, C3, or ADMIN.");
  }
  return value;
}

export function requirePhantomAdminId(session: AuditSessionLike): number {
  if (!session?.isPhantom) {
    throw new Error("A phantom session is required.");
  }
  const adminId = Number(session.phantomAdminId);
  if (!Number.isSafeInteger(adminId) || adminId <= 0) {
    throw new Error("Phantom session is missing a valid administrator identity.");
  }
  return adminId;
}

export function buildAuditAttribution(channel: unknown, session?: AuditSessionLike): AuditAttribution {
  const resolvedChannel = requireAuditChannel(channel);
  if (!session?.isPhantom) {
    return {
      channel: resolvedChannel,
      isPhantomMode: false,
      phantomAdminId: null,
    };
  }

  return {
    channel: resolvedChannel,
    isPhantomMode: true,
    phantomAdminId: requirePhantomAdminId(session),
  };
}
