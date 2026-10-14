import { useStore } from "./cart";
import { useInventory } from "./inventory";

/**
 * Restore every persisted demo store together, so orders, stock levels,
 * movements and deliveries never disagree after a reset.
 */
export function resetDemo() {
  useStore.getState().resetOrders();
  useInventory.getState().resetStock();
}
