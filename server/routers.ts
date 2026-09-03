import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { dropiAuthRouter, adminAuthRouter } from "./auth-router";
import { auditRouter } from "./audit-router";
import { verificationRouter, roleApplicationRouter } from "./verification-router";
import { storeRouter, productRouter, reviewRouter } from "./marketplace-router";
import { trustRouter } from "./trust-router";
import { apiKeyRouter, b2bDeliveryRouter, webhookRouter, apiAnalyticsRouter } from "./b2b-router";
import { pilotSelectionRouter } from "./pilot-selection-router";
import { pilotRatingAdminRouter } from "./pilot-rating-admin";
import { notificationRouter } from "./notification-router";
import { agentRouter } from "./agent-router";
import { operationsRouter } from "./operations-router";
import { dashboardRouter } from "./dashboard-router";
import { p2pRouter } from "./p2p-router";
import { privacyRouter } from "./privacy-router";
import { authorityReportRouter } from "./authority-report-router";
import { incidentReconstructionRouter } from "./incident-reconstruction-router";

export const appRouter = router({
  system: systemRouter,

  // Legacy Manus OAuth auth (kept for backward compatibility).
  // Logout is authenticated so the central Audit Core captures the write action.
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: protectedProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // DROPi-native authentication (email + password)
  dropiAuth: dropiAuthRouter,

  // Admin operations (phantom mode, user management)
  adminAuth: adminAuthRouter,

  // Audit Core investigator access (Owner/Auditor; channel-scoped and self-auditing)
  audit: auditRouter,

  // Delivery Partner document verification
  verification: verificationRouter,

  // Role applications (C2/C3/Admin operational roles)
  roleApplications: roleApplicationRouter,

  // Channel 1 controlled Marketplace
  store: storeRouter,
  product: productRouter,
  review: reviewRouter,

  // Channel 1 non-commercial P2P capability (separate from merchant stores/orders)
  p2p: p2pRouter,

  // Privacy purpose, consent and bounded retention controls
  privacy: privacyRouter,

  // Audit-backed, channel-scoped evidence packs for authority adaptation
  authorityReports: authorityReportRouter,

  // Per-incident factual reconstruction and authority exports from persisted evidence
  incidentReconstruction: incidentReconstructionRouter,

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

  // Push Notifications — Token registration
  notifications: notificationRouter,

  // AI Agent Orchestrator — task queue, agent states, reports
  agent: agentRouter,

  // Mobile operational data (orders/missions) for dashboard & detail screens
  operations: operationsRouter,

  // Role-facing read models backed only by persisted canonical evidence
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
