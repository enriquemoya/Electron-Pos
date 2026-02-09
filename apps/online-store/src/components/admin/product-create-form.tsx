"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Taxonomy = { id: string; name: string };

type Props = {
  locale: string;
  action: (formData: FormData) => void | Promise<void>;
  games: Taxonomy[];
  labels: {
    name: string;
    slug: string;
    game: string;
    category: string;
    categoryNone: string;
    expansion: string;
    expansionNone: string;
    price: string;
    imageUrl: string;
    description: string;
    rarity: string;
    tags: string;
    tagsHint: string;
    isActive: string;
    isFeatured: string;
    featuredOrder: string;
    reason: string;
    submit: string;
    gameNone: string;
    availabilityState: string;
    availabilityOptions: {
      available: string;
      lowStock: string;
      outOfStock: string;
      pendingSync: string;
    };
  };
};

type TaxonomyItem = { id: string; name: string };

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function fetchTaxonomies(path: string) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as { items?: TaxonomyItem[] };
  return payload.items ?? [];
}

export function ProductCreateForm({ locale, action, games, labels }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [gameId, setGameId] = useState("");
  const [expansionId, setExpansionId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const [expansions, setExpansions] = useState<TaxonomyItem[]>([]);
  const slugEdited = useRef(false);

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

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited.current) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    slugEdited.current = true;
    setSlug(value);
  }

  function handleGameChange(nextGameId: string) {
    setGameId(nextGameId);
    setExpansionId("");
    setCategoryId("");
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      <label className="block text-sm text-white/70">
        {labels.name}
        <Input name="name" className="mt-1" value={name} onChange={(event) => handleNameChange(event.target.value)} required />
      </label>
      <label className="block text-sm text-white/70">
        {labels.slug}
        <Input name="slug" className="mt-1" value={slug} onChange={(event) => handleSlugChange(event.target.value)} required />
      </label>
      <label className="block text-sm text-white/70">
        {labels.game}
        <select
          name="gameId"
          className="mt-1 h-10 w-full rounded-md border border-white/10 bg-transparent px-3 text-sm text-white"
          value={gameId}
          onChange={(event) => handleGameChange(event.target.value)}
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
        <Input name="price" type="number" step="0.01" className="mt-1" required />
      </label>
      <label className="block text-sm text-white/70">
        {labels.imageUrl}
        <Input name="imageUrl" className="mt-1" required />
      </label>
      <label className="block text-sm text-white/70">
        {labels.description}
        <Input name="description" className="mt-1" />
      </label>
      <label className="block text-sm text-white/70">
        {labels.rarity}
        <Input name="rarity" className="mt-1" />
      </label>
      <label className="block text-sm text-white/70">
        {labels.tags}
        <Input name="tags" className="mt-1" placeholder={labels.tagsHint} />
      </label>
      <label className="block text-sm text-white/70">
        {labels.availabilityState}
        <select
          name="availabilityState"
          className="mt-1 h-10 w-full rounded-md border border-white/10 bg-transparent px-3 text-sm text-white"
          defaultValue="OUT_OF_STOCK"
        >
          <option value="AVAILABLE">{labels.availabilityOptions.available}</option>
          <option value="LOW_STOCK">{labels.availabilityOptions.lowStock}</option>
          <option value="OUT_OF_STOCK">{labels.availabilityOptions.outOfStock}</option>
          <option value="PENDING_SYNC">{labels.availabilityOptions.pendingSync}</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" name="isActive" defaultChecked />
        {labels.isActive}
      </label>
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" name="isFeatured" />
        {labels.isFeatured}
      </label>
      <label className="block text-sm text-white/70">
        {labels.featuredOrder}
        <Input name="featuredOrder" type="number" step="1" className="mt-1" />
      </label>
      <label className="block text-sm text-white/70">
        {labels.reason}
        <Input name="reason" className="mt-1" required />
      </label>
      <Button type="submit" className="w-fit">
        {labels.submit}
      </Button>
    </form>
  );
}
