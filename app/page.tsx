import { Suspense } from "react";
import { CatalogClient } from "@/components/catalog/catalog-client";
import { ProductGridSkeleton } from "@/components/catalog/product-grid-skeleton";

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Our Catalog</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our selection of authentic African &amp; Caribbean groceries.
        </p>
      </div>
      <Suspense fallback={<ProductGridSkeleton />}>
        <CatalogClient />
      </Suspense>
    </div>
  );
}
