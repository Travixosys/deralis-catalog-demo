"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store/cart";
import type { Order, OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Packed",
  "Delivered",
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  Pending: "border-transparent bg-yellow-100 text-yellow-800",
  Confirmed: "border-transparent bg-blue-100 text-blue-800",
  Packed: "border-transparent bg-purple-100 text-purple-800",
  Delivered: "border-transparent bg-emerald-100 text-emerald-800",
};

export function OrderDetailSheet({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const updateOrderStatus = useStore((s) => s.updateOrderStatus);
  const orders = useStore((s) => s.orders);

  // Get fresh order data from store (so status updates reflect immediately)
  const freshOrder = order
    ? orders.find((o) => o.id === order.id) ?? order
    : null;

  if (!freshOrder) {
    return (
      <Sheet open={false} onOpenChange={() => onClose()}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Order Details</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-mono">{freshOrder.reference}</SheetTitle>
          <SheetDescription>
            Placed {new Date(freshOrder.createdAt).toLocaleString()}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status selector */}
          <div>
            <label className="mb-2 block text-sm font-medium">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    updateOrderStatus(freshOrder.id, status)
                  }
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all status-badge ${
                    freshOrder.status === status
                      ? STATUS_COLORS[status] +
                        " ring-2 ring-offset-2 ring-current"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Customer info */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Customer
            </h3>
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{freshOrder.customerName}</p>
              <p className="text-muted-foreground">{freshOrder.phone}</p>
              <p className="mt-1">
                <Badge variant="outline" className="text-xs">
                  {freshOrder.deliveryPreference}
                </Badge>
              </p>
              {freshOrder.address && (
                <p className="mt-1 text-muted-foreground">
                  {freshOrder.address}
                </p>
              )}
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Items
            </h3>
            <div className="divide-y divide-border rounded-lg border border-border">
              {freshOrder.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      €{item.price.toFixed(2)} {item.unit} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-medium">
                    €{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <span className="font-medium">Total</span>
            <span className="text-xl font-bold">
              €{freshOrder.total.toFixed(2)}
            </span>
          </div>

          {/* Special instructions */}
          {freshOrder.specialInstructions && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Special Instructions
              </h3>
              <p className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                {freshOrder.specialInstructions}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
