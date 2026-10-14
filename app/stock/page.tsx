import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { StockClient } from "@/components/stock/stock-client";

export default function StockPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminNav />
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Gestion du stock</h1>
        <p className="mt-2 text-muted-foreground">
          Ce qui manque, qui contacter, et ce qui vient d&apos;arriver — en un coup d&apos;œil.
        </p>
      </div>
      <Suspense>
        <StockClient />
      </Suspense>
    </div>
  );
}
