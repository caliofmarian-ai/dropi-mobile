#!/usr/bin/env python3
from pathlib import Path

path = Path("server/marketplace-router.ts")
text = path.read_text(encoding="utf-8")
old = '''      await db.update(stores).set(updateData).where(eq(stores.id, store.id));
      if (updateData.zone) {
        await db.update(products).set({ zone: updateData.zone }).where(eq(products.storeId, store.id));
      }
      return { success: true };
'''
new = '''      await db.update(stores).set(updateData).where(eq(stores.id, store.id));
      if (updateData.zone && !sameMarketplaceZone(updateData.zone, store.zone)) {
        // Moving a store changes the market in which its listings are visible.
        // Approved listings must be revalidated before becoming public in the new zone.
        await db.update(products)
          .set({ zone: updateData.zone, status: "pending_review", isActive: false })
          .where(and(eq(products.storeId, store.id), eq(products.status, "approved")));
        await db.update(products)
          .set({ zone: updateData.zone })
          .where(and(eq(products.storeId, store.id), or(
            eq(products.status, "draft"),
            eq(products.status, "pending_review"),
            eq(products.status, "rejected"),
            eq(products.status, "suspended"),
          )));
      }
      return { success: true };
'''
if text.count(old) != 1:
    raise SystemExit(f"expected one store-zone update block, found {text.count(old)}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")

contract = Path("tests/marketplace-controls-contract.test.ts")
ctext = contract.read_text(encoding="utf-8")
anchor = '''test("product zone derives from store and merchant form cannot override it", () => {
  assert.match(marketplaceRouter, /const storeZone = normalizeMarketplaceZone\\(store\\.zone\\)/);
  assert.match(marketplaceRouter, /zone: storeZone/);
  assert.doesNotMatch(productNew, /const \\[zone, setZone\\]/);
  assert.doesNotMatch(productNew, /zone: zone\\.trim\\(\\)/);
  assert.match(productNew, /Product listings inherit the store zone and cannot override it/);
});
'''
addition = anchor + '''

test("moving a store to another zone forces approved listings back through review", () => {
  assert.match(marketplaceRouter, /updateData\\.zone && !sameMarketplaceZone\\(updateData\\.zone, store\\.zone\\)/);
  assert.match(marketplaceRouter, /status: "pending_review", isActive: false/);
  assert.match(marketplaceRouter, /eq\\(products\\.status, "approved"\\)/);
});
'''
if ctext.count(anchor) != 1:
    raise SystemExit(f"expected one contract anchor, found {ctext.count(anchor)}")
contract.write_text(ctext.replace(anchor, addition, 1), encoding="utf-8")

print("Marketplace zone-change revalidation hardened.")
