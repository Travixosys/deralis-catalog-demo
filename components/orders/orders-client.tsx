"use client";

import { useState, useMemo } from "react";
import {
  Clock,
  Package,
  DollarSign,
  AlertTriangle,
  Truck,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store/cart";
import { products } from "@/lib/mock-data";
import type { Order, OrderStatus } from "@/lib/types";
import { OrderDetailSheet } from "./order-detail-sheet";
import Link from "next/link";

const STATUS_COLORS: Record<OrderStatus, string> = {
  Pending:
    "border-transparent bg-yellow-100 text-yellow-800",
  Confirmed:
    "border-transparent bg-blue-100 text-blue-800",
  Packed:
    "border-transparent bg-purple-100 text-purple-800",
  Delivered:
    "border-transparent bg-emerald-100 text-emerald-800",
};

export function OrdersClient() {
  const orders = useStore((s) => s.orders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const kpis = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const oneWeekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const ordersToday = orders.filter(
      (o) => o.createdAt.split("T")[0] === today
    ).length;

    const pendingPickup = orders.filter(
      (o) => o.status === "Pending"
    ).length;

    const revenueThisWeek = orders
      .filter((o) => o.createdAt >= oneWeekAgo)
      .reduce((sum, o) => sum + o.total, 0);

    const lowStockCount = products.filter(
      (p) => p.stockStatus === "Low Stock"
    ).length;

    return { ordersToday, pendingPickup, revenueThisWeek, lowStockCount };
  }, [orders]);

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          label="Orders Today"
          value={String(kpis.ordersToday)}
        />
        <KpiCard
          icon={<Package className="h-5 w-5 text-yellow-600" />}
          label="Pending"
          value={String(kpis.pendingPickup)}
        />
        <KpiCard
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
          label="Revenue (Week)"
          value={`€${kpis.revenueThisWeek.toFixed(2)}`}
        />
        <Link href="/?stock=low">
          <KpiCard
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            label="Low Stock Alerts"
            value={String(kpis.lowStockCount)}
            clickable
          />
        </Link>
      </div>

      {/* Order table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Reference</th>
              <th className="px-4 py-3 text-left font-medium">Customer</th>
              <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">
                Phone
              </th>
              <th className="px-4 py-3 text-center font-medium">Items</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="hidden px-4 py-3 text-center font-medium md:table-cell">
                Type
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="cursor-pointer border-b border-border transition-colors hover:bg-muted/30 last:border-0"
              >
                <td className="px-4 py-3 font-mono text-xs font-medium">
                  <span className="flex items-center gap-2">
                    {order.status === "Pending" && (
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse-dot" />
                    )}
                    {order.reference}
                  </span>
                </td>
                <td className="px-4 py-3">{order.customerName}</td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {order.phone}
                </td>
                <td className="px-4 py-3 text-center">
                  {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  €{order.total.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    className={`status-badge ${STATUS_COLORS[order.status]}`}
                  >
                    {order.status}
                  </Badge>
                </td>
                <td className="hidden px-4 py-3 text-center md:table-cell">
                  {order.deliveryPreference === "Delivery" ? (
                    <Truck className="mx-auto h-4 w-4 text-muted-foreground" />
                  ) : (
                    <MapPin className="mx-auto h-4 w-4 text-muted-foreground" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order detail sheet */}
      <OrderDetailSheet
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  clickable,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  clickable?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 ${
        clickable
          ? "cursor-pointer transition-shadow hover:shadow-md"
          : ""
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
