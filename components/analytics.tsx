"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";

/** Vercel Web Analytics, minus visits proxy.ts marked as the owner's (own IPs or "?va=off"). */
export function Analytics() {
  return <VercelAnalytics beforeSend={(event) => (document.cookie.split("; ").includes("va-exclude=1") ? null : event)} />;
}
