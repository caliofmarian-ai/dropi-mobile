from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"Expected block not found in {path}: {old[:120]!r}")
    p.write_text(text.replace(old, new, 1))

# Enforce target pilot binding on direct state-transition attempts, not only discovery.
replace_once(
    "server/order-management-service.ts",
    '''  const previousStatus = order.status as OrderStatus;
  const authorization = assertOrderTransitionAuthorized(''',
    '''  const previousStatus = order.status as OrderStatus;
  const ownerQaFixture = readOwnerQaMissionMetadata(order.items);
  if (
    ownerQaFixture &&
    input.actor.dropiRole === "delivery_partner" &&
    ownerQaFixture.targetPilotId !== input.actor.id
  ) {
    throw new Error("Owner QA mission is reserved for its governed TEST HUMAN Delivery Partner.");
  }
  const authorization = assertOrderTransitionAuthorized(''',
)

# Use the canonical username registry in owner-facing UI instead of duplicating a string literal.
p = Path("app/admin/phantom-console.tsx")
text = p.read_text()
anchor = '''const TEST_AI_EMAILS = new Set(
  TEST_ROLE_IDENTITIES.map((identity) => identity.aiEmail.trim().toLowerCase()),
);
'''
replacement = anchor + '''const DELIVERY_PARTNER_TEST_USERNAME =
  TEST_ROLE_IDENTITIES.find((identity) => identity.role === "delivery_partner")?.humanUsername || "unavailable";
'''
if anchor not in text:
    raise SystemExit("TEST_AI_EMAILS anchor missing")
text = text.replace(anchor, replacement, 1)
text = text.replace("Direct login username: human.delivery_partner", "Direct login username: {DELIVERY_PARTNER_TEST_USERNAME}", 1)
text = text.replace("Log out and use human.delivery_partner for the physical Android test.", "Log out and use ${DELIVERY_PARTNER_TEST_USERNAME} for the physical Android test.", 1)
p.write_text(text)
