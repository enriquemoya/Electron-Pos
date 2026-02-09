import type { InventoryState } from "@/lib/api";

export type CartAvailability = "in_stock" | "low_stock" | "out_of_stock" | "pending_sync" | "unknown";

export type CartItem = {
  id: string;
  slug: string | null;
  name: string;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  game: string | null;
  availability: CartAvailability;
  quantity: number;
};

export type CartItemInput = Omit<CartItem, "quantity"> & { quantity?: number };

export function mapInventoryStateToAvailability(state?: InventoryState | null): CartAvailability {
  switch (state) {
    case "AVAILABLE":
      return "in_stock";
    case "LOW_STOCK":
      return "low_stock";
    case "SOLD_OUT":
      return "out_of_stock";
    case "PENDING_SYNC":
      return "pending_sync";
    default:
      return "unknown";
  }
}

export function normalizeCartItem(input: CartItemInput): CartItem {
  const quantity = Number.isFinite(input.quantity) && input.quantity
    ? Math.max(1, Math.floor(input.quantity))
    : 1;

  const availability: CartAvailability = [
    "in_stock",
    "low_stock",
    "out_of_stock",
    "pending_sync",
    "unknown"
  ].includes(input.availability)
    ? input.availability
    : "unknown";

  return {
    id: input.id,
    slug: input.slug ?? null,
    name: input.name,
    imageUrl: input.imageUrl ?? null,
    price: typeof input.price === "number" ? input.price : null,
    currency: input.currency || "MXN",
    game: input.game ?? null,
    availability,
    quantity
  };
}

export function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}
