import { Suspense } from "react";
import { CatalogClient } from "@/components/catalog/catalog-client";
import { ProductGridSkeleton } from "@/components/catalog/product-grid-skeleton";

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-balance">
          The flavors of home, delivered.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Authentic African &amp; Caribbean groceries — the staples, spices, and
          hard-to-find brands you grew up with, in stock and ready to ship.
        </p>
      </div>
      <Suspense fallback={<ProductGridSkeleton />}>
        <CatalogClient />
      </Suspense>
    </div>
  );
}
