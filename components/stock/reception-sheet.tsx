"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Package,
  Store,
  Truck,
} from "lucide-react";
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
import { StockStatusBadge } from "@/components/admin/stock-badges";
import { useStockToast } from "@/components/admin/stock-toast";
import {
  PACKAGING,
  getDriver,
  getSupplier,
  productIdsForSupplier,
  suppliers,
} from "@/lib/contacts-data";
import {
  DELIVERY_BADGE_CLASS,
  DELIVERY_STATUS_LABEL,
  productById,
  units,
} from "@/lib/stock";
import { useInventory, type ReceptionResult } from "@/lib/store/inventory";
import type { ExpectedDelivery } from "@/lib/types";

export type ReceptionTarget =
  | { kind: "delivery"; deliveryId: string }
  | { kind: "manual" };

export function ReceptionSheet({
  target,
  onClose,
}: {
  target: ReceptionTarget | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!target} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {target?.kind === "delivery" && (
          <DeliveryReception key={target.deliveryId} deliveryId={target.deliveryId} onClose={onClose} />
        )}
        {target?.kind === "manual" && <ManualReception onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

// ── Reception of an expected delivery ──

function DeliveryReception({
  deliveryId,
  onClose,
}: {
  deliveryId: string;
  onClose: () => void;
}) {
  const delivery = useInventory((s) => s.deliveries.find((d) => d.id === deliveryId));
  const levels = useInventory((s) => s.levels);
  const validateReception = useInventory((s) => s.validateReception);
  const reportIssue = useInventory((s) => s.reportIssue);
  const pushToast = useStockToast((s) => s.push);

  const [rows, setRows] = useState(() =>
    (delivery?.lines ?? []).map((l) => {
      const received = l.receivedPreset ?? l.expected;
      return { productId: l.productId, expected: l.expected, received, accepted: received };
    })
  );
  const [issueOpen, setIssueOpen] = useState(false);
  const [issue, setIssue] = useState(delivery?.issueNote ?? "");
  const [result, setResult] = useState<ReceptionResult | null>(null);

  if (!delivery) return null;

  const supplier = getSupplier(delivery.supplierId);
  const driver = getDriver(delivery.driverId);

  if (result?.ok) {
    return <ReceptionSuccess result={result} reference={delivery.reference} onClose={onClose} />;
  }

  const header = (
    <SheetHeader className="pr-6 text-left">
      <SheetTitle>Réception fournisseur</SheetTitle>
      <SheetDescription>
        Vérifiez ce qui a été livré. Seules les quantités acceptées entrent en stock.
      </SheetDescription>
      <div className="mt-2 space-y-1.5 rounded-lg border border-border bg-[#fff8f0] p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">{supplier?.name}</span>
          <Badge className={DELIVERY_BADGE_CLASS[delivery.status]}>
            {DELIVERY_STATUS_LABEL[delivery.status]}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Bon de livraison : <span className="font-mono text-foreground">{delivery.reference}</span>
        </p>
        {driver && (
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <Truck className="h-3.5 w-3.5" /> {driver.name} · {driver.phone}
          </p>
        )}
      </div>
    </SheetHeader>
  );

  if (delivery.status === "receptionnee") {
    return (
      <div className="space-y-5">
        {header}
        <ReceivedSummary delivery={delivery} />
        <p className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
          Cette livraison a déjà été réceptionnée : le stock a été mis à jour une seule fois.
          Réinitialisez le stock pour rejouer le scénario.
        </p>
        <Button variant="outline" className="w-full" onClick={onClose}>
          Fermer
        </Button>
      </div>
    );
  }

  const discrepancies = rows.flatMap((r) => {
    const name = productById[r.productId]?.name ?? r.productId;
    const msgs: string[] = [];
    if (r.received < r.expected) msgs.push(`${name} : ${units(r.expected - r.received)} manquante${r.expected - r.received > 1 ? "s" : ""}.`);
    if (r.received > r.expected) msgs.push(`${name} : ${units(r.received - r.expected)} en trop.`);
    if (r.accepted < r.received) msgs.push(`${name} : ${units(r.received - r.accepted)} refusée${r.received - r.accepted > 1 ? "s" : ""} (abîmée${r.received - r.accepted > 1 ? "s" : ""}).`);
    return msgs;
  });
  const totalAccepted = rows.reduce((s, r) => s + r.accepted, 0);
  const totalExpected = rows.reduce((s, r) => s + r.expected, 0);
  const totalReceived = rows.reduce((s, r) => s + r.received, 0);

  function setReceived(productId: string, value: number) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.productId !== productId) return r;
        const received = Math.max(0, value);
        const followed = r.accepted === r.received;
        return { ...r, received, accepted: followed ? received : Math.min(r.accepted, received) };
      })
    );
  }

  function setAccepted(productId: string, value: number) {
    setRows((prev) =>
      prev.map((r) =>
        r.productId === productId
          ? { ...r, accepted: Math.min(Math.max(0, value), r.received) }
          : r
      )
    );
  }

  function handleValidate() {
    const res = validateReception(
      delivery!.id,
      rows.map(({ productId, received, accepted }) => ({ productId, received, accepted })),
      issueOpen ? issue : undefined
    );
    // The success panel replaces the form, so no toast is needed here.
    setResult(res);
  }

  const disabled = delivery.status !== "a_receptionner";

  return (
    <div className="space-y-5">
      {header}

      {/* Lines: Produit | Attendu | Reçu | Accepté */}
      <div className="rounded-lg border border-border">
        <div className="grid grid-cols-[1fr_3.25rem_4rem_4rem] gap-2 border-b border-border bg-[#fdf0e0] px-3 py-2 text-[11px] font-medium uppercase text-[#78350f]">
          <span>Produit</span>
          <span className="text-right">Attendu</span>
          <span className="text-center">Reçu</span>
          <span className="text-center">Accepté</span>
        </div>
        <div className="divide-y divide-border">
          {rows.map((r) => {
            const product = productById[r.productId];
            const short = r.received < r.expected;
            return (
              <div key={r.productId} className="grid grid-cols-[1fr_3.25rem_4rem_4rem] items-center gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{product?.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    En stock : {levels[r.productId]?.qty ?? 0}
                    {PACKAGING[r.productId] && <> · {PACKAGING[r.productId]}</>}
                  </p>
                </div>
                <span className="text-right text-sm font-semibold tabular-nums">{r.expected}</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  aria-label={`Reçu — ${product?.name}`}
                  value={r.received}
                  disabled={disabled}
                  onChange={(e) => setReceived(r.productId, Number(e.target.value) || 0)}
                  className={`h-9 px-1 text-center tabular-nums ${short ? "border-amber-400 bg-amber-50" : ""}`}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={r.received}
                  aria-label={`Accepté — ${product?.name}`}
                  value={r.accepted}
                  disabled={disabled}
                  onChange={(e) => setAccepted(r.productId, Number(e.target.value) || 0)}
                  className="h-9 px-1 text-center tabular-nums"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Discrepancies */}
      {discrepancies.length > 0 ? (
        <div className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-4 w-4" /> Écart de livraison
          </p>
          {totalReceived < totalExpected && (
            <p className="font-medium">
              {totalExpected} commandés — {totalReceived} reçus — {totalExpected - totalReceived} manquants
            </p>
          )}
          {discrepancies.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4" /> Livraison conforme à la commande.
        </p>
      )}

      {/* Issue note */}
      {issueOpen ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Problème signalé</label>
          <textarea
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            rows={3}
            placeholder="Ex. : 2 sacs déchirés, carton humide…"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              reportIssue(delivery.id, issue);
              pushToast({ tone: "warning", title: "Problème enregistré", description: `Note ajoutée à ${delivery.reference}.` });
            }}
          >
            Enregistrer la note
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setIssueOpen(true)}
          className="text-sm font-medium text-[#92400e] underline-offset-2 hover:underline"
        >
          Signaler un problème
        </button>
      )}

      {result && !result.ok && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">{result.error}</p>
      )}

      <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
        <span className="font-semibold">{units(totalAccepted)}</span> seront ajoutées au stock
        <span className="text-muted-foreground"> (sur {totalExpected} attendues)</span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button
          className="flex-1 bg-[#92400e] text-white hover:bg-[#78350f]"
          disabled={disabled}
          onClick={handleValidate}
        >
          <CheckCircle2 className="h-4 w-4" />
          Valider la réception
        </Button>
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

