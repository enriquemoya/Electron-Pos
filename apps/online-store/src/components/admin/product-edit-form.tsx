"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaSelector } from "@/components/admin/media/media-selector";

type Taxonomy = { id: string; name: string };

type Product = {
  productId: string;
  displayName: string | null;
  slug: string | null;
  categoryId?: string | null;
  expansionId?: string | null;
  gameId?: string | null;
  price: number | null;
  imageUrl: string | null;
  shortDescription: string | null;
  description?: string | null;
  rarity?: string | null;
  tags?: string[] | null;
  availabilityState: string | null;
  isFeatured: boolean;
  isActive?: boolean;
  featuredOrder: number | null;
};

type Props = {
  locale: string;
  action: (formData: FormData) => void | Promise<void>;
  product: Product;
  games: Taxonomy[];
  labels: {
    displayName: string;
    slug: string;
    game: string;
    gameNone: string;
    category: string;
    categoryNone: string;
    expansion: string;
    expansionNone: string;
    price: string;
    imageUrl: string;
    media: {
      openLibrary: string;
      selectedLabel: string;
      emptyLabel: string;
      remove: string;
      hiddenInputLabel: string;
      dialog: {
        title: string;
        description: string;
        empty: string;
        loading: string;
        close: string;
        folder: string;
        folders: {
          products: string;
          categories: string;
          blog: string;
          banners: string;
        };
        paginationPrev: string;
        paginationNext: string;
        uploadTitle: string;
        uploadSubtitle: string;
        uploadChoose: string;
        uploadUploading: string;
        toasts: {
          listError: string;
          uploadSuccess: string;
          uploadError: string;
          deleteSuccess: string;
          deleteError: string;
        };
        grid: {
          select: string;
          selected: string;
          delete: string;
          dimensionsUnknown: string;
        };
      };
    };
    shortDescription: string;
    description: string;
    rarity: string;
    tags: string;
    availabilityState: string;
    isFeatured: string;
    isActive: string;
    featuredOrder: string;
    reason: string;
    submit: string;
    availabilityOptions: {
      available: string;
      lowStock: string;
      outOfStock: string;
      pendingSync: string;
    };
  };
};

type TaxonomyItem = { id: string; name: string };

async function fetchTaxonomies(path: string) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as { items?: TaxonomyItem[] };
  return payload.items ?? [];
}

