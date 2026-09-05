import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import { getRequiredApiBaseUrl } from "@/constants/oauth";
import { getTrpcAuthHeaders } from "@/lib/_core/trpc-auth";
import type { AppRouter } from "@/server/routers";

const TRPC_NETWORK_TIMEOUT_MS = 15_000;

type NativeFetchInput = Parameters<typeof fetch>[0];
type NativeFetchInit = Parameters<typeof fetch>[1];

async function fetchWithTimeout(url: NativeFetchInput, options?: NativeFetchInit) {
  const controller = new AbortController();
  const upstreamSignal = options?.signal;
  const abortFromUpstream = () => controller.abort();

  if (upstreamSignal?.aborted) {
    controller.abort();
  } else {
    upstreamSignal?.addEventListener("abort", abortFromUpstream, { once: true });
  }

  const timeout = setTimeout(() => controller.abort(), TRPC_NETWORK_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      credentials: "include",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError" && !upstreamSignal?.aborted) {
      throw new Error(`DROPi API request timed out after ${TRPC_NETWORK_TIMEOUT_MS / 1000} seconds.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    upstreamSignal?.removeEventListener("abort", abortFromUpstream);
  }
}

/**
 * tRPC React client for type-safe API calls.
 *
 * Native Android acceptance exposed a transport boundary where the canonical
 * non-batched tRPC Phantom call worked while httpBatchLink-backed mutations
 * surfaced a generic `Network request failed`. Keep one typed tRPC transport,
 * but use the direct httpLink request shape for predictable native POSTs.
 *
 * IMPORTANT (tRPC v11): the transformer belongs on the terminating link.
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Creates the tRPC client with canonical bearer auth and bounded networking.
 * Call this once in the app root layout.
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpLink({
        url: `${getRequiredApiBaseUrl("tRPC client")}/api/trpc`,
        transformer: superjson,
        headers: getTrpcAuthHeaders,
        fetch: fetchWithTimeout,
      }),
    ],
  });
}
