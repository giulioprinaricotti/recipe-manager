import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

const blocked = new BlockList();
// IPv4: this-network, private, carrier-grade NAT, loopback, link-local
// (cloud metadata lives at 169.254.169.254), multicast and reserved.
blocked.addSubnet("0.0.0.0", 8, "ipv4");
blocked.addSubnet("10.0.0.0", 8, "ipv4");
blocked.addSubnet("100.64.0.0", 10, "ipv4");
blocked.addSubnet("127.0.0.0", 8, "ipv4");
blocked.addSubnet("169.254.0.0", 16, "ipv4");
blocked.addSubnet("172.16.0.0", 12, "ipv4");
blocked.addSubnet("192.168.0.0", 16, "ipv4");
blocked.addSubnet("224.0.0.0", 3, "ipv4");
// IPv6: unspecified, loopback, unique-local, link-local, multicast.
blocked.addAddress("::", "ipv6");
blocked.addAddress("::1", "ipv6");
blocked.addSubnet("fc00::", 7, "ipv6");
blocked.addSubnet("fe80::", 10, "ipv6");
blocked.addSubnet("ff00::", 8, "ipv6");

export class UnsafeUrlError extends Error {
  constructor(message = "This URL cannot be fetched") {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !blocked.check(address, "ipv4");
  if (family === 6) {
    // BlockList matches IPv4-mapped IPv6 (::ffff:10.0.0.1) against the IPv4 rules.
    return !blocked.check(address, "ipv6");
  }
  return false;
}

export type HostResolver = (hostname: string) => Promise<string[]>;

async function resolveHost(hostname: string): Promise<string[]> {
  const records = await lookup(hostname, { all: true });
  return records.map((r) => r.address);
}

/**
 * Rejects anything that is not an http(s) URL pointing at a public address.
 * The check resolves the host itself; the request that follows resolves it
 * again, so a host that changes its answer between the two is not covered.
 */
export async function assertPublicUrl(
  rawUrl: string,
  resolve: HostResolver = resolveHost
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("This is not a valid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError();
  }
  if (url.username || url.password) throw new UnsafeUrlError();

  // URL keeps IPv6 literals in brackets.
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (!hostname) throw new UnsafeUrlError();

  if (isIP(hostname)) {
    if (!isPublicAddress(hostname)) throw new UnsafeUrlError();
    return url;
  }

  let addresses: string[];
  try {
    addresses = await resolve(hostname);
  } catch {
    throw new UnsafeUrlError("This site could not be found");
  }
  if (!addresses.length || !addresses.every(isPublicAddress)) {
    throw new UnsafeUrlError();
  }
  return url;
}

/**
 * fetch() for URLs typed by a user: public hosts only, each redirect hop
 * re-checked, and a deadline on the whole exchange.
 */
export async function safeFetch(
  rawUrl: string,
  init: Omit<RequestInit, "redirect" | "signal"> = {},
  resolve: HostResolver = resolveHost
): Promise<Response> {
  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  let current = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicUrl(current, resolve);
    const response = await fetch(url, { ...init, redirect: "manual", signal });

    const location = response.headers.get("location");
    if (!REDIRECT_STATUSES.has(response.status) || !location) {
      return response;
    }
    current = new URL(location, url).toString();
  }

  throw new UnsafeUrlError("Too many redirects");
}
