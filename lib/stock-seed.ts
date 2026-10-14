import type {
  ExpectedDelivery,
  MovementType,
  StockLevel,
  StockMovement,
} from "./types";

// Initial demo inventory. Quantities are fictional and chosen so the
// scenarios tell a coherent story (see components/stock/demo-scenarios.tsx).
// [productId, qty, reorderLevel, targetLevel]
const LEVELS: [string, number, number, number][] = [
  ["grain-01", 14, 6, 30],
  ["grain-02", 12, 5, 20],
  ["grain-03", 18, 5, 24],
  ["grain-04", 22, 6, 24],
  ["grain-05", 3, 4, 12], // stock bas
  ["grain-06", 4, 5, 20], // stock bas — livraison DEMO-003 attendue
  ["oil-01", 16, 6, 24],
  ["oil-02", 11, 4, 16],
  ["oil-03", 2, 5, 15], // stock bas
  ["oil-04", 0, 3, 10], // rupture
  ["oil-05", 9, 3, 12],
  ["spice-01", 25, 8, 30],
  ["spice-02", 17, 6, 24],
  ["spice-03", 13, 4, 16],
  ["spice-04", 2, 4, 12], // stock bas
  ["spice-05", 0, 4, 12], // rupture
  ["spice-06", 21, 6, 24],
  ["can-01", 36, 12, 48],
  ["can-02", 19, 6, 24],
  ["can-03", 28, 10, 40],
  ["can-04", 0, 4, 12], // rupture
  ["can-05", 15, 6, 24],
  ["can-06", 20, 6, 24],
  ["bev-01", 10, 4, 16],
  ["bev-02", 60, 24, 96],
  ["bev-03", 42, 24, 72],
  ["bev-04", 3, 5, 15], // stock bas
  ["bev-05", 12, 4, 16],
  ["house-01", 14, 5, 20],
  ["house-02", 9, 3, 12],
  ["house-03", 23, 6, 24],
  ["house-04", 18, 6, 24],
];

export function seedLevels(): Record<string, StockLevel> {
  return Object.fromEntries(
    LEVELS.map(([productId, qty, reorderLevel, targetLevel]) => [
      productId,
      { productId, qty, reorderLevel, targetLevel },
    ])
  );
}

export function seedDeliveries(): ExpectedDelivery[] {
  return [
    {
      id: "del-001",
      reference: "DEMO-001",
      supplierId: "sup-afro",
      driverId: "drv-ibrahima",
      etaDays: 0,
      status: "a_receptionner",
      lines: [
        { productId: "grain-01", expected: 20 },
        { productId: "grain-02", expected: 10, receivedPreset: 8 },
        { productId: "grain-05", expected: 6 },
      ],
    },
    {
      id: "del-002",
      reference: "DEMO-002",
      supplierId: "sup-antilles",
      driverId: "drv-lucas",
      etaDays: 2,
      status: "en_preparation",
      lines: [
        { productId: "can-05", expected: 12 },
        { productId: "oil-02", expected: 12 },
      ],
    },
    {
      id: "del-003",
      reference: "DEMO-003",
      supplierId: "sup-afro",
      driverId: "drv-ibrahima",
      etaDays: 0,
      status: "a_receptionner",
      lines: [{ productId: "grain-06", expected: 20, receivedPreset: 16 }],
    },
  ];
}

// Past activity, newest first is derived below. Deltas are walked
// backwards from the current seed quantity so before/after values agree.
type SeedEvent = {
  productId: string;
  type: MovementType;
  delta: number;
  hoursAgo: number;
  note?: string;
  supplierId?: string;
};

const EVENTS: SeedEvent[] = [
  { productId: "grain-01", type: "vente", delta: -2, hoursAgo: 2 },
  { productId: "bev-02", type: "vente", delta: -6, hoursAgo: 3 },
  { productId: "grain-02", type: "vente", delta: -1, hoursAgo: 4 },
  { productId: "grain-05", type: "vente", delta: -2, hoursAgo: 5 },
  { productId: "can-01", type: "vente", delta: -4, hoursAgo: 6 },
  { productId: "oil-05", type: "vente", delta: -1, hoursAgo: 8 },
  { productId: "bev-01", type: "vente", delta: -2, hoursAgo: 9 },
  { productId: "spice-05", type: "vente", delta: -2, hoursAgo: 20 },
  { productId: "oil-03", type: "vente", delta: -3, hoursAgo: 26 },
  { productId: "spice-03", type: "vente", delta: -2, hoursAgo: 28 },
  { productId: "oil-04", type: "vente", delta: -1, hoursAgo: 30 },
  { productId: "can-04", type: "commande_en_ligne", delta: -2, hoursAgo: 44, note: "MKT-2026-0009" },
  { productId: "can-01", type: "ajustement", delta: -2, hoursAgo: 50, note: "2 boîtes cabossées" },
  { productId: "bev-04", type: "vente", delta: -2, hoursAgo: 52 },
  { productId: "can-03", type: "commande_en_ligne", delta: -3, hoursAgo: 54, note: "MKT-2026-0007" },
  { productId: "bev-02", type: "reception", delta: 48, hoursAgo: 70, note: "BL-48812", supplierId: "sup-boissons" },
  { productId: "house-01", type: "vente", delta: -1, hoursAgo: 75 },
  { productId: "spice-04", type: "commande_en_ligne", delta: -1, hoursAgo: 100, note: "MKT-2026-0003" },
  { productId: "grain-01", type: "reception", delta: 12, hoursAgo: 120, note: "BL-48790", supplierId: "sup-afro" },
  { productId: "spice-01", type: "vente", delta: -1, hoursAgo: 140 },
];

export function seedMovements(now = Date.now()): StockMovement[] {
  const running: Record<string, number> = Object.fromEntries(
    LEVELS.map(([id, qty]) => [id, qty])
  );
  return [...EVENTS]
    .sort((a, b) => a.hoursAgo - b.hoursAgo)
    .map((e, i) => {
      const qtyAfter = running[e.productId];
      const qtyBefore = qtyAfter - e.delta;
      running[e.productId] = qtyBefore;
      return {
        id: `seed-${i}`,
        productId: e.productId,
        type: e.type,
        delta: e.delta,
        qtyBefore,
        qtyAfter,
        note: e.note,
        reason: e.type === "ajustement" ? "Casse" : undefined,
        paymentMethod: e.type === "vente" ? (i % 3 === 0 ? "Espèces" : "Carte") : undefined,
        supplierId: e.supplierId,
        createdAt: new Date(now - e.hoursAgo * 3_600_000).toISOString(),
      } satisfies StockMovement;
    });
}

/** Levels used for SSR and the first client render, before localStorage hydrates. */
export const SEED_LEVELS = seedLevels();
