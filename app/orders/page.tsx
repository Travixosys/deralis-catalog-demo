import { OrdersClient } from "@/components/orders/orders-client";

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Order Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Manage orders, track status, and monitor inventory.
        </p>
      </div>
      <OrdersClient />
    </div>
  );
}
