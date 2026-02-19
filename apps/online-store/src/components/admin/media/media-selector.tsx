"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaLibraryDialog } from "@/components/admin/media/media-library-dialog";

type MediaFolder = "products" | "categories" | "blog" | "banners";

type Labels = {
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
    folders: Record<MediaFolder, string>;
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

export function MediaSelector(props: {
  name: string;
  value?: string | null;
  defaultValue?: string | null;
  folder: MediaFolder;
  labels: Labels;
  onChange?: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string | null>(props.defaultValue ?? null);
  const value = props.value !== undefined ? props.value : internalValue;

  const handleChange = (nextValue: string | null) => {
    if (props.value === undefined) {
      setInternalValue(nextValue);
    }
    props.onChange?.(nextValue);
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name={props.name} value={value ?? ""} />
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          <ImageIcon className="mr-2 h-4 w-4" />
          {props.labels.openLibrary}
        </Button>
        <Button type="button" variant="ghost" onClick={() => handleChange(null)} disabled={!value}>
          {props.labels.remove}
        </Button>
      </div>
      {value ? (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-base-900/70">
          <img src={value} alt={props.labels.selectedLabel} className="h-36 w-full object-cover" />
          <div className="p-2">
            <Input value={value} readOnly aria-label={props.labels.hiddenInputLabel} />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/20 px-3 py-6 text-center text-sm text-white/50">
          {props.labels.emptyLabel}
        </div>
      )}
      <MediaLibraryDialog
        open={open}
        onOpenChange={setOpen}
        folder={props.folder}
        selectedUrl={value}
        onSelect={(url) => {
          handleChange(url);
          setOpen(false);
        }}
        labels={props.labels.dialog}
      />
    </div>
  );
}
