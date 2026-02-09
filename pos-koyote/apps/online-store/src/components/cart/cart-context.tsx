"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { CartItem, CartItemInput } from "@/lib/cart";
import { normalizeCartItem } from "@/lib/cart";

const STORAGE_KEY = "danimezone.cart.v1";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (input: CartItemInput) => void;
  replaceItems: (items: CartItemInput[]) => void;
  updateQuantity: (id: string, nextQuantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadCartItems(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const candidate = item as Partial<CartItem>;
        if (!candidate.id || !candidate.name) {
          return null;
        }
        return normalizeCartItem({
          id: String(candidate.id),
          slug: candidate.slug ?? null,
          name: String(candidate.name),
          imageUrl: candidate.imageUrl ?? null,
          price: typeof candidate.price === "number" ? candidate.price : null,
          currency: typeof candidate.currency === "string" ? candidate.currency : "MXN",
          game: typeof candidate.game === "string" ? candidate.game : null,
          availability: candidate.availability ?? "unknown",
          quantity: typeof candidate.quantity === "number" ? candidate.quantity : 1
        });
      })
      .filter((item): item is CartItem => Boolean(item));
  } catch {
    return [];
  }
}

function saveCartItems(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors.
  }
}

function canIncrement(item: CartItem) {
  return item.availability !== "out_of_stock";
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    setItems(loadCartItems());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) {
      return;
    }
    saveCartItems(items);
  }, [items]);

  const addItem = useCallback((input: CartItemInput) => {
    setItems((prev) => {
      const nextItem = normalizeCartItem(input);
      const existing = prev.find((item) => item.id === nextItem.id);
      if (!existing) {
        return [...prev, nextItem];
      }
      if (!canIncrement(existing)) {
        return prev;
      }
      return prev.map((item) =>
        item.id === nextItem.id
          ? {
              ...item,
              ...nextItem,
              quantity: item.quantity + nextItem.quantity
            }
          : item
      );
    });
  }, []);

  const updateQuantity = useCallback((id: string, nextQuantity: number) => {
    setItems((prev) => {
      if (!Number.isFinite(nextQuantity)) {
        return prev;
      }
      const normalized = Math.max(0, Math.floor(nextQuantity));
      if (normalized <= 0) {
        return prev.filter((item) => item.id !== id);
      }
      return prev.map((item) => {
        if (item.id !== id) {
          return item;
        }
        if (!canIncrement(item) && normalized > item.quantity) {
          return item;
        }
        return { ...item, quantity: normalized };
      });
    });
  }, []);

  const replaceItems = useCallback((nextItems: CartItemInput[]) => {
    setItems(nextItems.map((item) => normalizeCartItem(item)));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrateFromDraft = async () => {
      const response = await fetch("/api/checkout/drafts/active", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const data = (await response.json().catch(() => null)) as
        | {
            draftId?: string | null;
            items?: Array<{
              productId: string;
              quantity: number;
              priceSnapshot: number;
              currency: string;
              availabilitySnapshot: string;
              name: string | null;
              slug: string | null;
              imageUrl: string | null;
              game: string | null;
            }>;
          }
        | null;

      if (!data?.draftId || !Array.isArray(data.items) || data.items.length === 0) {
        return;
      }

      if (cancelled) {
        return;
      }

      replaceItems(
        data.items.map((item) => ({
          id: item.productId,
          slug: item.slug ?? null,
          name: item.name ?? item.productId,
          imageUrl: item.imageUrl ?? null,
          price: typeof item.priceSnapshot === "number" ? item.priceSnapshot : null,
          currency: item.currency ?? "MXN",
          game: item.game ?? null,
          availability: item.availabilitySnapshot ?? "unknown",
          quantity: item.quantity
        }))
      );
    };

    void hydrateFromDraft();

    return () => {
      cancelled = true;
    };
  }, [replaceItems]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + (Number.isFinite(item.quantity) ? item.quantity : 0), 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        if (typeof item.price !== "number") {
          return sum;
        }
        return sum + item.price * item.quantity;
      }, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, itemCount, subtotal, addItem, replaceItems, updateQuantity, removeItem, clear }),
    [items, itemCount, subtotal, addItem, replaceItems, updateQuantity, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
