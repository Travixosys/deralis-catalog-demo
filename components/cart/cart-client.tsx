"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store/cart";
import type { DeliveryPreference } from "@/lib/types";
import { OrderSuccess } from "./order-success";
import Link from "next/link";

export function CartClient() {
  const items = useStore((s) => s.items);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeItem = useStore((s) => s.removeItem);
  const clearCart = useStore((s) => s.clearCart);
  const addOrder = useStore((s) => s.addOrder);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryPreference, setDeliveryPreference] =
    useState<DeliveryPreference>("Pickup");
  const [address, setAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [orderReference, setOrderReference] = useState<string | null>(null);

  const subtotal = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );

  if (orderReference) {
    return <OrderSuccess reference={orderReference} />;
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Your cart is empty</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add some products from the catalog to get started.
        </p>
        <Link href="/">
          <Button className="mt-6">Browse Catalog</Button>
        </Link>
      </div>
    );
  }

  function handlePlaceOrder() {
    if (!customerName.trim() || !phone.trim()) return;
    if (deliveryPreference === "Delivery" && !address.trim()) return;

    const order = addOrder({
      customerName: customerName.trim(),
      phone: phone.trim(),
      deliveryPreference,
      address: deliveryPreference === "Delivery" ? address.trim() : undefined,
      items: items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        price: i.product.price,
        unit: i.product.unit,
        quantity: i.quantity,
      })),
      specialInstructions: specialInstructions.trim() || undefined,
    });

    clearCart();
    setOrderReference(order.reference);
  }

  const canSubmit =
    customerName.trim() &&
    phone.trim() &&
    (deliveryPreference === "Pickup" || address.trim());

  return (
    <div className="space-y-8">
      {/* Line items */}
      <div className="divide-y divide-border rounded-lg border border-border">
        {items.map((item) => (
          <div
            key={item.product.id}
            className="flex items-center gap-4 p-4"
          >
            {/* Color placeholder */}
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white/90"
              style={{ backgroundColor: item.product.placeholderColor }}
            >
              {item.product.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.product.name}</p>
              <p className="text-sm text-muted-foreground">
                €{item.product.price.toFixed(2)} {item.product.unit}
              </p>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  updateQuantity(item.product.id, item.quantity - 1)
                }
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  updateQuantity(item.product.id, item.quantity + 1)
                }
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Line total + remove */}
            <div className="flex items-center gap-3">
              <span className="w-16 text-right text-sm font-semibold">
                €{(item.product.price * item.quantity).toFixed(2)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.product.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Subtotal */}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
        <span className="font-medium">Subtotal</span>
        <span className="text-xl font-bold">€{subtotal.toFixed(2)}</span>
      </div>

      {/* Special instructions */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Special Instructions (optional)
        </label>
        <textarea
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="Any notes about your order..."
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          rows={3}
        />
      </div>

      {/* Customer form */}
      <div className="space-y-4 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">Your Details</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">Name *</label>
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Phone *</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Delivery Preference *
          </label>
          <div className="flex gap-2">
            {(["Pickup", "Delivery"] as const).map((pref) => (
              <button
                key={pref}
                onClick={() => setDeliveryPreference(pref)}
                className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  deliveryPreference === pref
                    ? "border-[#92400e] bg-[#92400e] text-white"
                    : "border-[#e8d5b7] bg-white hover:bg-[#fff8f0]"
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        {deliveryPreference === "Delivery" && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Delivery Address *
            </label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your delivery address"
            />
          </div>
        )}
      </div>

      {/* Place order */}
      <Button
        className="w-full rounded-[4px] bg-[#92400e] text-white hover:bg-[#78350f]"
        size="lg"
        disabled={!canSubmit}
        onClick={handlePlaceOrder}
      >
        Place Order
      </Button>
    </div>
  );
}
