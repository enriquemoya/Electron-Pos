"use client";

import { useRef } from "react";
import { UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";

type Labels = {
  title: string;
  subtitle: string;
  chooseFile: string;
  uploading: string;
};

export function MediaUploadDropzone(props: {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  labels: Labels;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-xl border border-dashed border-white/20 bg-base-900/70 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <UploadCloud className="mt-0.5 h-5 w-5 text-amber-300" />
          <div>
            <p className="text-sm font-semibold text-white">{props.labels.title}</p>
            <p className="text-xs text-white/60">{props.labels.subtitle}</p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={props.uploading}
        >
          {props.uploading ? props.labels.uploading : props.labels.chooseFile}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void props.onUpload(file);
          }
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
