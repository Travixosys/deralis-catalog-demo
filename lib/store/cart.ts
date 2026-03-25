import { create } from "zustand";
import type { CartItem, Order, OrderItem, OrderStatus, Product } from "../types";
import { seedOrders } from "../mock-data";

interface StoreState {
  // Cart
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Orders
  orders: Order[];
  addOrder: (order: {
    customerName: string;
    phone: string;
    deliveryPreference: "Pickup" | "Delivery";
    address?: string;
    items: OrderItem[];
    specialInstructions?: string;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  resetOrders: () => void;
}

function generateReference(existingOrders: Order[]): string {
  const maxNum = existingOrders.reduce((max, o) => {
    const num = parseInt(o.reference.split("-").pop() ?? "0", 10);
    return num > max ? num : max;
  }, 0);
  return `MKT-2026-${String(maxNum + 1).padStart(4, "0")}`;
}

export const useStore = create<StoreState>((set, get) => ({
  // ── Cart ──
  items: [],

  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { product, quantity: 1 }] };
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((i) => i.product.id !== productId) };
      }
      return {
        items: state.items.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        ),
      };
    }),

  clearCart: () => set({ items: [] }),

  // ── Orders ──
  orders: [...seedOrders],

  addOrder: (orderData) => {
    const state = get();
    const total = orderData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const newOrder: Order = {
      ...orderData,
      id: `order-${Date.now()}`,
      reference: generateReference(state.orders),
      status: "Pending",
      total: Math.round(total * 100) / 100,
      createdAt: new Date().toISOString(),
    };
    set((prev) => ({ orders: [newOrder, ...prev.orders] }));
    return newOrder;
  },

  updateOrderStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      ),
    })),

  resetOrders: () => set({ orders: [...seedOrders] }),
}));
