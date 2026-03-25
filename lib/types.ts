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
