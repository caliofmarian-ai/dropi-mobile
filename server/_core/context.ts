import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Session, User } from "../../drizzle/schema";
import { getRequestSessionToken } from "../request-session";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  // Real request contexts populate both fields. They remain optional so legacy
  // test fixtures and isolated procedure callers do not need synthetic sessions.
  session?: Session | null;
  sessionToken?: string | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  let session: Session | null = null;
  const sessionToken = getRequestSessionToken(opts.req);

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  if (user && sessionToken) {
    try {
      const persisted = await sdk.getPersistedSessionForToken(sessionToken);
      if (persisted && new Date(persisted.expiresAt).getTime() > Date.now()) {
        session = persisted;
      }
    } catch (error) {
      // Session attribution must not turn a public request into a transport error.
      session = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    session,
    sessionToken,
  };
}
