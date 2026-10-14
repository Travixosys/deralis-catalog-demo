"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getSupplier } from "@/lib/contacts-data";
import { products } from "@/lib/mock-data";
import { MOVEMENT_BADGE_CLASS, MOVEMENT_LABEL, productById } from "@/lib/stock";
import { useInventory } from "@/lib/store/inventory";
import type { MovementType } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { cn, formatDateFR } from "@/lib/utils";

const TYPES = Object.keys(MOVEMENT_LABEL) as MovementType[];

export function MovementHistory() {
  const hydrated = useHydrated();
  const movements = useInventory((s) => s.movements);
  const [type, setType] = useState<MovementType | "tous">("tous");
  const [productId, setProductId] = useState("tous");

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-lg bg-muted" />;
  }

  const rows = movements.filter(
    (m) => (type === "tous" || m.type === type) && (productId === "tous" || m.productId === productId)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {(["tous", ...TYPES] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                type === t
                  ? "bg-[#92400e] text-white"
                  : "border border-[#e8d5b7] bg-[#fff8f0] text-[#78350f] hover:bg-[#fdf0e0]"
              )}
            >
              {t === "tous" ? "Tous" : MOVEMENT_LABEL[t]}
            </button>
          ))}
        </div>
        <select
          aria-label="Filtrer par produit"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm sm:ml-auto sm:w-64"
        >
          <option value="tous">Tous les produits</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-[#fdf0e0]">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-[#78350f]">Date</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-[#78350f]">Mouvement</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase text-[#78350f]">Qté</th>
              <th className="hidden px-4 py-3 text-center text-[11px] font-medium uppercase text-[#78350f] sm:table-cell">Stock</th>
              <th className="hidden px-4 py-3 text-left text-[11px] font-medium uppercase text-[#78350f] md:table-cell">Détail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const detail = [
                m.reason,
                m.paymentMethod,
                m.supplierId && getSupplier(m.supplierId)?.name,
                m.note,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDateFR(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium leading-tight">{productById[m.productId]?.name}</p>
                    <Badge className={`mt-1 ${MOVEMENT_BADGE_CLASS[m.type]}`}>{MOVEMENT_LABEL[m.type]}</Badge>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-semibold tabular-nums",
                      m.delta < 0 ? "text-red-700" : "text-emerald-700"
                    )}
                  >
                    {m.delta > 0 ? `+${m.delta}` : m.delta}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-center tabular-nums text-muted-foreground sm:table-cell">
                    {m.qtyBefore} → <span className="font-semibold text-foreground">{m.qtyAfter}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{detail}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">Aucun mouvement pour ce filtre.</p>
        )}
      </div>
    </div>
  );
}
