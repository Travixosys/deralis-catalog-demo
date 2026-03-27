"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { products } from "@/lib/mock-data";
import { CATEGORIES } from "@/lib/types";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";
import { ProductGridSkeleton } from "./product-grid-skeleton";

export function CatalogClient() {
  const searchParams = useSearchParams();
  const stockFilter = searchParams.get("stock");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "All">(
    "All"
  );
  const [showLowStockOnly, setShowLowStockOnly] = useState(
    stockFilter === "low"
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setShowLowStockOnly(stockFilter === "low");
  }, [stockFilter]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        activeCategory === "All" || p.category === activeCategory;
      const matchesSearch = p.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStock = !showLowStockOnly || p.stockStatus === "Low Stock";
      return matchesCategory && matchesSearch && matchesStock;
    });
  }, [search, activeCategory, showLowStockOnly]);

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category filter pills */}
      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
        {(["All", ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setShowLowStockOnly(false);
            }}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeCategory === cat && !showLowStockOnly
                ? "bg-[#92400e] text-white border-transparent"
                : "bg-[#fff8f0] text-[#78350f] border border-[#e8d5b7] hover:bg-[#fdf0e0]"
            )}
          >
            {cat}
          </button>
        ))}
        <button
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            showLowStockOnly
              ? "bg-amber-500 text-white border-transparent"
              : "bg-[#fff8f0] text-[#78350f] border border-[#e8d5b7] hover:bg-[#fdf0e0]"
          )}
        >
          ⚠ Low Stock
        </button>
      </div>

      {/* Product grid */}
      {!mounted ? (
        <ProductGridSkeleton />
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg">No products found.</p>
          <p className="mt-1 text-sm">
            Try adjusting your search or filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
