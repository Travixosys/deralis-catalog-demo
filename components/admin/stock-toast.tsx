"use client";

import { create } from "zustand";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

type Tone = "warning" | "danger" | "success";

interface Toast {
  id: number;
  tone: Tone;
  title: string;
  description?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let nextId = 0;

export const useStockToast = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = ++nextId;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }].slice(-4) }));
    setTimeout(() => get().dismiss(id), 6000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

const TONE_CLASS: Record<Tone, string> = {
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  danger: "border-red-300 bg-red-50 text-red-900",
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
};

export function StockToaster() {
  const toasts = useStockToast((s) => s.toasts);
  const dismiss = useStockToast((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed inset-x-4 bottom-16 z-[60] flex flex-col gap-2 sm:bottom-4 sm:right-auto sm:w-96"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex w-full items-start gap-3 rounded-lg border p-3 text-sm shadow-lg ${TONE_CLASS[t.tone]}`}
        >
          {t.tone === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t.title}</p>
            {t.description && <p className="mt-0.5 opacity-80">{t.description}</p>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="rounded-sm opacity-60 hover:opacity-100"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Raise one toast per product that just dropped into "Stock bas" or "Rupture". */
export function announceCrossings(
  crossings: { productId: string; status: string; qtyAfter: number }[],
  productName: (id: string) => string
) {
  const { push } = useStockToast.getState();
  for (const c of crossings) {
    if (c.status === "Out of Stock") {
      push({
        tone: "danger",
        title: `${productName(c.productId)} — rupture de stock`,
        description: "Le produit apparaît désormais indisponible dans la boutique en ligne.",
      });
    } else {
      push({
        tone: "warning",
        title: `${productName(c.productId)} — stock bas`,
        description: `Plus que ${c.qtyAfter} en rayon. Pensez à recommander.`,
      });
    }
  }
}
