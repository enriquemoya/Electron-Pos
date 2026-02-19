"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MediaGrid } from "@/components/admin/media/media-grid";
import { MediaUploadDropzone } from "@/components/admin/media/media-upload-dropzone";

type MediaFolder = "products" | "categories" | "blog" | "banners";

type MediaItem = {
  key: string;
  url: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  createdAt: string;
};

type Labels = {
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

export function MediaLibraryDialog(props: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  folder: MediaFolder;
  selectedUrl: string | null;
  onSelect: (url: string) => void;
  labels: Labels;
}) {
  const [folder, setFolder] = useState<MediaFolder>(props.folder);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const fetchItems = useCallback(async (nextPage: number, nextFolder: MediaFolder) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(nextPage),
        pageSize: "24",
        folder: nextFolder
      });
      const response = await fetch(`/api/admin/media?${query.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("list failed");
      }
      const payload = (await response.json()) as {
        items: MediaItem[];
        hasMore: boolean;
      };
      setItems(payload.items ?? []);
      setHasMore(Boolean(payload.hasMore));
    } catch {
      toast.error(props.labels.toasts.listError);
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [props.labels.toasts.listError]);

  useEffect(() => {
    if (!props.open) {
      return;
    }
    setFolder(props.folder);
    setPage(1);
    void fetchItems(1, props.folder);
  }, [props.open, props.folder, fetchItems]);

  const canPrev = page > 1;
  const canNext = hasMore;

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("folder", folder);
      formData.append("file", file);
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        throw new Error("upload failed");
      }
      const payload = (await response.json()) as { url: string };
      props.onSelect(payload.url);
      toast.success(props.labels.toasts.uploadSuccess);
      setPage(1);
      await fetchItems(1, folder);
    } catch {
      toast.error(props.labels.toasts.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (key: string) => {
    setDeletingKey(key);
    try {
      const pathKey = key.split("/").map(encodeURIComponent).join("/");
      const response = await fetch(`/api/admin/media/${pathKey}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("delete failed");
      }
      toast.success(props.labels.toasts.deleteSuccess);
      await fetchItems(page, folder);
    } catch {
      toast.error(props.labels.toasts.deleteError);
    } finally {
      setDeletingKey(null);
    }
  };

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center rounded-lg border border-white/10 bg-base-900/60 p-8 text-sm text-white/60">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {props.labels.loading}
        </div>
      );
    }
    if (!items.length) {
      return <div className="rounded-lg border border-white/10 bg-base-900/60 p-8 text-sm text-white/60">{props.labels.empty}</div>;
    }
    return (
      <MediaGrid
        items={items}
        selectedUrl={props.selectedUrl}
        onSelect={props.onSelect}
        onDelete={handleDelete}
        deletingKey={deletingKey}
        labels={props.labels.grid}
      />
    );
  }, [deletingKey, items, loading, props.labels.empty, props.labels.grid, props.labels.loading, props.onSelect, props.selectedUrl]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto border-white/10 bg-base-800">
        <DialogHeader>
          <DialogTitle>{props.labels.title}</DialogTitle>
          <DialogDescription>{props.labels.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="text-xs uppercase tracking-wide text-white/60">
            {props.labels.folder}
            <select
              className="ml-2 rounded-md border border-white/10 bg-base-900 px-2 py-1 text-sm text-white"
              value={folder}
              onChange={(event) => {
                const nextFolder = event.target.value as MediaFolder;
                setFolder(nextFolder);
                setPage(1);
                void fetchItems(1, nextFolder);
              }}
            >
              <option value="products">{props.labels.folders.products}</option>
              <option value="categories">{props.labels.folders.categories}</option>
              <option value="blog">{props.labels.folders.blog}</option>
              <option value="banners">{props.labels.folders.banners}</option>
            </select>
          </label>
          <MediaUploadDropzone
            onUpload={handleUpload}
            uploading={uploading}
            labels={{
              title: props.labels.uploadTitle,
              subtitle: props.labels.uploadSubtitle,
              chooseFile: props.labels.uploadChoose,
              uploading: props.labels.uploadUploading
            }}
          />
        </div>

        {content}

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={!canPrev}
            onClick={() => {
              const next = Math.max(1, page - 1);
              setPage(next);
              void fetchItems(next, folder);
            }}
          >
            {props.labels.paginationPrev}
          </Button>
          <span className="text-xs text-white/60">{page}</span>
          <Button
            type="button"
            variant="outline"
            disabled={!canNext}
            onClick={() => {
              const next = page + 1;
              setPage(next);
              void fetchItems(next, folder);
            }}
          >
            {props.labels.paginationNext}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
