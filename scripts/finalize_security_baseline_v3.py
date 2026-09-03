from pathlib import Path

v2 = Path("scripts/finalize_security_baseline_v2.py")
original = Path("scripts/finalize_security_baseline.py")

# First apply the v2 correction to the original script text without executing it.
text = original.read_text()
old_audit = '''s = replace_once(
    s,
    '      errorMsg = error?.message || "unknown_error";',
    '      errorMsg = typeof error?.code === "string" ? error.code : (error?.name || "procedure_error");',
    "safe audit error",
)
path.write_text(s)
'''
new_audit = '''path.write_text(s)

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
if text.count(old_audit) != 1:
    raise SystemExit(f"audit correction anchor mismatch: {text.count(old_audit)}")
text = text.replace(old_audit, new_audit, 1)

# The same fetch expression exists in webhook test and manual retry. The first
# occurrence is the test path; the remaining occurrence is intentionally handled
# separately below rather than doing a global replacement.
old_ambiguous = '''s = replace_once(s, '        const response = await fetch(endpoint[0].url, {', '        const response = await fetch(validatedUrl, {', "webhook test public target")'''
new_first = '''if s.count('        const response = await fetch(endpoint[0].url, {') != 2:
    raise SystemExit(f"expected webhook test + retry fetch paths, found {s.count('        const response = await fetch(endpoint[0].url, {')}")
s = s.replace('        const response = await fetch(endpoint[0].url, {', '        const response = await fetch(validatedUrl, {', 1)'''
if text.count(old_ambiguous) != 1:
    raise SystemExit(f"ambiguous fetch correction anchor mismatch: {text.count(old_ambiguous)}")
text = text.replace(old_ambiguous, new_first, 1)

# Extend the B2B patch with the manual retry path before writing the router.
old_write = '''s = replace_once(
    s,
    '          signal: AbortSignal.timeout(10000), // 10s timeout\\n        });',
    '          signal: AbortSignal.timeout(10000), // 10s timeout\\n          redirect: "error",\\n        });',
    "webhook test redirect denial",
)
path.write_text(s)
'''
new_write = '''s = replace_once(
    s,
    '          signal: AbortSignal.timeout(10000), // 10s timeout\\n        });',
    '          signal: AbortSignal.timeout(10000), // 10s timeout\\n          redirect: "error",\\n        });',
    "webhook test redirect denial",
)
retry_signature_old = '''      // Re-send the webhook
      const payloadStr = logEntry[0].payload;
      const signature = crypto
        .createHmac("sha256", endpoint[0].secret)'''
retry_signature_new = '''      // Re-send the webhook using the decrypted secret only in memory.
      const payloadStr = logEntry[0].payload;
      const signingSecret = revealWebhookSigningSecret(endpoint[0].secret);
      const validatedRetryUrl = await validatePublicWebhookUrl(endpoint[0].url);
      const signature = crypto
        .createHmac("sha256", signingSecret)'''
s = replace_once(s, retry_signature_old, retry_signature_new, "webhook retry secret reveal")
s = replace_once(
    s,
    '        const response = await fetch(endpoint[0].url, {',
    '        const response = await fetch(validatedRetryUrl, {',
    "webhook retry public target",
)
s = replace_once(
    s,
    '          signal: AbortSignal.timeout(10000),\\n        });',
    '          signal: AbortSignal.timeout(10000),\\n          redirect: "error",\\n        });',
    "webhook retry redirect denial",
)
path.write_text(s)
'''
if text.count(old_write) != 1:
    raise SystemExit(f"retry extension anchor mismatch: {text.count(old_write)}")
text = text.replace(old_write, new_write, 1)
original.write_text(text)

# Execute the fully corrected finalizer.
exec(compile(text, str(original), "exec"))
