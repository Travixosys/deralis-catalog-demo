import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps the owner's own visits out of Vercel Web Analytics.
 * A visit from an IP listed in ANALYTICS_EXCLUDE_IPS (exact IPv4/IPv6, or an IPv6 prefix such as
 * "2a01:db8:1:2::/64") gets a "va-exclude" cookie, and the Analytics component drops its events.
 * "?va=off" excludes this browser by hand (e.g. on mobile data); "?va=on" counts it again.
 */
const EXCLUDE = "va-exclude";
const OPT_IN = "va-optin";
const YEAR = 60 * 60 * 24 * 365;

function expandIPv6(ip: string): string[] | null {
  const clean = ip.split("%")[0].toLowerCase();
  if (!clean.includes(":")) return null;
  const [head, tail] = clean.split("::");
  const h = head ? head.split(":") : [];
  if (clean.includes("::")) {
    const t = tail ? tail.split(":") : [];
    const fill = 8 - h.length - t.length;
    if (fill < 0) return null;
    return [...h, ...Array<string>(fill).fill("0"), ...t].map((g) => g.padStart(4, "0"));
  }
  return h.length === 8 ? h.map((g) => g.padStart(4, "0")) : null;
}

function matches(ip: string, rule: string): boolean {
  if (rule.includes("/")) {
    const [prefix, bits] = rule.split("/");
    const groups = Number(bits) / 16;
    const a = expandIPv6(ip);
    const b = expandIPv6(prefix);
    if (!a || !b || !Number.isInteger(groups)) return false;
    return a.slice(0, groups).join(":") === b.slice(0, groups).join(":");
  }
  return ip.toLowerCase() === rule.toLowerCase();
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const toggle = request.nextUrl.searchParams.get("va");

  if (toggle === "off") {
    response.cookies.set(EXCLUDE, "1", { path: "/", maxAge: YEAR, sameSite: "lax" });
    response.cookies.delete(OPT_IN);
    return response;
  }
  if (toggle === "on") {
    response.cookies.delete(EXCLUDE);
    response.cookies.set(OPT_IN, "1", { path: "/", maxAge: YEAR, sameSite: "lax" });
    return response;
  }
  if (request.cookies.has(EXCLUDE) || request.cookies.has(OPT_IN)) return response;

  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const rules = (process.env.ANALYTICS_EXCLUDE_IPS ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  if (ip && rules.some((r) => matches(ip, r))) {
    response.cookies.set(EXCLUDE, "1", { path: "/", maxAge: YEAR, sameSite: "lax" });
  }
  return response;
}

export const config = {
  // Pages only: skip build assets, Vercel internals and static files.
  matcher: ["/((?!_next/static|_next/image|_vercel|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|pdf|txt|xml|json|woff2?)$).*)"],
};
