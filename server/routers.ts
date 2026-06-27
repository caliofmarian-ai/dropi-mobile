import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { dropiAuthRouter, adminAuthRouter, auditRouter } from "./auth-router";

export const appRouter = router({
  system: systemRouter,

  // Legacy Manus OAuth auth (kept for backward compatibility)
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // DROPi-native authentication (email + password)
  dropiAuth: dropiAuthRouter,

  // Admin operations (phantom mode, user management)
  adminAuth: adminAuthRouter,

  // Audit log access
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;
