export type InventoryItem = {
  productId: string;
  quantity: number;
};

export type InventoryState = {
  items: Record<string, InventoryItem>;
};
