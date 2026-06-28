import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { dropiAuthRouter, adminAuthRouter, auditRouter } from "./auth-router";
import { verificationRouter, roleApplicationRouter } from "./verification-router";
import { storeRouter, productRouter, reviewRouter } from "./marketplace-router";
import { trustRouter } from "./trust-router";
import { apiKeyRouter, b2bDeliveryRouter, webhookRouter, apiAnalyticsRouter } from "./b2b-router";
import { pilotSelectionRouter } from "./pilot-selection-router";
import { pilotRatingAdminRouter } from "./pilot-rating-admin";

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

  // Delivery Partner document verification
  verification: verificationRouter,

  // Role applications (C2/C3/Admin operational roles)
  roleApplications: roleApplicationRouter,

  // Marketplace — Stores, Products, Reviews
  store: storeRouter,
  product: productRouter,
  review: reviewRouter,

  // Trust & Badge System
  trust: trustRouter,

  // B2B Logistic API — Sprint E
  apiKey: apiKeyRouter,
  b2bDelivery: b2bDeliveryRouter,
  webhook: webhookRouter,
  apiAnalytics: apiAnalyticsRouter,

  // Pilot Selection System (Blueprint §12)
  pilotSelection: pilotSelectionRouter,

  // Pilot Rating Admin — Real-time Recalculation
  pilotRatingAdmin: pilotRatingAdminRouter,
});

export type AppRouter = typeof appRouter;
