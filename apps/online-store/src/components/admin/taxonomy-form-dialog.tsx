"use client";

import { useEffect, useMemo, useState } from "react";

import { TaxonomyOptionCombobox, type TaxonomyOption } from "@/components/admin/taxonomy-option-combobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type TaxonomyType = "CATEGORY" | "GAME" | "EXPANSION" | "OTHER";

type TaxonomyFormDialogProps = {
  mode: "create" | "edit";
  action: (formData: FormData) => void | Promise<void>;
  triggerLabel: string;
  title: string;
  description: string;
  locale: string;
  labels: {
    type: string;
    name: string;
    slug: string;
    description: string;
    gameDependency: string;
    expansionDependency: string;
    parentSelect: string;
    parentEmpty: string;
    noGamesFound: string;
    noExpansionsFound: string;
    releaseYear: string;
    releaseMonth: string;
    releaseEmpty: string;
    labelEs: string;
    labelEn: string;
    submit: string;
    cancel: string;
  };
  typeLabels: {
    category: string;
    game: string;
    expansion: string;
    other: string;
  };
  games: TaxonomyOption[];
  initial?: {
    id: string;
    type: TaxonomyType;
    name: string;
    slug: string;
    description: string;
    labelEs: string;
    labelEn: string;
    gameId: string;
    expansionId: string;
    releaseDate: string;
  };
};

type ExpansionItem = {
  id: string;
  name: string;
  labels: { es: string | null; en: string | null };
};

async function fetchExpansions(gameId: string): Promise<TaxonomyOption[]> {
  if (!gameId) {
    return [];
  }
  const response = await fetch(`/api/taxonomies/expansions?gameId=${encodeURIComponent(gameId)}`, {
    cache: "no-store"
  });
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as { items?: ExpansionItem[] };
  return (payload.items ?? []).map((item) => ({
    id: item.id,
    label: item.labels.es || item.name
  }));
}

