import { products } from "./mock-data";
import type {
  DeliveryStatus,
  ExpectedDelivery,
  MovementType,
  Product,
  StockLevel,
  StockStatus,
} from "./types";

export const productById: Record<string, Product> = Object.fromEntries(
  products.map((p) => [p.id, p])
);

/** Single source of truth for availability, derived from quantities. */
export function getStockStatus(level: StockLevel | undefined): StockStatus {
  if (!level || level.qty <= 0) return "Out of Stock";
  if (level.qty <= level.reorderLevel) return "Low Stock";
  return "In Stock";
}

export function isAlert(level: StockLevel | undefined): boolean {
  return getStockStatus(level) !== "In Stock";
}

/** A non-received delivery contains this product. Never affects qty/status. */
export function isRestockPending(
  productId: string,
  deliveries: ExpectedDelivery[]
): boolean {
  return deliveries.some(
    (d) =>
      d.status !== "receptionnee" &&
      d.lines.some((l) => l.productId === productId)
  );
}

export const STATUS_LABEL_FR: Record<StockStatus, string> = {
  "In Stock": "Disponible",
  "Low Stock": "Stock bas",
  "Out of Stock": "Rupture",
};

export const STATUS_BADGE_CLASS: Record<StockStatus, string> = {
  "In Stock": "border-transparent bg-emerald-100 text-emerald-800",
  "Low Stock": "border-transparent bg-amber-100 text-amber-800",
  "Out of Stock": "border-transparent bg-red-100 text-red-800",
};

export const RESTOCK_BADGE_CLASS =
  "border-transparent bg-sky-100 text-sky-800";

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  vente: "Vente en magasin",
  reception: "Réception",
  ajustement: "Ajustement",
  commande_en_ligne: "Commande en ligne",
};

export const MOVEMENT_BADGE_CLASS: Record<MovementType, string> = {
  vente: "border-transparent bg-[#fef3c7] text-[#92400e]",
  reception: "border-transparent bg-emerald-100 text-emerald-800",
  ajustement: "border-transparent bg-zinc-200 text-zinc-800",
  commande_en_ligne: "border-transparent bg-purple-100 text-purple-800",
};

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  en_preparation: "En préparation",
  a_receptionner: "À réceptionner",
  receptionnee: "Réceptionnée",
};

export const DELIVERY_BADGE_CLASS: Record<DeliveryStatus, string> = {
  en_preparation: "border-transparent bg-zinc-200 text-zinc-800",
  a_receptionner: "border-transparent bg-amber-100 text-amber-800",
  receptionnee: "border-transparent bg-emerald-100 text-emerald-800",
};

export function etaLabel(days: number): string {
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `Dans ${days} jours`;
}

export function units(n: number): string {
  return `${n} unité${Math.abs(n) > 1 ? "s" : ""}`;
}
