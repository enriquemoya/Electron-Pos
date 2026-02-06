"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Taxonomy = { id: string; name: string };

type Props = {
  locale: string;
  action: (formData: FormData) => void | Promise<void>;
  categories: Taxonomy[];
  expansions: Taxonomy[];
  labels: {
    name: string;
    slug: string;
    game: string;
    category: string;
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
    games: { value: string; label: string }[];
  };
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function ProductCreateForm({ locale, action, categories, expansions, labels }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const slugEdited = useRef(false);

  const gameOptions = useMemo(() => labels.games, [labels.games]);

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
          name="game"
          className="mt-1 h-10 w-full rounded-md border border-white/10 bg-transparent px-3 text-sm text-white"
          defaultValue={gameOptions[0]?.value ?? "pokemon"}
        >
          {gameOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-white/70">
        {labels.category}
        <select
          name="categoryId"
          className="mt-1 h-10 w-full rounded-md border border-white/10 bg-transparent px-3 text-sm text-white"
          required
        >
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-white/70">
        {labels.expansion}
        <select
          name="expansionId"
          className="mt-1 h-10 w-full rounded-md border border-white/10 bg-transparent px-3 text-sm text-white"
          defaultValue=""
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
