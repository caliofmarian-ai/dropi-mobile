from pathlib import Path

patch = Path("scripts/finalize_security_baseline.py")
text = patch.read_text()
old = '''s = replace_once(
    s,
    '      errorMsg = error?.message || "unknown_error";',
    '      errorMsg = typeof error?.code === "string" ? error.code : (error?.name || "procedure_error");',
    "safe audit error",
)
path.write_text(s)
'''
new = '''path.write_text(s)

# Raw exception messages are captured by the tRPC audit wrapper, not audit-middleware.
path = Path("server/_core/trpc.ts")
s = path.read_text()
s = replace_once(
    s,
    '      errorMsg = error?.message || "unknown_error";',
    '      errorMsg = typeof error?.code === "string" ? error.code : (error?.name || "procedure_error");',
    "safe audit error",
)
path.write_text(s)
'''
if text.count(old) != 1:
    raise SystemExit(f"finalizer correction anchor mismatch: {text.count(old)}")
patch.write_text(text.replace(old, new, 1))
exec(compile(patch.read_text(), str(patch), "exec"))
