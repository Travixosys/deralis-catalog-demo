"use client";

import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store/cart";
import type { Product } from "@/lib/types";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function stockBadgeClass(status: Product["stockStatus"]): string {
  switch (status) {
    case "In Stock":
      return "border-transparent bg-emerald-100 text-emerald-800";
    case "Low Stock":
      return "border-transparent bg-amber-100 text-amber-800";
    case "Out of Stock":
      return "border-transparent bg-red-100 text-red-800";
  }
}

export function ProductCard({ product }: { product: Product }) {
  const addItem = useStore((s) => s.addItem);
  const isOutOfStock = product.stockStatus === "Out of Stock";

  return (
    <div className="flex flex-col overflow-hidden rounded-[6px] border border-[#e8d5b7] bg-white shadow-sm transition-all hover:shadow-md hover:border-[#92400e]">
      {/* Placeholder image */}
      <div
        className="flex h-40 items-center justify-center rounded-[4px] mx-[1px] mt-[1px]"
        style={{ backgroundColor: product.placeholderColor }}
      >
        <span className="text-2xl font-bold text-white/90">
          {getInitials(product.name)}
        </span>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold leading-tight">{product.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {product.unit}
          </p>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">
            €{product.price.toFixed(2)}
          </span>
          <Badge className={stockBadgeClass(product.stockStatus)}>
            {product.stockStatus}
          </Badge>
        </div>

        <Button
          className="mt-auto w-full rounded-[4px] bg-[#92400e] text-white hover:bg-[#78350f] disabled:bg-[#d6d3d1] disabled:text-[#a8a29e]"
          size="sm"
          disabled={isOutOfStock}
          onClick={() => addItem(product)}
        >
          <ShoppingCart className="h-4 w-4" />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
