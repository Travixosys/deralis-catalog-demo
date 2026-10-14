"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  PackageX,
  Search,
  ShoppingBasket,
  Truck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactButtons } from "@/components/admin/contact-buttons";
import { KpiCard } from "@/components/admin/kpi-card";
import { RestockBadge, StockStatusBadge } from "@/components/admin/stock-badges";
import { products } from "@/lib/mock-data";
import { getDriver, getSupplier, getSupplierForProduct } from "@/lib/contacts-data";
import {
  DELIVERY_BADGE_CLASS,
  DELIVERY_STATUS_LABEL,
  etaLabel,
  getStockStatus,
  isAlert,
  isRestockPending,
  productById,
} from "@/lib/stock";
import { useInventory } from "@/lib/store/inventory";
import { CATEGORIES, type Category, type StockLevel } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { cn, formatEUR } from "@/lib/utils";
import { DemoScenarios } from "./demo-scenarios";
import { InventorySheet, type InventoryTarget } from "./inventory-sheet";
import { ProductStockSheet } from "./product-stock-sheet";
import { ReceptionSheet, type ReceptionTarget } from "./reception-sheet";
import { SaleSheet } from "./sale-sheet";

const sectionTitle = "text-lg font-semibold";

export function StockClient() {
  const hydrated = useHydrated();
  const levels = useInventory((s) => s.levels);
  const movements = useInventory((s) => s.movements);
  const deliveries = useInventory((s) => s.deliveries);
  const markDeliveryArrived = useInventory((s) => s.markDeliveryArrived);

  const [saleOpen, setSaleOpen] = useState(false);
  const [reception, setReception] = useState<ReceptionTarget | null>(null);
  const [inventory, setInventory] = useState<InventoryTarget | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const alerts = useMemo(
    () =>
      products
        .filter((p) => isAlert(levels[p.id]))
        .sort((a, b) => (levels[a.id]?.qty ?? 0) - (levels[b.id]?.qty ?? 0)),
    [levels]
  );

  const kpis = useMemo(() => {
    const today = new Date().toDateString();
    const todaySales = movements.filter(
      (m) =>
        (m.type === "vente" || m.type === "commande_en_ligne") &&
        new Date(m.createdAt).toDateString() === today
    );
    return {
      alertCount: alerts.length,
      outCount: alerts.filter((p) => getStockStatus(levels[p.id]) === "Out of Stock").length,
      retailValue: products.reduce((s, p) => s + p.price * (levels[p.id]?.qty ?? 0), 0),
      salesToday: todaySales.reduce((s, m) => s + -m.delta * (productById[m.productId]?.price ?? 0), 0),
      itemsSoldToday: todaySales.reduce((s, m) => s - m.delta, 0),
    };
  }, [alerts, levels, movements]);

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Primary actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="gap-2 bg-[#92400e] text-white hover:bg-[#78350f]" onClick={() => setSaleOpen(true)}>
          <ShoppingBasket className="h-4 w-4" />
          Enregistrer une vente
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => setReception({ kind: "manual" })}>
          <Truck className="h-4 w-4" />
          Réception livraison
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <a href="#alertes">
          <KpiCard
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            label="Articles en alerte"
            value={String(kpis.alertCount)}
            clickable
          />
        </a>
        <KpiCard
          icon={<PackageX className="h-5 w-5 text-red-600" />}
          label="Ruptures"
          value={String(kpis.outCount)}
          hint="Indisponibles en boutique"
        />
        <KpiCard
          icon={<Coins className="h-5 w-5 text-emerald-600" />}
          label="Valeur du stock au prix de vente"
          value={formatEUR(kpis.retailValue)}
        />
        <KpiCard
          icon={<ShoppingBasket className="h-5 w-5 text-blue-600" />}
          label="Ventes du jour"
          value={formatEUR(kpis.salesToday)}
          hint={`${kpis.itemsSoldToday} article${kpis.itemsSoldToday > 1 ? "s" : ""} · magasin + en ligne`}
        />
      </div>

      {/* 1. Alertes de stock */}
      <section id="alertes" className="scroll-mt-24 space-y-3">
        <h2 className={sectionTitle}>Alertes de stock</h2>
        {alerts.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4" /> Aucune alerte : tous les produits sont au-dessus de leur seuil.
          </p>
        ) : (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              {alerts.length} article{alerts.length > 1 ? "s" : ""} à recommander
              <a href="#a-commander" className="ml-auto text-xs font-medium underline-offset-2 hover:underline">
                Voir qui contacter ↓
              </a>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {alerts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDetailId(p.id)}
                  className="flex items-center gap-2 rounded-md border border-amber-200 bg-white px-2.5 py-1.5 text-left text-sm transition-colors hover:border-[#92400e]"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="tabular-nums text-muted-foreground">{levels[p.id]?.qty}</span>
                  <StockStatusBadge status={getStockStatus(levels[p.id])} />
                  {isRestockPending(p.id, deliveries) && <RestockBadge />}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 2. À commander */}
      <ReorderSection alerts={alerts.map((p) => p.id)} levels={levels} onSelect={setDetailId} deliveries={deliveries} />

      {/* 3. Livraisons attendues */}
      <section className="space-y-3">
        <h2 className={sectionTitle}>Livraisons attendues</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {deliveries.map((d) => {
            const supplier = getSupplier(d.supplierId);
            const driver = getDriver(d.driverId);
            const expectedUnits = d.lines.reduce((s, l) => s + l.expected, 0);
            const acceptedUnits = d.lines.reduce((s, l) => s + (l.accepted ?? 0), 0);
            return (
              <div key={d.id} className="flex flex-col rounded-lg border border-border bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold leading-tight">{supplier?.name}</p>
                  <Badge className={`shrink-0 ${DELIVERY_BADGE_CLASS[d.status]}`}>
                    {DELIVERY_STATUS_LABEL[d.status]}
                  </Badge>
                </div>
                <div className="mt-2 flex-1 space-y-0.5 text-sm text-muted-foreground">
                  <p>
                    Référence : <span className="font-mono text-foreground">{d.reference}</span>
                  </p>
                  {d.status !== "receptionnee" ? (
                    <>
                      <p>Livraison : {etaLabel(d.etaDays)}</p>
                      <p>
                        {d.lines.length} référence{d.lines.length > 1 ? "s" : ""} · {expectedUnits} unités attendues
                      </p>
                    </>
                  ) : (
                    <p>
                      {acceptedUnits} / {expectedUnits} unités entrées en stock
                    </p>
                  )}
                  {driver && d.status !== "receptionnee" && <p>Livreur : {driver.name}</p>}
                </div>
                {d.incomplete && (
                  <Badge className="mt-2 w-fit border-transparent bg-red-100 text-red-800">Livraison incomplète</Badge>
                )}
                {d.issueNote && (
                  <p className="mt-2 text-xs text-amber-800">Problème signalé : {d.issueNote}</p>
                )}
                <div className="mt-3">
                  {d.status === "a_receptionner" && (
                    <Button
                      size="sm"
                      className="w-full bg-[#92400e] text-white hover:bg-[#78350f]"
                      onClick={() => setReception({ kind: "delivery", deliveryId: d.id })}
                    >
                      Réceptionner
                    </Button>
                  )}
                  {d.status === "en_preparation" && (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => markDeliveryArrived(d.id)}>
                      Marquer comme arrivée
                    </Button>
                  )}
                  {d.status === "receptionnee" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setReception({ kind: "delivery", deliveryId: d.id })}
                    >
                      Voir le détail
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Tableau des stocks */}
      <StockTable levels={levels} deliveries={deliveries} onSelect={setDetailId} />

      {/* 5. Scénarios */}
      <DemoScenarios
        onOpenReception={(deliveryId) => setReception({ kind: "delivery", deliveryId })}
        onOpenInventory={setInventory}
      />

      <SaleSheet open={saleOpen} onClose={() => setSaleOpen(false)} />
      <ReceptionSheet target={reception} onClose={() => setReception(null)} />
      <ProductStockSheet
        productId={detailId}
        onClose={() => setDetailId(null)}
        onInventory={(productId) => {
          setDetailId(null);
          setInventory({ productId });
        }}
      />
      <InventorySheet target={inventory} onClose={() => setInventory(null)} />
    </div>
  );
}

