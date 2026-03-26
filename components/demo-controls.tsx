"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Settings, Plus, RotateCcw, ArrowLeftRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store/cart";
import { products } from "@/lib/mock-data";

const DEMO_NAMES = [
  "Fatou Diop",
  "Kofi Asante",
  "Adaeze Nwosu",
  "Mamadou Bah",
  "Aisha Kamara",
  "Yemi Oladipo",
  "Grace Mensah",
  "Ibrahim Coulibaly",
];

const DEMO_PHONES = [
  "+33 6 12 34 56 78",
  "+33 6 98 76 54 32",
  "+44 7700 900123",
  "+32 470 12 34 56",
  "+33 6 55 44 33 22",
  "+44 7911 123456",
  "+33 6 77 88 99 00",
  "+32 487 65 43 21",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function DemoControls() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const addOrder = useStore((s) => s.addOrder);
  const resetOrders = useStore((s) => s.resetOrders);

  function simulateOrder() {
    const inStockProducts = products.filter(
      (p) => p.stockStatus !== "Out of Stock"
    );
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = Array.from({ length: itemCount }, () =>
      randomFrom(inStockProducts)
    );

    // Deduplicate and assign random quantities
    const itemMap = new Map<
      string,
      { productId: string; productName: string; price: number; unit: string; quantity: number }
    >();
    for (const p of selectedProducts) {
      const existing = itemMap.get(p.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        itemMap.set(p.id, {
          productId: p.id,
          productName: p.name,
          price: p.price,
          unit: p.unit,
          quantity: Math.floor(Math.random() * 3) + 1,
        });
      }
    }

    addOrder({
      customerName: randomFrom(DEMO_NAMES),
      phone: randomFrom(DEMO_PHONES),
      deliveryPreference: Math.random() > 0.5 ? "Delivery" : "Pickup",
      address:
        Math.random() > 0.5 ? "12 Rue de la Paix, 75002 Paris" : undefined,
      items: Array.from(itemMap.values()),
      specialInstructions:
        Math.random() > 0.7 ? "Please call before delivery" : undefined,
    });
  }

  function switchView() {
    if (pathname === "/orders") {
      router.push("/");
    } else {
      router.push("/orders");
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 w-56 rounded-lg border border-border bg-card p-3 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Demo Controls
            </span>
            <button
              onClick={() => setOpen(false)}
              className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={simulateOrder}
            >
              <Plus className="h-3.5 w-3.5" />
              Simulate New Order
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={resetOrders}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Orders
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={switchView}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Switch View
            </Button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-md transition-transform hover:scale-105"
      >
        <Settings className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