export function TaxonomyFormDialog({
  mode,
  action,
  triggerLabel,
  title,
  description,
  locale,
  labels,
  typeLabels,
  games,
  initial
}: TaxonomyFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TaxonomyType>(initial?.type ?? "CATEGORY");
  const [gameId, setGameId] = useState(initial?.gameId ?? "");
  const [expansionId, setExpansionId] = useState(initial?.expansionId ?? "");
  const [releaseYear, setReleaseYear] = useState(initial?.releaseDate ? initial.releaseDate.slice(0, 4) : "");
  const [releaseMonth, setReleaseMonth] = useState(initial?.releaseDate ? initial.releaseDate.slice(5, 7) : "");
  const [expansionOptions, setExpansionOptions] = useState<TaxonomyOption[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setType(initial?.type ?? "CATEGORY");
    setGameId(initial?.gameId ?? "");
    setExpansionId(initial?.expansionId ?? "");
    setReleaseYear(initial?.releaseDate ? initial.releaseDate.slice(0, 4) : "");
    setReleaseMonth(initial?.releaseDate ? initial.releaseDate.slice(5, 7) : "");
  }, [open, initial]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const options = await fetchExpansions(gameId);
      if (ignore) {
        return;
      }
      setExpansionOptions(options);
    })();
    return () => {
      ignore = true;
    };
  }, [gameId]);

  const showGameDependency = type === "CATEGORY" || type === "EXPANSION";
  const showExpansionDependency = type === "CATEGORY";
  const showReleaseDependency = type === "EXPANSION";

  const releaseDate = useMemo(() => {
    if (!showReleaseDependency || !releaseYear || !releaseMonth) {
      return "";
    }
    return `${releaseYear}-${releaseMonth}-01`;
  }, [showReleaseDependency, releaseYear, releaseMonth]);

  const parentId = useMemo(() => {
    if (type === "EXPANSION") {
      return gameId;
    }
    if (type === "CATEGORY") {
      return expansionId || gameId;
    }
    return "";
  }, [type, gameId, expansionId]);

  const handleTypeChange = (nextType: TaxonomyType) => {
    setType(nextType);
    if (nextType === "GAME" || nextType === "OTHER") {
      setGameId("");
      setExpansionId("");
      setReleaseYear("");
      setReleaseMonth("");
      return;
    }
    if (nextType === "EXPANSION") {
      setExpansionId("");
      return;
    }
    setReleaseYear("");
    setReleaseMonth("");
  };

  const handleGameChange = (nextGameId: string) => {
    setGameId(nextGameId);
    setExpansionId("");
  };

  const formDefaults = {
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    labelEs: initial?.labelEs ?? "",
    labelEn: initial?.labelEn ?? ""
  };
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 41 }, (_, index) => String(currentYear + 1 - index));
  const monthOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={mode === "create" ? "default" : "outline"} size={mode === "create" ? "default" : "sm"}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          action={async (formData: FormData) => {
            await action(formData);
            setOpen(false);
          }}
          className="space-y-4"
        >
          {mode === "edit" && initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="parentId" value={parentId} />
          <input type="hidden" name="releaseDate" value={releaseDate} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-white/60">{labels.type}</label>
              {mode === "create" ? (
                <select
                  name="type"
                  className="h-10 w-full rounded-md border border-white/10 bg-base-800 px-3 text-sm text-white"
                  value={type}
                  onChange={(event) => handleTypeChange(event.target.value as TaxonomyType)}
                >
                  <option value="CATEGORY">{typeLabels.category}</option>
                  <option value="GAME">{typeLabels.game}</option>
                  <option value="EXPANSION">{typeLabels.expansion}</option>
                  <option value="OTHER">{typeLabels.other}</option>
                </select>
              ) : (
                <>
                  <input type="hidden" name="type" value={type} />
                  <Input value={typeLabels[type.toLowerCase() as keyof typeof typeLabels]} readOnly />
                </>
              )}
            </div>
            {showGameDependency ? (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-white/60">{labels.gameDependency}</label>
                <TaxonomyOptionCombobox
                  options={games}
                  value={gameId}
                  onChange={handleGameChange}
                  placeholder={labels.parentSelect}
                  emptyLabel={labels.parentEmpty}
                  noResultsLabel={labels.noGamesFound}
                />
              </div>
            ) : null}
            {showExpansionDependency ? (
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-white/60">{labels.expansionDependency}</label>
                <TaxonomyOptionCombobox
                  options={expansionOptions}
                  value={expansionId}
                  onChange={setExpansionId}
                  placeholder={labels.expansionDependency}
                  emptyLabel={labels.parentEmpty}
                  noResultsLabel={labels.noExpansionsFound}
                  disabled={!gameId}
                />
              </div>
            ) : null}
            {showReleaseDependency ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-white/60">{labels.releaseYear}</label>
                  <select
                    className="h-10 w-full rounded-md border border-white/10 bg-base-800 px-3 text-sm text-white"
                    value={releaseYear}
                    onChange={(event) => setReleaseYear(event.target.value)}
                    required
                  >
                    <option value="">{labels.releaseEmpty}</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-white/60">{labels.releaseMonth}</label>
                  <select
                    className="h-10 w-full rounded-md border border-white/10 bg-base-800 px-3 text-sm text-white"
                    value={releaseMonth}
                    onChange={(event) => setReleaseMonth(event.target.value)}
                    required
                  >
                    <option value="">{labels.releaseEmpty}</option>
                    {monthOptions.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}
            <Input name="name" defaultValue={formDefaults.name} placeholder={labels.name} required />
            <Input name="slug" defaultValue={formDefaults.slug} placeholder={labels.slug} required />
            <Input name="description" defaultValue={formDefaults.description} placeholder={labels.description} />
            <Input name="labelEs" defaultValue={formDefaults.labelEs} placeholder={labels.labelEs} />
            <Input name="labelEn" defaultValue={formDefaults.labelEn} placeholder={labels.labelEn} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {labels.cancel}
              </Button>
            </DialogClose>
            <Button type="submit">{labels.submit}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
