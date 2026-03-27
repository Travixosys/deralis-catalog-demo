"use client";

import { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import confetti from "canvas-confetti";

export function OrderSuccess({ reference }: { reference: string }) {
  useEffect(() => {
    // WOW moment #1: confetti burst on order success
    const duration = 2000;
    const end = Date.now() + duration;

    function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }

    frame();
  }, []);

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-8 py-16 text-center shadow-sm">
      <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
      <h2 className="mt-6 text-2xl font-bold">Order Placed!</h2>
      <p className="mt-2 text-muted-foreground">
        Thank you for your order. Your reference number is:
      </p>
      <p className="mt-3 text-3xl font-bold tracking-wide text-[#92400e]">
        {reference}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        We&apos;ll contact you shortly to confirm your order.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
        <Link href="/orders">
          <Button>View Orders</Button>
        </Link>
      </div>
    </div>
  );
}
