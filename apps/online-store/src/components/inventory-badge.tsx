import { Badge } from "@/components/ui/badge";
import type { InventoryState } from "@/lib/api";

export function InventoryBadge({ state, label }: { state: InventoryState; label: string }) {
  return <Badge state={state}>{label}</Badge>;
}
