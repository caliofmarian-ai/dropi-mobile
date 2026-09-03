import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { sanitizeHttpUrl } from "../shared/security-baseline-policy";

export type ResolvedAddress = { address: string; family: number };
export type AddressResolver = (hostname: string) => Promise<ResolvedAddress[]>;

function ipv4Octets(address: string): number[] | null {
  if (isIP(address) !== 4) return null;
  return address.split(".").map(Number);
}

export function isPrivateOrSpecialIp(address: string): boolean {
  const v4 = ipv4Octets(address);
  if (v4) {
    const [a, b, c] = v4;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    );
  }

  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
    if (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("ff")) return true;
    if (lower.startsWith("2001:db8:")) return true;
    if (lower.startsWith("::ffff:")) {
      const mapped = lower.slice("::ffff:".length);
      return isPrivateOrSpecialIp(mapped);
    }
  }
  return false;
}

async function defaultResolver(hostname: string): Promise<ResolvedAddress[]> {
  return lookup(hostname, { all: true, verbatim: true });
}

export async function validatePublicWebhookUrl(value: string, resolver: AddressResolver = defaultResolver): Promise<string> {
  const normalized = sanitizeHttpUrl(value);
  const parsed = new URL(normalized);
  if (parsed.protocol !== "https:") {
    throw new Error("Webhook endpoints must use HTTPS.");
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Webhook URL cannot target localhost or local network names.");
  }

  const literalFamily = isIP(hostname);
  const addresses = literalFamily ? [{ address: hostname, family: literalFamily }] : await resolver(hostname);
  if (addresses.length === 0) throw new Error("Webhook hostname did not resolve to a public address.");
  if (addresses.some(({ address }) => isPrivateOrSpecialIp(address))) {
    throw new Error("Webhook URL resolves to a private, loopback, link-local, documentation, multicast, or reserved address.");
  }
  return parsed.toString();
}