function ReceivedSummary({ delivery }: { delivery: ExpectedDelivery }) {
  return (
    <div className="space-y-2">
      {delivery.incomplete && (
        <Badge className="border-transparent bg-red-100 text-red-800">Livraison incomplète</Badge>
      )}
      <div className="divide-y divide-border rounded-lg border border-border text-sm">
        {delivery.lines.map((l) => (
          <div key={l.productId} className="flex items-center justify-between gap-2 px-3 py-2">
            <span>{productById[l.productId]?.name}</span>
            <span className="whitespace-nowrap tabular-nums text-muted-foreground">
              {l.accepted ?? 0} / {l.expected}
            </span>
          </div>
        ))}
      </div>
      {delivery.issueNote && (
        <p className="text-sm text-muted-foreground">Note : {delivery.issueNote}</p>
      )}
    </div>
  );
}

// ── Success panel: the before/after moment ──

function ReceptionSuccess({
  result,
  reference,
  onClose,
}: {
  result: Extract<ReceptionResult, { ok: true }>;
  reference: string;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5">
      <SheetHeader className="pr-6 text-left">
        <SheetTitle className="flex items-center gap-2 text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />
          Réception validée
        </SheetTitle>
        <SheetDescription>{reference}</SheetDescription>
      </SheetHeader>

      <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">
        <p className="text-lg font-bold">
          Réception enregistrée — {units(result.totalAdded)} ajoutée{result.totalAdded > 1 ? "s" : ""} au stock.
        </p>
      </div>

      <div className="space-y-3">
        {result.items.map((item) => {
          const product = productById[item.productId];
          const backInShop = item.statusBefore === "Out of Stock" && item.statusAfter !== "Out of Stock";
          const alertCleared = item.statusBefore !== "In Stock" && item.statusAfter === "In Stock";
          return (
            <div key={item.productId} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold leading-tight">{product?.name}</p>
                <StockStatusBadge status={item.statusAfter} />
              </div>
              <div className="mt-3 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1 text-center">
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground">Avant</p>
                  <p className="text-lg font-bold tabular-nums">{item.before}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground">Reçu</p>
                  <p className="text-lg font-bold tabular-nums text-emerald-700">+{item.accepted}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground">Maintenant</p>
                  <p className="text-lg font-bold tabular-nums">{item.after}</p>
                </div>
              </div>
              {item.accepted < item.expected && (
                <p className="mt-2 text-xs text-amber-800">
                  {units(item.expected - item.accepted)} non livrée{item.expected - item.accepted > 1 ? "s" : ""} — non ajoutée{item.expected - item.accepted > 1 ? "s" : ""} au stock.
                </p>
              )}
              {backInShop ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-800">
                  <Store className="h-4 w-4" />
                  Le produit est de nouveau disponible dans la boutique.
                </p>
              ) : alertCleared ? (
                <p className="mt-2 text-sm font-medium text-emerald-800">Alerte de stock levée.</p>
              ) : null}
              <Link
                href={`/?q=${encodeURIComponent(product?.name ?? "")}`}
                className="mt-2 inline-block text-xs font-medium text-[#92400e] underline-offset-2 hover:underline"
              >
                Voir dans la boutique →
              </Link>
            </div>
          );
        })}
      </div>

      <Button className="w-full bg-[#92400e] text-white hover:bg-[#78350f]" onClick={onClose}>
        Terminer
      </Button>
    </div>
  );
}

