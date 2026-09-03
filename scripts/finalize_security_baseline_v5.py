from pathlib import Path

# Apply the complete audited v4 patch first.
v4 = Path("scripts/finalize_security_baseline_v4.py")
exec(compile(v4.read_text(), str(v4), "exec"))

# Then eliminate the remaining raw-SQL list interpolation from the B2B log filter.
path = Path("server/b2b-router.ts")
s = path.read_text()
old_import = 'import { eq, and, desc, sql, like } from "drizzle-orm";'
new_import = 'import { eq, and, desc, sql, like, inArray } from "drizzle-orm";'
if s.count(old_import) != 1:
    raise SystemExit(f"drizzle import anchor mismatch: {s.count(old_import)}")
s = s.replace(old_import, new_import, 1)
old = '        : [sql`${webhookLogs.webhookEndpointId} IN (${sql.raw(endpointIds.join(","))})`];'
new = '        : [inArray(webhookLogs.webhookEndpointId, endpointIds)];'
if s.count(old) != 1:
    raise SystemExit(f"webhook log raw-SQL anchor mismatch: {s.count(old)}")
s = s.replace(old, new, 1)
path.write_text(s)
