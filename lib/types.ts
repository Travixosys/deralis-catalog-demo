export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

export type DeliveryPreference = "Pickup" | "Delivery";

export type OrderStatus = "Pending" | "Confirmed" | "Packed" | "Delivered";

export const CATEGORIES = [
  "Grains & Rice",
  "Cooking Oils",
  "Spices & Seasonings",
  "Canned & Preserved",
  "Beverages",
  "Household",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  unit: string;
  stockStatus: StockStatus;
  description: string;
  placeholderColor: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  unit: string;
  quantity: number;
}

export interface Order {
  id: string;
  reference: string;
  customerName: string;
  phone: string;
  deliveryPreference: DeliveryPreference;
  address?: string;
  items: OrderItem[];
  specialInstructions?: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
}

// ── Stock management (admin, French UI) ──

export interface StockLevel {
  productId: string;
  qty: number;
  reorderLevel: number;
  targetLevel: number;
}

export type MovementType =
  | "vente"
  | "reception"
  | "ajustement"
  | "commande_en_ligne";

export type AdjustReason = "Casse" | "Péremption" | "Écart d'inventaire";
export type PaymentMethod = "Carte" | "Espèces";

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  delta: number;
  qtyBefore: number;
  qtyAfter: number;
  note?: string;
  reason?: AdjustReason;
  paymentMethod?: PaymentMethod;
  deliveryId?: string;
  supplierId?: string;
  orderReference?: string;
  createdAt: string;
}

export type DeliveryStatus = "en_preparation" | "a_receptionner" | "receptionnee";

export interface DeliveryLine {
  productId: string;
  expected: number;
  /** Prefill for the "Reçu" column (demo fixtures only). */
  receivedPreset?: number;
  received?: number;
  accepted?: number;
}

export interface ExpectedDelivery {
  id: string;
  reference: string;
  supplierId: string;
  driverId?: string;
  /** Days from today: 0 = aujourd'hui, 1 = demain. */
  etaDays: number;
  status: DeliveryStatus;
  lines: DeliveryLine[];
  incomplete?: boolean;
  issueNote?: string;
  receivedAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  deliveryDays: string;
  leadTimeDays: number;
  speciality: string;
}

export interface Driver {
  id: string;
  name: string;
  company: string;
  phone: string;
  whatsapp: string;
  zone: string;
  days: string;
  vehicle: string;
}
