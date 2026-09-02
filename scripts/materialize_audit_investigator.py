from pathlib import Path

path = Path('server/auth-router.ts')
text = path.read_text()
marker = '\n// ===== AUDIT ROUTER =====\n'
if marker not in text:
    raise SystemExit('legacy audit router marker not found')
text = text.split(marker, 1)[0].rstrip() + '\n'
path.write_text(text)
print('Removed legacy auditRouter from auth-router.ts')