export function ProductEditForm({ locale, action, product, games, labels }: Props) {
  const [gameId, setGameId] = useState(product.gameId ?? "");
  const [expansionId, setExpansionId] = useState(product.expansionId ?? "");
  const [categoryId, setCategoryId] = useState(product.categoryId ?? "");
  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const [expansions, setExpansions] = useState<TaxonomyItem[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(product.imageUrl ?? null);

  useEffect(() => {
    let ignore = false;

    (async () => {
      if (!gameId) {
        setExpansions([]);
        setExpansionId("");
        const miscCategories = await fetchTaxonomies("/api/taxonomies/categories?gameId=misc");
        if (ignore) {
          return;
        }
        setCategories(miscCategories);
        setCategoryId((current) =>
          miscCategories.some((item) => item.id === current) ? current : ""
        );
        return;
      }

      const nextExpansions = await fetchTaxonomies(
        `/api/taxonomies/expansions?gameId=${encodeURIComponent(gameId)}`
      );
      const hasExpansion = expansionId
        ? nextExpansions.some((item) => item.id === expansionId)
        : false;
      const effectiveExpansionId = hasExpansion ? expansionId : "";
      const nextCategories = await fetchTaxonomies(
        `/api/taxonomies/categories?gameId=${encodeURIComponent(gameId)}${
          effectiveExpansionId ? `&expansionId=${encodeURIComponent(effectiveExpansionId)}` : ""
        }`
      );
      if (ignore) {
        return;
      }
      setExpansions(nextExpansions);
      if (!hasExpansion && expansionId) {
        setExpansionId("");
      }
      setCategories(nextCategories);
      setCategoryId((current) =>
        nextCategories.some((item) => item.id === current) ? current : ""
      );
    })();

    return () => {
      ignore = true;
    };
  }, [gameId, expansionId]);

  const initialTags = (product.tags ?? []).join(", ");

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="productId" value={product.productId} />
      <input type="hidden" name="locale" value={locale} />
      <label className="block text-sm text-white/70">
        {labels.displayName}
        <Input name="displayName" defaultValue={product.displayName ?? ""} className="mt-1" />
      </label>
      <label className="block text-sm text-white/70">
        {labels.slug}
        <Input name="slug" defaultValue={product.slug ?? ""} className="mt-1" />
      </label>
      <label className="block text-sm text-white/70">
        {labels.game}
        <select
          name="gameId"
          className="mt-1 h-10 w-full rounded-md border border-white/10 bg-transparent px-3 text-sm text-white"
          value={gameId}
          onChange={(event) => {
            setGameId(event.target.value);
            setExpansionId("");
            setCategoryId("");
          }}
        >
          <option value="">{labels.gameNone}</option>
          {games.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-white/70">
        {labels.expansion}
        <select
          name="expansionId"
          className="mt-1 h-10 w-full rounded-md border border-white/10 bg-transparent px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
          value={expansionId}
          onChange={(event) => setExpansionId(event.target.value)}
          disabled={!gameId}
        >
          <option value="">{labels.expansionNone}</option>
          {expansions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-white/70">
        {labels.category}
        <select
          name="categoryId"
          className="mt-1 h-10 w-full rounded-md border border-white/10 bg-transparent px-3 text-sm text-white"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          required
        >
          <option value="" disabled>
            {labels.categoryNone}
          </option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-white/70">
        {labels.price}
        <Input name="price" type="number" step="0.01" defaultValue={product.price ?? ""} className="mt-1" />
      </label>
      <label className="block text-sm text-white/70">
        {labels.imageUrl}
        <div className="mt-1">
          <MediaSelector
            name="imageUrl"
            value={imageUrl}
            folder="products"
            onChange={setImageUrl}
            labels={labels.media}
          />
        </div>
      </label>
      <label className="block text-sm text-white/70">
        {labels.shortDescription}
        <Input name="shortDescription" defaultValue={product.shortDescription ?? ""} className="mt-1" />
      </label>
      <label className="block text-sm text-white/70">
        {labels.description}
        <Input name="description" defaultValue={product.description ?? ""} className="mt-1" />
      </label>
      <label className="block text-sm text-white/70">
        {labels.rarity}
        <Input name="rarity" defaultValue={product.rarity ?? ""} className="mt-1" />
      </label>
      <label className="block text-sm text-white/70">
        {labels.tags}
        <Input name="tags" defaultValue={initialTags} className="mt-1" />
      </label>
      <label className="block text-sm text-white/70">
        {labels.availabilityState}
        <select
          name="availabilityState"
          className="mt-1 h-10 w-full rounded-md border border-white/10 bg-transparent px-3 text-sm text-white"
          defaultValue={product.availabilityState ?? "OUT_OF_STOCK"}
        >
          <option value="AVAILABLE">{labels.availabilityOptions.available}</option>
          <option value="LOW_STOCK">{labels.availabilityOptions.lowStock}</option>
          <option value="OUT_OF_STOCK">{labels.availabilityOptions.outOfStock}</option>
          <option value="PENDING_SYNC">{labels.availabilityOptions.pendingSync}</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" name="isFeatured" defaultChecked={product.isFeatured} />
        {labels.isFeatured}
      </label>
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" name="isActive" defaultChecked={product.isActive ?? true} />
        {labels.isActive}
      </label>
      <label className="block text-sm text-white/70">
        {labels.featuredOrder}
        <Input name="featuredOrder" type="number" step="1" defaultValue={product.featuredOrder ?? ""} className="mt-1" />
      </label>
      <label className="block text-sm text-white/70">
        {labels.reason}
        <Input name="reason" className="mt-1" required />
      </label>
      <Button type="submit">{labels.submit}</Button>
    </form>
  );
}
