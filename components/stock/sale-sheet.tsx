"use client";

import { useState } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { announceCrossings, useStockToast } from "@/components/admin/stock-toast";
import { products } from "@/lib/mock-data";
import { productById } from "@/lib/stock";
import { useInventory } from "@/lib/store/inventory";
import type { PaymentMethod } from "@/lib/types";
import { cn, formatEUR } from "@/lib/utils";

export function SaleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {open && <SaleForm onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function SaleForm({ onClose }: { onClose: () => void }) {
  const levels = useInventory((s) => s.levels);
  const recordSale = useInventory((s) => s.recordSale);
  const pushToast = useStockToast((s) => s.push);

  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<{ productId: string; qty: number }[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>("Carte");
  const [error, setError] = useState<string | null>(null);

  const matches = query.trim()
    ? products
        .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 6)
    : [];

  const total = lines.reduce((s, l) => s + (productById[l.productId]?.price ?? 0) * l.qty, 0);
  const articleCount = lines.reduce((s, l) => s + l.qty, 0);

  function addLine(productId: string) {
    setError(null);
    setLines((prev) =>
      prev.some((l) => l.productId === productId)
        ? prev.map((l) => (l.productId === productId ? { ...l, qty: l.qty + 1 } : l))
        : [...prev, { productId, qty: 1 }]
    );
    setQuery("");
  }

  function setQty(productId: string, qty: number) {
    setError(null);
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, qty } : l))
    );
  }

  function handleSubmit() {
    const res = recordSale(lines, payment);
    if (!res.ok) {
      setError(`Vente refusée, rien n'a été retiré du stock. ${res.error}`);
      return;
    }
    pushToast({
      tone: "success",
      title: "Vente enregistrée",
      description: `${articleCount} article${articleCount > 1 ? "s" : ""} · ${formatEUR(total)} · ${payment}`,
    });
    announceCrossings(res.crossings, (id) => productById[id]?.name ?? id);
    onClose();
  }

  return (
    <div className="space-y-5">
      <SheetHeader className="pr-6 text-left">
        <SheetTitle>Enregistrer une vente</SheetTitle>
        <SheetDescription>
          Chaque article vendu est retiré du stock et de la boutique en ligne.
        </SheetDescription>
      </SheetHeader>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit…"
          className="pl-10"
          autoFocus
        />
        {matches.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-lg">
            {matches.map((p) => {
              const qty = levels[p.id]?.qty ?? 0;
              return (
                <button
                  key={p.id}
                  disabled={qty === 0}
                  onClick={() => addLine(p.id)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#fff8f0] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="truncate">{p.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {qty === 0 ? "Rupture" : `${qty} en stock`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {lines.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Ajoutez les articles passés en caisse.
        </p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {lines.map((l) => {
            const p = productById[l.productId];
            const available = levels[l.productId]?.qty ?? 0;
            const over = l.qty > available;
            return (
              <div key={l.productId} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight">{p?.name}</p>
                  <p className={cn("text-xs", over ? "font-medium text-red-700" : "text-muted-foreground")}>
                    {over ? `Seulement ${available} en stock` : `${formatEUR(p?.price ?? 0)} · ${available} en stock`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Retirer un" onClick={() => setQty(l.productId, l.qty - 1)}>
                    {l.qty === 1 ? <Trash2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  </Button>
                  <span className="w-7 text-center text-sm font-semibold tabular-nums">{l.qty}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Ajouter un" onClick={() => setQty(l.productId, l.qty + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">Paiement</p>
        <div className="flex gap-2">
          {(["Carte", "Espèces"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setPayment(m)}
              className={cn(
                "flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                payment === m
                  ? "border-[#92400e] bg-[#92400e] text-white"
                  : "border-[#e8d5b7] bg-white hover:bg-[#fff8f0]"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
        <span className="font-medium">Total</span>
        <span className="text-xl font-bold">{formatEUR(total)}</span>
      </div>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>
      )}

      <Button
        className="w-full bg-[#92400e] text-white hover:bg-[#78350f]"
        size="lg"
        disabled={lines.length === 0}
        onClick={handleSubmit}
      >
        Valider la vente
      </Button>
    </div>
  );
}
