import { AdminNav } from "@/components/admin/admin-nav";
import { MovementHistory } from "@/components/stock/movement-history";

export default function HistoriquePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminNav />
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Historique des mouvements</h1>
        <p className="mt-2 text-muted-foreground">
          Chaque vente, réception et correction de stock, avec le stock avant et après.
        </p>
      </div>
      <MovementHistory />
    </div>
  );
}
