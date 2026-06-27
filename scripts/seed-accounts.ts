/**
 * DROPi Seed Script — Creates 58 accounts (29 Human + 29 AI Agent pairs)
 * 
 * Run with: npx tsx scripts/seed-accounts.ts
 * 
 * Default password for all accounts: DROPi2026!
 */

import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// All 29 roles with their channel assignments
const SEED_ACCOUNTS = [
  // C1 Marketplace (9 roles)
  { role: "customer", channel: "C1", name: "Maria Santos", email: "customer@dropi.app", zone: "Manila-Central" },
  { role: "merchant", channel: "C1", name: "Juan's Kitchen", email: "merchant@dropi.app", zone: "Manila-Central" },
  { role: "delivery_partner", channel: "C1", name: "Carlos Reyes", email: "pilot@dropi.app", zone: "Manila-Central" },
  { role: "support_agent", channel: "C1", name: "Ana Support", email: "support@dropi.app", zone: "Manila-Central" },
  { role: "analyst", channel: "C1", name: "Rico Analyst", email: "analyst@dropi.app", zone: "Manila-Central" },
  { role: "compliance_officer", channel: "C1", name: "Elena Compliance", email: "compliance@dropi.app", zone: "Manila-Central" },
  { role: "fraud_detection", channel: "C1", name: "Marco Fraud Det.", email: "fraud@dropi.app", zone: "Manila-Central" },
  { role: "performance_monitor", channel: "C1", name: "Lisa Performance", email: "performance@dropi.app", zone: "Manila-Central" },
  { role: "incident_responder", channel: "C1", name: "David Incident", email: "incident@dropi.app", zone: "Manila-Central" },
  // C2 COS (8 roles)
  { role: "operations_manager", channel: "C2", name: "Pedro Operations", email: "ops.manager@dropi.app", zone: "Manila-Central" },
  { role: "logistics_coordinator", channel: "C2", name: "Sofia Logistics", email: "logistics@dropi.app", zone: "Manila-Central" },
  { role: "fleet_manager", channel: "C2", name: "Miguel Fleet", email: "fleet@dropi.app", zone: "Manila-Central" },
  { role: "c2_compliance_officer", channel: "C2", name: "Rosa Compliance", email: "c2.compliance@dropi.app", zone: "Manila-Central" },
  { role: "c2_performance_monitor", channel: "C2", name: "Luis Performance", email: "c2.performance@dropi.app", zone: "Manila-Central" },
  { role: "c2_incident_responder", channel: "C2", name: "Carmen Incident", email: "c2.incident@dropi.app", zone: "Manila-Central" },
  { role: "data_analyst", channel: "C2", name: "Jorge Data", email: "data.analyst@dropi.app", zone: "Manila-Central" },
  { role: "quality_assurance", channel: "C2", name: "Isabel QA", email: "qa@dropi.app", zone: "Manila-Central" },
  // C3 EOC (6 roles)
  { role: "emergency_coordinator", channel: "C3", name: "Rafael Emergency", email: "emergency@dropi.app", zone: "Manila-Central" },
  { role: "dispatch_manager", channel: "C3", name: "Teresa Dispatch", email: "dispatch@dropi.app", zone: "Manila-Central" },
  { role: "resource_allocator", channel: "C3", name: "Antonio Resources", email: "resources@dropi.app", zone: "Manila-Central" },
  { role: "communication_officer", channel: "C3", name: "Patricia Comms", email: "comms@dropi.app", zone: "Manila-Central" },
  { role: "c3_data_analyst", channel: "C3", name: "Fernando Analyst", email: "c3.analyst@dropi.app", zone: "Manila-Central" },
  { role: "incident_commander", channel: "C3", name: "Gen. Santos", email: "commander@dropi.app", zone: "Manila-Central" },
  // ADMIN (6 roles)
  { role: "system_administrator", channel: "ADMIN", name: "Super Admin", email: "dropi.deliveries@gmail.com", zone: null },
  { role: "security_officer", channel: "ADMIN", name: "Security Officer", email: "security@dropi.app", zone: null },
  { role: "audit_manager", channel: "ADMIN", name: "Audit Manager", email: "audit@dropi.app", zone: null },
  { role: "configuration_manager", channel: "ADMIN", name: "Config Manager", email: "config@dropi.app", zone: null },
  { role: "analytics_manager", channel: "ADMIN", name: "Analytics Manager", email: "analytics@dropi.app", zone: null },
  { role: "support_coordinator", channel: "ADMIN", name: "Support Coordinator", email: "support.coord@dropi.app", zone: null },
];

const DEFAULT_PASSWORD = "DROPi2026!";

async function seed() {
  console.log("🌱 Starting DROPi seed...");
  console.log(`📋 Creating ${SEED_ACCOUNTS.length * 2} accounts (${SEED_ACCOUNTS.length} human + ${SEED_ACCOUNTS.length} AI agent pairs)`);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  console.log("🔐 Password hash generated");

  // Generate SQL for all accounts
  const values: string[] = [];

  for (let i = 0; i < SEED_ACCOUNTS.length; i++) {
    const acc = SEED_ACCOUNTS[i];
    const humanOpenId = `dropi-human-${acc.role}-${randomUUID().slice(0, 8)}`;
    const aiOpenId = `dropi-ai-${acc.role}-${randomUUID().slice(0, 8)}`;
    const humanId = (i * 2) + 100; // Start from 100 to avoid conflicts
    const aiId = humanId + 1;

    // Human account
    values.push(
      `('${humanOpenId}', '${acc.name}', '${acc.email}', 'password', ${acc.role === "system_administrator" ? "'admin'" : "'user'"}, '${acc.role}', '${acc.channel}', ${acc.zone ? `'${acc.zone}'` : "NULL"}, 1, '${passwordHash}', 0, 0, NULL, NULL, NULL)`
    );

    // AI Agent account
    const aiName = `AI ${acc.name}`;
    const aiEmail = `ai.${acc.email}`;
    values.push(
      `('${aiOpenId}', '${aiName}', '${aiEmail}', 'password', ${acc.role === "system_administrator" ? "'admin'" : "'user'"}, '${acc.role}', '${acc.channel}', ${acc.zone ? `'${acc.zone}'` : "NULL"}, 1, '${passwordHash}', 1, 0, 'autonomous', NULL, NULL)`
    );
  }

  const sql = `INSERT INTO users (openId, name, email, loginMethod, role, dropiRole, channel, zone, isActive, passwordHash, isAIAgent, failedLoginAttempts, agentMode, humanPairId, lockedUntil) VALUES\n${values.join(",\n")}\nON DUPLICATE KEY UPDATE name = VALUES(name);`;

  // Output the SQL
  console.log("\n📝 Generated SQL:\n");
  console.log(sql);
  console.log("\n✅ Copy the SQL above and execute it against the database.");
  console.log(`\n📊 Summary:`);
  console.log(`   - 29 Human accounts (email: <role>@dropi.app)`);
  console.log(`   - 29 AI Agent accounts (email: ai.<role>@dropi.app)`);
  console.log(`   - Default password: ${DEFAULT_PASSWORD}`);
  console.log(`   - Admin account: admin@dropi.app`);
}

seed().catch(console.error);
