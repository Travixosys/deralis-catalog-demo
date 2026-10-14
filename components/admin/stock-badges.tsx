import { Badge } from "@/components/ui/badge";
import {
  RESTOCK_BADGE_CLASS,
  STATUS_BADGE_CLASS,
  STATUS_LABEL_FR,
} from "@/lib/stock";
import type { StockStatus } from "@/lib/types";

export function StockStatusBadge({ status }: { status: StockStatus }) {
  return (
    <Badge className={`status-badge whitespace-nowrap ${STATUS_BADGE_CLASS[status]}`}>
      {STATUS_LABEL_FR[status]}
    </Badge>
  );
}

export function RestockBadge() {
  return (
    <Badge className={`whitespace-nowrap ${RESTOCK_BADGE_CLASS}`}>
      Réappro. en cours
    </Badge>
  );
}
