import { create } from "zustand";
import { persist } from "zustand/middleware";
import { productIdsForSupplier } from "../contacts-data";
import { seedDeliveries, seedLevels, seedMovements } from "../stock-seed";
import { getStockStatus, productById } from "../stock";
import type {
  AdjustReason,
  DeliveryLine,
  ExpectedDelivery,
  MovementType,
  PaymentMethod,
  StockLevel,
  StockMovement,
  StockStatus,
} from "../types";

// ── Result types ──

export interface StockShortage {
  productId: string;
  productName: string;
  available: number;
  requested: number;
}

/** A product whose status got worse because of an outflow. */
export interface ThresholdCrossing {
  productId: string;
  status: StockStatus;
  qtyAfter: number;
}

export type OutflowResult =
  | { ok: true; crossings: ThresholdCrossing[] }
  | { ok: false; shortages: StockShortage[]; error: string };

export interface ReceptionItem {
  productId: string;
  expected: number;
  received: number;
  accepted: number;
  before: number;
  after: number;
  statusBefore: StockStatus;
  statusAfter: StockStatus;
}

export type ReceptionResult =
  | { ok: true; deliveryId: string; totalAdded: number; items: ReceptionItem[] }
  | { ok: false; error: string };

export type AdjustResult =
  | { ok: true; before: number; after: number; delta: number }
  | { ok: false; error: string };

export interface ReceptionLineInput {
  productId: string;
  received: number;
  accepted: number;
}

// ── State ──

interface InventoryData {
  levels: Record<string, StockLevel>;
  movements: StockMovement[];
  deliveries: ExpectedDelivery[];
}

interface InventoryState extends InventoryData {
  recordSale: (
    lines: { productId: string; qty: number }[],
    paymentMethod: PaymentMethod
  ) => OutflowResult;
  recordOnlineOrder: (
    lines: { productId: string; qty: number }[],
    orderReference?: string
  ) => OutflowResult;
  /** Check an outflow without applying it. */
  checkAvailability: (
    lines: { productId: string; qty: number }[]
  ) => StockShortage[];
  validateReception: (
    deliveryId: string,
    lines: ReceptionLineInput[],
    issueNote?: string
  ) => ReceptionResult;
  receiveManual: (
    supplierId: string,
    lines: { productId: string; qty: number }[],
    deliveryRef?: string
  ) => ReceptionResult;
  markDeliveryArrived: (deliveryId: string) => void;
  reportIssue: (deliveryId: string, note: string) => void;
  adjust: (
    productId: string,
    countedQty: number,
    reason: AdjustReason,
    note?: string
  ) => AdjustResult;
  setReorderLevel: (productId: string, reorderLevel: number) => void;
  resetStock: () => void;
}

function initialData(): InventoryData {
  return {
    levels: seedLevels(),
    movements: seedMovements(),
    deliveries: seedDeliveries(),
  };
}

let movementCounter = 0;
function newMovementId(): string {
  movementCounter += 1;
  return `mv-${Date.now()}-${movementCounter}`;
}

const isWholeNumber = (n: number) => Number.isInteger(n) && n >= 0;

/** Merge duplicate product lines so validation sees the true requested total. */
function mergeLines(lines: { productId: string; qty: number }[]) {
  const merged = new Map<string, number>();
  for (const l of lines) {
    merged.set(l.productId, (merged.get(l.productId) ?? 0) + l.qty);
  }
  return [...merged.entries()].map(([productId, qty]) => ({ productId, qty }));
}

function findShortages(
  levels: Record<string, StockLevel>,
  lines: { productId: string; qty: number }[]
): StockShortage[] {
  return mergeLines(lines)
    .filter((l) => {
      const level = levels[l.productId];
      return !level || !isWholeNumber(l.qty) || l.qty <= 0 || l.qty > level.qty;
    })
    .map((l) => ({
      productId: l.productId,
      productName: productById[l.productId]?.name ?? l.productId,
      available: levels[l.productId]?.qty ?? 0,
      requested: l.qty,
    }));
}

