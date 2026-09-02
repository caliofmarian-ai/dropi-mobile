from pathlib import Path

path = Path("app/admin/authority-reports.tsx")
text = path.read_text()
anchor = '        <Text className="text-xs font-semibold text-muted mb-2">TARGET AUTHORITY</Text>'
insert = '''        <Pressable onPress={() => router.push("/admin/incident-reconstruction" as any)} className="bg-surface border border-border rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground">Incident Reconstruction →</Text>
          <Text className="text-xs text-muted mt-1">Open factual per-incident timelines from persisted operational evidence.</Text>
        </Pressable>

''' + anchor
count = text.count(anchor)
if count != 1:
    raise SystemExit(f"authority report navigation anchor count={count}")
path.write_text(text.replace(anchor, insert, 1))
