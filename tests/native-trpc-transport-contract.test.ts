import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("native tRPC transport contract", () => {
  it("uses one direct typed tRPC transport for native queries and mutations", () => {
    const client = source("lib/trpc.ts");

    expect(client).toContain('import { httpLink } from "@trpc/client"');
    expect(client).toContain("httpLink({");
    expect(client).not.toContain("httpBatchLink");
    expect(client).toContain('getRequiredApiBaseUrl("tRPC client")');
    expect(client).toContain("transformer: superjson");
    expect(client).toContain("headers: getTrpcAuthHeaders");
    expect(client).toContain('credentials: "include"');
  });

  it("bounds stalled native requests and preserves caller cancellation", () => {
    const client = source("lib/trpc.ts");

    expect(client).toContain("const TRPC_NETWORK_TIMEOUT_MS = 15_000");
    expect(client).toContain("const controller = new AbortController()");
    expect(client).toContain('upstreamSignal?.addEventListener("abort", abortFromUpstream');
    expect(client).toContain("signal: controller.signal");
    expect(client).toContain("DROPi API request timed out after");
    expect(client).toContain('upstreamSignal?.removeEventListener("abort", abortFromUpstream)');
  });

  it("keeps P2P writes on canonical tRPC instead of adding an auth bypass", () => {
    const p2p = source("app/p2p.tsx");

    expect(p2p).toContain("trpc.p2p.createCommunityOffer.useMutation()");
    expect(p2p).toContain("trpc.p2p.createPrivateParcel.useMutation()");
    expect(p2p).not.toContain('/api/trpc/p2p.createCommunityOffer');
    expect(p2p).not.toContain('/api/trpc/p2p.createPrivateParcel');
  });
});
