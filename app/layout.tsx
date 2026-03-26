import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DemoControls } from "@/components/demo-controls";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marché Diaspora — African & Caribbean Grocery",
  description:
    "Order authentic African and Caribbean groceries online. Browse our catalog, add to cart, and place your order for pickup or delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <DemoControls />
      </body>
    </html>
  );
}
