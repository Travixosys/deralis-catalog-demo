import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Marché Diaspora
        </p>
        <Link
          href="/orders"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <LayoutDashboard className="h-4 w-4" />
          Owner View
        </Link>
      </div>
    </footer>
  );
}
