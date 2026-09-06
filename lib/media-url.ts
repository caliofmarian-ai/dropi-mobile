import { getApiBaseUrl } from "@/constants/oauth";

/**
 * DROPi persists server-owned media as same-origin API paths. Native React
 * Native images need an absolute URL, while legacy absolute URLs must remain
 * untouched for backward compatibility.
 */
export function resolveDropiMediaUrl(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed) || /^file:/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    const base = getApiBaseUrl().replace(/\/+$/, "");
    return base ? `${base}${trimmed}` : trimmed;
  }
  return trimmed;
}
