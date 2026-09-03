from pathlib import Path

path = Path("scripts/finalize_security_baseline.py")
text = path.read_text()

# 1) Move raw-error sanitization to the real capture point: server/_core/trpc.ts.
old = """s = replace_once(
    s,
    '      errorMsg = error?.message || \"unknown_error\";',
    '      errorMsg = typeof error?.code === \"string\" ? error.code : (error?.name || \"procedure_error\");',
    \"safe audit error\",
)
path.write_text(s)
"""
new = """path.write_text(s)

path = Path(\"server/_core/trpc.ts\")
s = path.read_text()
s = replace_once(
    s,
    '      errorMsg = error?.message || \"unknown_error\";',
    '      errorMsg = typeof error?.code === \"string\" ? error.code : (error?.name || \"procedure_error\");',
    \"safe audit error\",
)
path.write_text(s)
"""
if text.count(old) != 1:
    raise SystemExit(f"audit target correction mismatch: {text.count(old)}")
text = text.replace(old, new, 1)

# 2) The fetch expression appears once in webhook test and once in manual retry.
old = "s = replace_once(s, '        const response = await fetch(endpoint[0].url, {', '        const response = await fetch(validatedUrl, {', \"webhook test public target\")"
new = """if s.count('        const response = await fetch(endpoint[0].url, {') != 2:
    raise SystemExit(f\"expected test+retry webhook fetch paths, found {s.count('        const response = await fetch(endpoint[0].url, {')}\")
s = s.replace('        const response = await fetch(endpoint[0].url, {', '        const response = await fetch(validatedUrl, {', 1)"""
if text.count(old) != 1:
    raise SystemExit(f"webhook test fetch correction mismatch: {text.count(old)}")
text = text.replace(old, new, 1)

# 3) Before writing b2b-router.ts, secure the remaining manual retry path.
marker = "path.write_text(s)\n\n# ---- webhook send path: revalidate public HTTPS target immediately before network I/O ----"
insert = """retry_old = '      // Re-send the webhook\\n      const payloadStr = logEntry[0].payload;\\n      const signature = crypto\\n        .createHmac(\"sha256\", endpoint[0].secret)'
retry_new = '      // Re-send the webhook using the decrypted secret only in memory.\\n      const payloadStr = logEntry[0].payload;\\n      const signingSecret = revealWebhookSigningSecret(endpoint[0].secret);\\n      const validatedRetryUrl = await validatePublicWebhookUrl(endpoint[0].url);\\n      const signature = crypto\\n        .createHmac(\"sha256\", signingSecret)'
s = replace_once(s, retry_old, retry_new, \"webhook retry secret reveal\")
s = replace_once(
    s,
    '        const response = await fetch(endpoint[0].url, {',
    '        const response = await fetch(validatedRetryUrl, {',
    \"webhook retry public target\",
)
s = replace_once(
    s,
    '          signal: AbortSignal.timeout(10000),\\n        });',
    '          signal: AbortSignal.timeout(10000),\\n          redirect: \"error\",\\n        });',
    \"webhook retry redirect denial\",
)
path.write_text(s)

# ---- webhook send path: revalidate public HTTPS target immediately before network I/O ----"""
if text.count(marker) != 1:
    raise SystemExit(f"webhook retry insertion mismatch: {text.count(marker)}")
text = text.replace(marker, insert, 1)

path.write_text(text)
exec(compile(text, str(path), "exec"))
