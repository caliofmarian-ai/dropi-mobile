from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"Expected text not found in {path}: {old[:120]!r}")
    p.write_text(text.replace(old, new, 1))


replace_once(
    "components/c1-transactional-dashboards.tsx",
    '''                    {item.status === "accepted" && (\n                      <TouchableOpacity\n                        className="bg-primary rounded-lg py-2 items-center mt-3"\n                        disabled={transitionMarketplaceOrder.isPending}\n                        onPress={() => transitionMarketplaceOrder.mutate({ orderId: item.id, newStatus: "in_execution" })}\n                      >\n                        <Text className="text-white text-sm font-bold">Confirm pickup & start delivery</Text>\n                      </TouchableOpacity>\n                    )}\n                    {(item.status === "in_execution" || item.status === "fallback") && (''',
    '''                    {item.status === "accepted" && (\n                      <TouchableOpacity\n                        className="bg-primary rounded-lg py-2 items-center mt-3"\n                        disabled={transitionMarketplaceOrder.isPending}\n                        onPress={() => transitionMarketplaceOrder.mutate({ orderId: item.id, newStatus: "in_execution" })}\n                      >\n                        <Text className="text-white text-sm font-bold">Confirm pickup & start delivery</Text>\n                      </TouchableOpacity>\n                    )}\n                    {item.status === "in_execution" && (\n                      <TouchableOpacity\n                        className="bg-primary/10 border border-primary rounded-lg py-2 items-center mt-3"\n                        onPress={() => router.push({\n                          pathname: "/pilot/broadcast",\n                          params: {\n                            deliveryId: String(item.id),\n                            target: "order",\n                            vehicleType: (item as any).vehicleType || "auto",\n                          },\n                        } as any)}\n                      >\n                        <Text className="text-primary text-sm font-bold">📡 Broadcast Position</Text>\n                      </TouchableOpacity>\n                    )}\n                    {(item.status === "in_execution" || item.status === "fallback") && (''',
)

# The legacy broadcaster's WebSocket-completion control conflicts with the
# proof-backed completion path. Do not expose it on C1 Marketplace broadcasts.
replace_once(
    "app/pilot/broadcast.tsx",
    '''      {/* Complete Delivery Button — shown only when broadcasting */}\n      {isBroadcasting && (''',
    '''      {/* Legacy B2B completion control is intentionally hidden for C1.\n          Marketplace completion remains proof-backed from Mission Radar. */}\n      {isBroadcasting && target === "b2b" && (''',
)
