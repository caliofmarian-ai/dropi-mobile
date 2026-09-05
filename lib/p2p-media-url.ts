import { getRequiredApiBaseUrl } from "@/constants/oauth";

export function resolveP2pMediaUrl(value: string): string {
  const trimmed = value.trim();
  if (/^(https?:|data:|file:|content:)/i.test(trimmed)) return trimmed;
  const base = getRequiredApiBaseUrl("P2P listing media").replace(/\/+$/, "");
  return trimmed.startsWith("/") ? `${base}${trimmed}` : `${base}/${trimmed}`;
}

export function p2pMediaSource(value: string, token?: string | null) {
  return {
    uri: resolveP2pMediaUrl(value),
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  };
}