// ── Manual reception (no expected delivery) ──

function ManualReception({ onClose }: { onClose: () => void }) {
  const levels = useInventory((s) => s.levels);
  const receiveManual = useInventory((s) => s.receiveManual);

  const [supplierId, setSupplierId] = useState(suppliers[0].id);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<ReceptionResult | null>(null);

  if (result?.ok) {
    return (
      <ReceptionSuccess
        result={result}
        reference={reference.trim() || "Réception sans bon de commande"}
        onClose={onClose}
      />
    );
  }

  const productIds = productIdsForSupplier(supplierId);

  function handleValidate() {
    const res = receiveManual(
      supplierId,
      Object.entries(quantities).map(([productId, qty]) => ({ productId, qty })),
      reference
    );
    setResult(res);
  }

  return (
    <div className="space-y-5">
      <SheetHeader className="pr-6 text-left">
        <SheetTitle>Réception livraison</SheetTitle>
        <SheetDescription>
          Marchandise arrivée sans livraison planifiée : saisissez ce que vous avez reçu.
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="manual-supplier">Fournisseur</label>
        <select
          id="manual-supplier"
          value={supplierId}
          onChange={(e) => {
            setSupplierId(e.target.value);
            setQuantities({});
          }}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="manual-ref">Référence du bon de livraison (facultatif)</label>
        <Input id="manual-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="BL-…" />
      </div>

      <div className="divide-y divide-border rounded-lg border border-border">
        {productIds.map((id) => (
          <div key={id} className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">{productById[id]?.name}</p>
              <p className="text-xs text-muted-foreground">En stock : {levels[id]?.qty ?? 0}</p>
            </div>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              aria-label={`Reçu — ${productById[id]?.name}`}
              value={quantities[id] ?? 0}
              onChange={(e) =>
                setQuantities((q) => ({ ...q, [id]: Math.max(0, Number(e.target.value) || 0) }))
              }
              className="h-9 w-20 text-center tabular-nums"
            />
          </div>
        ))}
      </div>

      {result && !result.ok && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">{result.error}</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button className="flex-1 bg-[#92400e] text-white hover:bg-[#78350f]" onClick={handleValidate}>
          <Package className="h-4 w-4" />
          Valider la réception
        </Button>
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
