"use client";

import {
  ClipboardCheck,
  Flame,
  Globe,
  PackageMinus,
  Play,
  RotateCcw,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { announceCrossings, useStockToast } from "@/components/admin/stock-toast";
import { productById } from "@/lib/stock";
import { useStore } from "@/lib/store/cart";
import { useInventory } from "@/lib/store/inventory";
import { resetDemo } from "@/lib/store/reset-demo";
import type { InventoryTarget } from "./inventory-sheet";

// Fixed products so every run of the demo tells the same story.
const RUSH_EMPTIES = "grain-01"; // goes to 0 — restored by DEMO-001
const RUSH_LOWERS = "grain-02"; // drops below its threshold — restored by DEMO-001
const RUSH_EXTRAS = [
  { productId: "bev-02", qty: 6 },
  { productId: "can-01", qty: 3 },
];
const FULL_DELIVERY_ID = "del-001";
const PARTIAL_DELIVERY_ID = "del-003";
const COUNT_PRODUCT = "can-01";
const ONLINE_ORDER = {
  customerName: "Awa Diallo",
  phone: "06 39 98 77 12",
  items: [
    { productId: "bev-02", qty: 2 },
    { productId: "can-03", qty: 1 },
    { productId: "grain-04", qty: 1 },
  ],
};

const name = (id: string) => productById[id]?.name ?? id;

export function DemoScenarios({
  onOpenReception,
  onOpenInventory,
}: {
  onOpenReception: (deliveryId: string) => void;
  onOpenInventory: (target: InventoryTarget) => void;
}) {
  const recordSale = useInventory((s) => s.recordSale);
  const recordOnlineOrder = useInventory((s) => s.recordOnlineOrder);
  const checkAvailability = useInventory((s) => s.checkAvailability);
  const markDeliveryArrived = useInventory((s) => s.markDeliveryArrived);
  const addOrder = useStore((s) => s.addOrder);
  const pushToast = useStockToast((s) => s.push);

  function rush() {
    const { levels } = useInventory.getState();
    const empties = levels[RUSH_EMPTIES];
    const lowers = levels[RUSH_LOWERS];
    const sellEmpties = empties.qty;
    const sellLowers = lowers.qty - (lowers.reorderLevel - 1);
    if (sellEmpties <= 0 && sellLowers <= 0) {
      pushToast({
        tone: "warning",
        title: "Scénario déjà joué",
        description: "Ces produits sont déjà en alerte. Réceptionnez la livraison DEMO-001 ou réinitialisez le stock.",
      });
      return;
    }
    const lines = [
      ...(sellEmpties > 0 ? [{ productId: RUSH_EMPTIES, qty: sellEmpties }] : []),
      ...(sellLowers > 0 ? [{ productId: RUSH_LOWERS, qty: sellLowers }] : []),
      ...RUSH_EXTRAS.filter((l) => (levels[l.productId]?.qty ?? 0) >= l.qty),
    ];
    const res = recordSale(lines, "Carte");
    if (!res.ok) {
      pushToast({ tone: "danger", title: "Vente impossible", description: res.error });
      return;
    }
    const count = lines.reduce((s, l) => s + l.qty, 0);
    pushToast({
      tone: "success",
      title: `Coup de feu : ${count} articles vendus`,
      description: lines.map((l) => `${l.qty} × ${name(l.productId)}`).join(", "),
    });
    announceCrossings(res.crossings, name);
  }

  function delivery(deliveryId: string) {
    const d = useInventory.getState().deliveries.find((x) => x.id === deliveryId);
    if (d?.status === "en_preparation") markDeliveryArrived(deliveryId);
    onOpenReception(deliveryId);
  }

  function inventoryCount() {
    const qty = useInventory.getState().levels[COUNT_PRODUCT]?.qty ?? 0;
    onOpenInventory({
      productId: COUNT_PRODUCT,
      countedPreset: Math.max(qty - 3, 0),
      reasonPreset: "Écart d'inventaire",
    });
  }

  function onlineOrder() {
    const shortages = checkAvailability(ONLINE_ORDER.items);
    if (shortages.length > 0) {
      pushToast({
        tone: "danger",
        title: "Commande en ligne refusée",
        description: shortages.map((s) => `${s.productName} : ${s.available} disponible(s)`).join(" · "),
      });
      return;
    }
    const order = addOrder({
      customerName: ONLINE_ORDER.customerName,
      phone: ONLINE_ORDER.phone,
      deliveryPreference: "Pickup",
      items: ONLINE_ORDER.items.map((l) => {
        const p = productById[l.productId];
        return { productId: p.id, productName: p.name, price: p.price, unit: p.unit, quantity: l.qty };
      }),
    });
    const res = recordOnlineOrder(ONLINE_ORDER.items, order.reference);
    if (!res.ok) return;
    pushToast({
      tone: "success",
      title: `Commande en ligne ${order.reference}`,
      description: `${ONLINE_ORDER.customerName} — ${ONLINE_ORDER.items.map((l) => `${l.qty} × ${name(l.productId)}`).join(", ")}. Stock mis à jour.`,
    });
    announceCrossings(res.crossings, name);
  }

  const scenarios = [
    {
      key: "A",
      icon: Flame,
      title: "Coup de feu en magasin",
      description: `Rush de midi : ${name(RUSH_EMPTIES)} part entièrement, ${name(RUSH_LOWERS)} passe sous son seuil.`,
      action: "Simuler une forte vente",
      run: rush,
    },
    {
      key: "B",
      icon: Truck,
      title: "Le fournisseur arrive",
      description: "Le grossiste livre DEMO-001. Vérifiez les quantités et validez : le stock remonte.",
      action: "Simuler une livraison",
      run: () => delivery(FULL_DELIVERY_ID),
    },
    {
      key: "C",
      icon: PackageMinus,
      title: "Livraison incomplète",
      description: "20 sacs commandés, 16 reçus, 4 manquants. Seuls les 16 reçus entrent en stock.",
      action: "Simuler un écart de livraison",
      run: () => delivery(PARTIAL_DELIVERY_ID),
    },
    {
      key: "D",
      icon: ClipboardCheck,
      title: "Inventaire de fin de journée",
      description: `Comptage de ${name(COUNT_PRODUCT)} : 3 boîtes de moins que prévu.`,
      action: "Simuler un inventaire",
      run: inventoryCount,
    },
    {
      key: "E",
      icon: Globe,
      title: "Commande sur le site",
      description: "Une cliente commande en ligne : le stock du magasin baisse aussitôt.",
      action: "Simuler une commande en ligne",
      run: onlineOrder,
    },
  ];

  return (
    <section className="space-y-4 rounded-lg border border-dashed border-[#d97706] bg-[#fff8f0] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Scénarios de démonstration</h2>
          <p className="text-sm text-muted-foreground">Explorez une journée type à l&apos;épicerie.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-white"
          onClick={() => {
            resetDemo();
            pushToast({
              tone: "success",
              title: "Démo réinitialisée",
              description: "Commandes, stock, mouvements et livraisons reviennent à leur état de départ.",
            });
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Réinitialiser la démo
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {scenarios.map((s) => (
          <div key={s.key} className="flex flex-col rounded-lg border border-[#e8d5b7] bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <s.icon className="h-4 w-4 text-[#92400e]" />
                {s.key}. {s.title}
              </span>
            </div>
            <Badge className="mt-2 w-fit border-transparent bg-zinc-100 text-[10px] font-medium text-zinc-600">
              Événement simulé
            </Badge>
            <p className="mt-2 flex-1 text-xs text-muted-foreground">{s.description}</p>
            <Button
              size="sm"
              className="mt-3 h-auto min-h-8 w-full gap-1.5 whitespace-normal bg-[#92400e] text-white hover:bg-[#78350f]"
              onClick={s.run}
            >
              <Play className="h-3 w-3" />
              {s.action}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
