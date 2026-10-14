"use client";

import Link from "next/link";
import { ShoppingCart, Store } from "lucide-react";
import { useStore } from "@/lib/store/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { useEffect, useState } from "react";

export function Header() {
  const items = useStore((s) => s.items);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const [bounce, setBounce] = useState(false);
  const [prevCount, setPrevCount] = useState(itemCount);
  const mounted = useHydrated();

  // Start the bounce when the count changes (adjusting state during render).
  if (itemCount !== prevCount) {
    setPrevCount(itemCount);
    if (itemCount > 0) setBounce(true);
  }

  useEffect(() => {
    if (!bounce) return;
    const timer = setTimeout(() => setBounce(false), 500);
    return () => clearTimeout(timer);
  }, [bounce]);

  return (
    <header className="sticky top-0 z-50 bg-[#1a1a1a]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Store className="h-6 w-6 text-white" />
          <span className="text-lg font-bold tracking-tight text-white">
            Marché Diaspora
          </span>
        </Link>

        <Link
          href="/cart"
          className={`relative flex items-center gap-1 rounded-full p-2 text-white transition-colors hover:bg-white/10 ${
            bounce ? "animate-cart-bounce" : ""
          }`}
        >
          <ShoppingCart className="h-5 w-5" />
          {mounted && itemCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#92400e] px-1.5 text-xs font-semibold text-white">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
      <div className="h-[2px] bg-gradient-to-r from-[#92400e] via-[#d97706] to-[#92400e]" />
    </header>
  );
}
