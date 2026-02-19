"use client";

import { Check, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type MediaItem = {
  key: string;
  url: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  createdAt: string;
};

type MediaGridLabels = {
  select: string;
  selected: string;
  delete: string;
  dimensionsUnknown: string;
};

export function MediaGrid(props: {
  items: MediaItem[];
  selectedUrl: string | null;
  onSelect: (url: string) => void;
  onDelete: (key: string) => void;
  deletingKey: string | null;
  labels: MediaGridLabels;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {props.items.map((item) => {
        const isSelected = props.selectedUrl === item.url;
        return (
          <div key={item.key} className="rounded-xl border border-white/10 bg-base-900/70 p-2">
            <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/40">
              <img
                src={item.url}
                alt={item.key}
                loading="lazy"
                className="h-28 w-full object-cover"
              />
              {isSelected ? (
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-1 text-[10px] font-semibold text-black">
                  <Check className="h-3 w-3" />
                  {props.labels.selected}
                </span>
              ) : null}
            </div>
            <p className="mt-2 truncate text-xs text-white/60" title={item.key}>{item.key}</p>
            <p className="text-[11px] text-white/40">
              {item.width && item.height ? `${item.width}x${item.height}` : props.labels.dimensionsUnknown}
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                className="flex-1"
                variant={isSelected ? "default" : "outline"}
                onClick={() => props.onSelect(item.url)}
              >
                {isSelected ? props.labels.selected : props.labels.select}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                disabled={props.deletingKey === item.key}
                onClick={() => props.onDelete(item.key)}
                aria-label={props.labels.delete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