// ── À commander: alerting products grouped by supplier ──

function ReorderSection({
  alerts,
  levels,
  deliveries,
  onSelect,
}: {
  alerts: string[];
  levels: Record<string, StockLevel>;
  deliveries: ReturnType<typeof useInventory.getState>["deliveries"];
  onSelect: (productId: string) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const id of alerts) {
      const supplierId = getSupplierForProduct(id)?.id ?? "unknown";
      map.set(supplierId, [...(map.get(supplierId) ?? []), id]);
    }
    return [...map.entries()];
  }, [alerts]);

  return (
    <section id="a-commander" className="scroll-mt-24 space-y-3">
      <h2 className={sectionTitle}>À commander</h2>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">Rien à commander pour le moment.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {groups.map(([supplierId, ids]) => {
            const supplier = getSupplier(supplierId);
            if (!supplier) return null;
            const orderLines = ids.map((id) => {
              const level = levels[id];
              return { id, suggested: Math.max(level.targetLevel - level.qty, 1) };
            });
            const message = `Bonjour ${supplier.contactName}, je souhaiterais commander :\n${orderLines
              .map((l) => `- ${l.suggested} × ${productById[l.id]?.name}`)
              .join("\n")}\nMerci ! — Marché Diaspora`;
            return (
              <div key={supplierId} className="rounded-lg border border-border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{supplier.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {supplier.contactName} · {supplier.phone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Livre : {supplier.deliveryDays} · délai {supplier.leadTimeDays} j
                    </p>
                  </div>
                </div>
                <div className="my-3 divide-y divide-border rounded-md border border-border text-sm">
                  {orderLines.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => onSelect(l.id)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/30"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{productById[l.id]?.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Stock {levels[l.id].qty} / seuil {levels[l.id].reorderLevel}
                          {isRestockPending(l.id, deliveries) && " · réappro. en cours"}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-[11px] uppercase text-muted-foreground">Suggéré</span>
                        <span className="font-semibold tabular-nums">{l.suggested}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <ContactButtons
                  phone={supplier.phone}
                  whatsapp={supplier.whatsapp}
                  email={supplier.email}
                  subject="Commande Marché Diaspora"
                  message={message}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Tableau des stocks ──

function StockTable({
  levels,
  deliveries,
  onSelect,
}: {
  levels: Record<string, StockLevel>;
  deliveries: ReturnType<typeof useInventory.getState>["deliveries"];
  onSelect: (productId: string) => void;
}) {
  const searchParams = useSearchParams();
  const supplierFilter = searchParams.get("fournisseur");
  const filterSupplier = getSupplier(supplierFilter ?? undefined);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "Toutes">("Toutes");

  const rows = products.filter((p) => {
    if (category !== "Toutes" && p.category !== category) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSupplier && getSupplierForProduct(p.id)?.id !== filterSupplier.id) return false;
    return true;
  });

  return (
    <section className="space-y-3">
      <h2 className={sectionTitle}>Tableau des stocks</h2>

      {filterSupplier && (
        <p className="flex items-center gap-2 text-sm">
          Fournisseur : <span className="font-medium">{filterSupplier.name}</span>
          <Link href="/stock" className="inline-flex items-center gap-1 text-[#92400e] hover:underline">
            <X className="h-3.5 w-3.5" /> Retirer le filtre
          </Link>
        </p>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un produit…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {(["Toutes", ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              category === cat
                ? "bg-[#92400e] text-white"
                : "border border-[#e8d5b7] bg-[#fff8f0] text-[#78350f] hover:bg-[#fdf0e0]"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-[#fdf0e0]">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-[#78350f]">Produit</th>
              <th className="hidden px-4 py-3 text-left text-[11px] font-medium uppercase text-[#78350f] lg:table-cell">Fournisseur</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-[#78350f]">Quantité</th>
              <th className="hidden px-4 py-3 text-center text-[11px] font-medium uppercase text-[#78350f] sm:table-cell">Seuil</th>
              <th className="px-4 py-3 text-center text-[11px] font-medium uppercase text-[#78350f]">Statut</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const level = levels[p.id];
              const status = getStockStatus(level);
              const pct = Math.min(100, Math.round(((level?.qty ?? 0) / (level?.targetLevel || 1)) * 100));
              return (
                <tr
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium leading-tight">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {getSupplierForProduct(p.id)?.name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-right font-semibold tabular-nums">{level?.qty ?? 0}</span>
                      <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-muted sm:block">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            status === "In Stock" ? "bg-emerald-500" : status === "Low Stock" ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-center tabular-nums text-muted-foreground sm:table-cell">
                    {level?.reorderLevel}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <StockStatusBadge status={status} />
                      {isRestockPending(p.id, deliveries) && <RestockBadge />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">Aucun produit ne correspond.</p>
        )}
      </div>
    </section>
  );
}
