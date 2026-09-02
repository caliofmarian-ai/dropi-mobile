from pathlib import Path

path = Path("server/auth-router.ts")
text = path.read_text()
old_import = 'import { router, publicProcedure, protectedProcedure, adminProcedure } from "./_core/trpc";'
new_import = 'import { router, publicProcedure, protectedProcedure, adminProcedure, phantomProcedure } from "./_core/trpc";'
if text.count(old_import) != 1:
    raise SystemExit(f"expected one tRPC import, found {text.count(old_import)}")
text = text.replace(old_import, new_import, 1)
old_exit = "  exitPhantom: protectedProcedure.mutation(async ({ ctx }) => {"
new_exit = "  exitPhantom: phantomProcedure.mutation(async ({ ctx }) => {"
if text.count(old_exit) != 1:
    raise SystemExit(f"expected one phantom exit procedure, found {text.count(old_exit)}")
text = text.replace(old_exit, new_exit, 1)
path.write_text(text)

path = Path("tests/c1-audit-separation-contract.test.ts")
text = path.read_text()
old = '''  assert.match(auth, /exitPhantom:\\s*protectedProcedure/);'''
new = '''  assert.match(auth, /exitPhantom:\\s*phantomProcedure/);\n  assert.match(source("server/_core/trpc.ts"), /phantomProcedure = t\\.procedure\\.use\\(requireUser\\)\\.use\\(auditAdminLog\\)/);'''
if text.count(old) != 1:
    raise SystemExit(f"expected one exitPhantom assertion, found {text.count(old)}")
path.write_text(text.replace(old, new, 1))

print("phantom ADMIN audit correction materialized")
