"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StockStatusBadge } from "@/components/admin/stock-badges";
import { announceCrossings } from "@/components/admin/stock-toast";
import { PACKAGING } from "@/lib/contacts-data";
import { getStockStatus, productById } from "@/lib/stock";
import { useInventory, type AdjustResult } from "@/lib/store/inventory";
import type { AdjustReason } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface InventoryTarget {
  productId: string;
  countedPreset?: number;
  reasonPreset?: AdjustReason;
}

const REASONS: AdjustReason[] = ["Casse", "Péremption", "Écart d'inventaire"];

export function InventorySheet({
  target,
  onClose,
}: {
  target: InventoryTarget | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!target} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {target && (
          <InventoryForm
            key={`${target.productId}-${target.countedPreset ?? ""}`}
            target={target}
            onClose={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function InventoryForm({ target, onClose }: { target: InventoryTarget; onClose: () => void }) {
  const level = useInventory((s) => s.levels[target.productId]);
  const adjust = useInventory((s) => s.adjust);
  const product = productById[target.productId];

  const [counted, setCounted] = useState<number>(target.countedPreset ?? level?.qty ?? 0);
  const [reason, setReason] = useState<AdjustReason>(target.reasonPreset ?? "Écart d'inventaire");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<AdjustResult | null>(null);

  if (!level || !product) return null;

  if (result?.ok) {
    return (
      <div className="space-y-5">
        <SheetHeader className="pr-6 text-left">
          <SheetTitle className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="h-5 w-5" /> Inventaire enregistré
          </SheetTitle>
          <SheetDescription>{product.name}</SheetDescription>
        </SheetHeader>
        <div className="rounded-lg border border-border p-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
            <div>
              <p className="text-[11px] uppercase text-muted-foreground">Avant</p>
              <p className="text-2xl font-bold tabular-nums">{result.before}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-[11px] uppercase text-muted-foreground">Maintenant</p>
              <p className="text-2xl font-bold tabular-nums">{result.after}</p>
            </div>
          </div>
          <p className="mt-3 text-center text-sm">
            Écart : <span className="font-semibold">{result.delta > 0 ? `+${result.delta}` : result.delta}</span> · {reason}
          </p>
          <div className="mt-3 flex justify-center">
            <StockStatusBadge status={getStockStatus(level)} />
          </div>
        </div>
        <Button className="w-full bg-[#92400e] text-white hover:bg-[#78350f]" onClick={onClose}>
          Terminer
        </Button>
      </div>
    );
  }

  const gap = counted - level.qty;

  function handleValidate() {
    const statusBefore = getStockStatus(level);
    const res = adjust(target.productId, counted, reason, note);
    setResult(res);
    if (res.ok) {
      const statusAfter = getStockStatus({ ...level!, qty: res.after });
      if (statusAfter !== statusBefore && statusAfter !== "In Stock") {
        announceCrossings(
          [{ productId: target.productId, status: statusAfter, qtyAfter: res.after }],
          () => product!.name
        );
      }
    }
  }

  return (
    <div className="space-y-5">
      <SheetHeader className="pr-6 text-left">
        <SheetTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" /> Inventaire / retrait du stock
        </SheetTitle>
        <SheetDescription>{product.name}</SheetDescription>
      </SheetHeader>

      {PACKAGING[product.id] && (
        <p className="rounded-md bg-[#fff8f0] px-3 py-2 text-xs text-[#78350f]">
          Conditionnement : {PACKAGING[product.id]} — comptez à l&apos;unité.
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-border p-3">
          <p className="text-[11px] uppercase text-muted-foreground">Théorique</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{level.qty}</p>
        </div>
        <div className="rounded-lg border border-[#92400e] p-3">
          <label htmlFor="counted" className="text-[11px] uppercase text-muted-foreground">
            Compté
          </label>
          <Input
            id="counted"
            type="number"
            inputMode="numeric"
            min={0}
            value={counted}
            onChange={(e) => setCounted(Math.max(0, Number(e.target.value) || 0))}
            className="mt-1 h-9 border-0 p-0 text-center text-2xl font-bold tabular-nums shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-[11px] uppercase text-muted-foreground">Écart</p>
          <p
            className={cn(
              "mt-1 text-2xl font-bold tabular-nums",
              gap < 0 ? "text-red-700" : gap > 0 ? "text-emerald-700" : ""
            )}
          >
            {gap > 0 ? `+${gap}` : gap}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Motif</p>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                reason === r
                  ? "border-[#92400e] bg-[#92400e] text-white"
                  : "border-[#e8d5b7] bg-white hover:bg-[#fff8f0]"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="adjust-note" className="block text-sm font-medium">
          Note (facultatif)
        </label>
        <Input
          id="adjust-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex. : 3 bouteilles endommagées"
        />
      </div>

      {result && !result.ok && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">{result.error}</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button
          className="flex-1 bg-[#92400e] text-white hover:bg-[#78350f]"
          disabled={gap === 0}
          onClick={handleValidate}
        >
          {gap < 0 ? `Retirer ${-gap} du stock` : gap > 0 ? `Ajouter ${gap} au stock` : "Aucun écart"}
        </Button>
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
