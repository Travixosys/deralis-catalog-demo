"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useInventory } from "@/lib/store/inventory";
import { isAlert } from "@/lib/stock";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/orders", label: "Commandes" },
  { href: "/stock", label: "Stock" },
  { href: "/stock/historique", label: "Historique" },
  { href: "/contacts", label: "Contacts" },
];

export function AdminNav() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const levels = useInventory((s) => s.levels);
  const alertCount = Object.values(levels).filter(isAlert).length;

  return (
    <nav className="scrollbar-hide -mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-[#92400e] text-[#92400e]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {link.label}
            {link.href === "/stock" && hydrated && alertCount > 0 && (
              <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {alertCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
