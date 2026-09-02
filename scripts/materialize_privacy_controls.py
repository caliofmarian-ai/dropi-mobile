from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"missing anchor in {path}: {old[:80]!r}")
    if text.count(old) != 1:
        raise SystemExit(f"anchor not unique in {path}: {old[:80]!r}")
    p.write_text(text.replace(old, new, 1))


replace_once(
    "drizzle/schema.ts",
    '  duration: int("duration"),\n  // Timestamp',
    '  duration: int("duration"),\n  retentionClass: mysqlEnum("retentionClass", ["operational", "security", "financial"]).default("operational").notNull(),\n  // Timestamp',
)

replace_once(
    "drizzle/schema.ts",
    'export type InsertAuditLog = typeof auditLogs.$inferInsert;\n',
    '''export type InsertAuditLog = typeof auditLogs.$inferInsert;\n\n/**\n * Privacy consent ledger — immutable grants/withdrawals for purposes whose\n * lawful basis is actually consent. Required processing never writes here.\n */\nexport const privacyConsents = mysqlTable("privacyConsents", {\n  id: int("id").autoincrement().primaryKey(),\n  userId: int("userId").notNull(),\n  purposeKey: varchar("purposeKey", { length: 100 }).notNull(),\n  purposeVersion: int("purposeVersion").notNull(),\n  granted: boolean("granted").notNull(),\n  source: mysqlEnum("source", ["app", "web", "operator", "system"]).default("app").notNull(),\n  createdAt: timestamp("createdAt").defaultNow().notNull(),\n});\n\nexport type PrivacyConsent = typeof privacyConsents.$inferSelect;\nexport type InsertPrivacyConsent = typeof privacyConsents.$inferInsert;\n\n/**\n * Privacy retention run evidence. Data-rights erasure is deliberately separate\n * and belongs to BATCH-022; this table records only authorized retention runs.\n */\nexport const privacyRetentionRuns = mysqlTable("privacyRetentionRuns", {\n  id: int("id").autoincrement().primaryKey(),\n  startedBy: int("startedBy").notNull(),\n  runMode: mysqlEnum("runMode", ["dry_run", "execute"]).default("execute").notNull(),\n  status: mysqlEnum("status", ["completed", "failed"]).notNull(),\n  eligibleCount: int("eligibleCount").default(0).notNull(),\n  affectedCount: int("affectedCount").default(0).notNull(),\n  details: json("details"),\n  startedAt: timestamp("startedAt").defaultNow().notNull(),\n  completedAt: timestamp("completedAt"),\n});\n\nexport type PrivacyRetentionRun = typeof privacyRetentionRuns.$inferSelect;\nexport type InsertPrivacyRetentionRun = typeof privacyRetentionRuns.$inferInsert;\n''',
)

replace_once(
    "server/db.ts",
    'import { type AuditChannel } from "./audit-policy";\n',
    'import { type AuditChannel } from "./audit-policy";\nimport { classifyAuditRetention } from "../shared/privacy-policy";\n',
)

replace_once(
    "server/db.ts",
    '    await db.insert(auditLogs).values(data);',
    '    await db.insert(auditLogs).values({\n      ...data,\n      retentionClass: data.retentionClass ?? classifyAuditRetention(data.action),\n    });',
)

replace_once(
    "server/routers.ts",
    'import { p2pRouter } from "./p2p-router";\n',
    'import { p2pRouter } from "./p2p-router";\nimport { privacyRouter } from "./privacy-router";\n',
)

replace_once(
    "server/routers.ts",
    '  // Trust & Badge System\n  trust: trustRouter,',
    '  // Privacy purpose, consent and bounded retention controls\n  privacy: privacyRouter,\n\n  // Trust & Badge System\n  trust: trustRouter,',
)

replace_once(
    "app/(tabs)/profile.tsx",
    '''        <View className="bg-surface border border-border rounded-xl overflow-hidden mb-4">\n          <TouchableOpacity className="px-4 py-3.5 border-b border-border flex-row justify-between items-center">\n            <Text className="text-sm text-foreground">Notifications</Text>''',
    '''        <View className="bg-surface border border-border rounded-xl overflow-hidden mb-4">\n          <TouchableOpacity\n            className="px-4 py-3.5 border-b border-border flex-row justify-between items-center"\n            onPress={() => router.push("/privacy" as any)}\n          >\n            <Text className="text-sm text-foreground">Privacy & Data Use</Text>\n            <Text className="text-primary text-xs font-medium">→</Text>\n          </TouchableOpacity>\n          <TouchableOpacity className="px-4 py-3.5 border-b border-border flex-row justify-between items-center">\n            <Text className="text-sm text-foreground">Notifications</Text>''',
)

print("Privacy controls materialized")
