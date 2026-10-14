"use client";

import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ContactButtons } from "@/components/admin/contact-buttons";
import { RestockBadge, StockStatusBadge } from "@/components/admin/stock-badges";
import { PACKAGING, getSupplierForProduct } from "@/lib/contacts-data";
import {
  MOVEMENT_BADGE_CLASS,
  MOVEMENT_LABEL,
  getStockStatus,
  isRestockPending,
  productById,
} from "@/lib/stock";
import { useInventory } from "@/lib/store/inventory";
import { formatDateFR, formatEUR } from "@/lib/utils";

export function ProductStockSheet({
  productId,
  onClose,
  onInventory,
}: {
  productId: string | null;
  onClose: () => void;
  onInventory: (productId: string) => void;
}) {
  return (
    <Sheet open={!!productId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {productId && (
          <ProductStockDetail key={productId} productId={productId} onInventory={onInventory} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ProductStockDetail({
  productId,
  onInventory,
}: {
  productId: string;
  onInventory: (productId: string) => void;
}) {
  const level = useInventory((s) => s.levels[productId]);
  const deliveries = useInventory((s) => s.deliveries);
  const allMovements = useInventory((s) => s.movements);
  const setReorderLevel = useInventory((s) => s.setReorderLevel);
  const [threshold, setThreshold] = useState(level?.reorderLevel ?? 0);

  const product = productById[productId];
  const supplier = getSupplierForProduct(productId);
  if (!product || !level) return null;

  const movements = allMovements.filter((m) => m.productId === productId).slice(0, 8);
  const status = getStockStatus(level);

  return (
    <div className="space-y-6">
      <SheetHeader className="pr-6 text-left">
        <SheetTitle>{product.name}</SheetTitle>
        <SheetDescription>
          {product.category} · {formatEUR(product.price)} {product.unit}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-wrap items-center gap-2">
        <StockStatusBadge status={status} />
        {isRestockPending(productId, deliveries) && <RestockBadge />}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-[11px] uppercase text-muted-foreground">En stock</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{level.qty}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <label htmlFor="threshold" className="text-[11px] uppercase text-muted-foreground">
            Seuil d&apos;alerte
          </label>
          <div className="mt-1 flex items-center gap-2">
            <Input
              id="threshold"
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(Math.max(0, Number(e.target.value) || 0))}
              className="h-8 w-16 px-1 text-center"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              disabled={threshold === level.reorderLevel}
              onClick={() => setReorderLevel(productId, threshold)}
            >
              OK
            </Button>
          </div>
        </div>
      </div>

      {PACKAGING[productId] && (
        <p className="rounded-md bg-[#fff8f0] px-3 py-2 text-xs text-[#78350f]">
          Conditionnement fournisseur : {PACKAGING[productId]}
        </p>
      )}

      <Button variant="outline" className="w-full gap-2" onClick={() => onInventory(productId)}>
        <ClipboardCheck className="h-4 w-4" />
        Inventaire / retirer du stock (casse, péremption)
      </Button>

      {supplier && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Fournisseur</h3>
          <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
            <p className="font-medium">{supplier.name}</p>
            <p className="text-muted-foreground">
              {supplier.contactName} · {supplier.phone}
            </p>
            <ContactButtons
              phone={supplier.phone}
              whatsapp={supplier.whatsapp}
              email={supplier.email}
              subject={`Commande — ${product.name}`}
              message={`Bonjour ${supplier.contactName}, je souhaiterais commander ${Math.max(level.targetLevel - level.qty, 1)} × ${product.name}. Merci !`}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Derniers mouvements</h3>
        {movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun mouvement.</p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border text-sm">
            {movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <Badge className={MOVEMENT_BADGE_CLASS[m.type]}>{MOVEMENT_LABEL[m.type]}</Badge>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateFR(m.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold tabular-nums ${m.delta < 0 ? "text-red-700" : "text-emerald-700"}`}>
                    {m.delta > 0 ? `+${m.delta}` : m.delta}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {m.qtyBefore} → {m.qtyAfter}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