export const useInventory = create<InventoryState>()(
  persist(
    (set, get) => {
      /**
       * All-or-nothing outflow: validate every line first, then apply.
       * Never produces negative stock or a partially applied sale.
       */
      function applyOutflow(
        lines: { productId: string; qty: number }[],
        type: MovementType,
        extra: Partial<StockMovement>
      ): OutflowResult {
        const merged = mergeLines(lines);
        if (merged.length === 0) {
          return { ok: false, shortages: [], error: "Aucun article sélectionné." };
        }
        const { levels } = get();
        const shortages = findShortages(levels, merged);
        if (shortages.length > 0) {
          return {
            ok: false,
            shortages,
            error: shortages
              .map(
                (s) =>
                  `${s.productName} : ${s.available} disponible(s), ${s.requested} demandé(s)`
              )
              .join(" · "),
          };
        }

        const now = new Date().toISOString();
        const nextLevels = { ...levels };
        const newMovements: StockMovement[] = [];
        const crossings: ThresholdCrossing[] = [];

        for (const line of merged) {
          const level = nextLevels[line.productId];
          const after = level.qty - line.qty;
          const statusBefore = getStockStatus(level);
          nextLevels[line.productId] = { ...level, qty: after };
          const statusAfter = getStockStatus(nextLevels[line.productId]);
          if (statusAfter !== statusBefore && statusAfter !== "In Stock") {
            crossings.push({ productId: line.productId, status: statusAfter, qtyAfter: after });
          }
          newMovements.push({
            ...extra,
            id: newMovementId(),
            productId: line.productId,
            type,
            delta: -line.qty,
            qtyBefore: level.qty,
            qtyAfter: after,
            createdAt: now,
          });
        }

        set((s) => ({
          levels: nextLevels,
          movements: [...newMovements, ...s.movements],
        }));
        return { ok: true, crossings };
      }

      function applyReception(
        delivery: ExpectedDelivery,
        lines: ReceptionLineInput[],
        issueNote: string | undefined,
        isNewDelivery: boolean
      ): ReceptionResult {
        if (delivery.status === "receptionnee") {
          return {
            ok: false,
            error: `La livraison ${delivery.reference} a déjà été réceptionnée.`,
          };
        }
        if (delivery.status !== "a_receptionner") {
          return {
            ok: false,
            error: `La livraison ${delivery.reference} n'est pas encore arrivée.`,
          };
        }

        // Validate everything before touching stock.
        for (const dl of delivery.lines) {
          const input = lines.find((l) => l.productId === dl.productId);
          if (!input) {
            return { ok: false, error: "Ligne de réception manquante." };
          }
          if (!isWholeNumber(input.received) || !isWholeNumber(input.accepted)) {
            return { ok: false, error: "Les quantités doivent être des nombres entiers positifs." };
          }
          if (input.accepted > input.received) {
            return {
              ok: false,
              error: `${productById[dl.productId]?.name} : la quantité acceptée dépasse la quantité reçue.`,
            };
          }
          if (!get().levels[dl.productId]) {
            return { ok: false, error: "Produit inconnu." };
          }
        }

        const now = new Date().toISOString();
        const nextLevels = { ...get().levels };
        const items: ReceptionItem[] = [];
        const newMovements: StockMovement[] = [];

        const receivedLines: DeliveryLine[] = delivery.lines.map((dl) => {
          const input = lines.find((l) => l.productId === dl.productId)!;
          const level = nextLevels[dl.productId];
          const after = level.qty + input.accepted;
          const statusBefore = getStockStatus(level);
          nextLevels[dl.productId] = { ...level, qty: after };
          items.push({
            productId: dl.productId,
            expected: dl.expected,
            received: input.received,
            accepted: input.accepted,
            before: level.qty,
            after,
            statusBefore,
            statusAfter: getStockStatus(nextLevels[dl.productId]),
          });
          if (input.accepted > 0) {
            newMovements.push({
              id: newMovementId(),
              productId: dl.productId,
              type: "reception",
              delta: input.accepted,
              qtyBefore: level.qty,
              qtyAfter: after,
              deliveryId: delivery.id,
              supplierId: delivery.supplierId,
              note: `${delivery.reference} — attendu ${dl.expected} / reçu ${input.received} / accepté ${input.accepted}`,
              createdAt: now,
            });
          }
          return { ...dl, received: input.received, accepted: input.accepted };
        });

        const incomplete = receivedLines.some(
          (l) => (l.accepted ?? 0) < l.expected
        );
        const updated: ExpectedDelivery = {
          ...delivery,
          status: "receptionnee",
          lines: receivedLines,
          incomplete,
          issueNote: issueNote?.trim() || delivery.issueNote,
          receivedAt: now,
        };

        set((s) => ({
          levels: nextLevels,
          movements: [...newMovements, ...s.movements],
          deliveries: isNewDelivery
            ? [updated, ...s.deliveries]
            : s.deliveries.map((d) => (d.id === delivery.id ? updated : d)),
        }));

        return {
          ok: true,
          deliveryId: delivery.id,
          totalAdded: items.reduce((sum, i) => sum + i.accepted, 0),
          items,
        };
      }

      return {
        ...initialData(),

        recordSale: (lines, paymentMethod) =>
          applyOutflow(lines, "vente", { paymentMethod }),

        recordOnlineOrder: (lines, orderReference) =>
          applyOutflow(lines, "commande_en_ligne", {
            orderReference,
            note: orderReference,
          }),

        checkAvailability: (lines) => findShortages(get().levels, lines),

        validateReception: (deliveryId, lines, issueNote) => {
          const delivery = get().deliveries.find((d) => d.id === deliveryId);
          if (!delivery) return { ok: false, error: "Livraison introuvable." };
          return applyReception(delivery, lines, issueNote, false);
        },

        receiveManual: (supplierId, lines, deliveryRef) => {
          const allowed = new Set(productIdsForSupplier(supplierId));
          const kept = mergeLines(lines).filter(
            (l) => l.qty > 0 && allowed.has(l.productId)
          );
          if (kept.length === 0) {
            return { ok: false, error: "Saisissez au moins une quantité reçue." };
          }
          const id = `del-man-${Date.now()}`;
          const delivery: ExpectedDelivery = {
            id,
            reference: deliveryRef?.trim() || `REC-${id.slice(-6)}`,
            supplierId,
            etaDays: 0,
            status: "a_receptionner",
            lines: kept.map((l) => ({ productId: l.productId, expected: l.qty })),
          };
          return applyReception(
            delivery,
            kept.map((l) => ({ productId: l.productId, received: l.qty, accepted: l.qty })),
            undefined,
            true
          );
        },

        markDeliveryArrived: (deliveryId) =>
          set((s) => ({
            deliveries: s.deliveries.map((d) =>
              d.id === deliveryId && d.status === "en_preparation"
                ? { ...d, status: "a_receptionner", etaDays: 0 }
                : d
            ),
          })),

        reportIssue: (deliveryId, note) =>
          set((s) => ({
            deliveries: s.deliveries.map((d) =>
              d.id === deliveryId ? { ...d, issueNote: note.trim() || undefined } : d
            ),
          })),

        adjust: (productId, countedQty, reason, note) => {
          const level = get().levels[productId];
          if (!level) return { ok: false, error: "Produit inconnu." };
          if (!isWholeNumber(countedQty)) {
            return { ok: false, error: "La quantité comptée doit être un nombre entier positif." };
          }
          const delta = countedQty - level.qty;
          if (delta === 0) {
            return { ok: false, error: "Aucun écart : le stock est déjà à cette quantité." };
          }
          set((s) => ({
            levels: { ...s.levels, [productId]: { ...level, qty: countedQty } },
            movements: [
              {
                id: newMovementId(),
                productId,
                type: "ajustement",
                delta,
                qtyBefore: level.qty,
                qtyAfter: countedQty,
                reason,
                note: note?.trim() || undefined,
                createdAt: new Date().toISOString(),
              },
              ...s.movements,
            ],
          }));
          return { ok: true, before: level.qty, after: countedQty, delta };
        },

        setReorderLevel: (productId, reorderLevel) =>
          set((s) => {
            const level = s.levels[productId];
            if (!level || !isWholeNumber(reorderLevel)) return s;
            return {
              levels: {
                ...s.levels,
                [productId]: {
                  ...level,
                  reorderLevel,
                  targetLevel: Math.max(level.targetLevel, reorderLevel + 1),
                },
              },
            };
          }),

        resetStock: () => set(initialData()),
      };
    },
    {
      name: "marche-stock-v1",
      version: 1,
      partialize: (s) => ({
        levels: s.levels,
        movements: s.movements,
        deliveries: s.deliveries,
      }),
    }
  )
);
