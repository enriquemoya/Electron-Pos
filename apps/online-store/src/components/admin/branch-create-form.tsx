"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaSelector } from "@/components/admin/media/media-selector";

type CreateBranchState = { error?: string | null };

type BranchCreateLabels = {
  name: string;
  city: string;
  address: string;
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
  googleMapsUrl: string;
  submit: string;
  error: string;
  errorDetails: string;
};

type BranchCreateFormProps = {
  locale: string;
  action: (prevState: CreateBranchState, formData: FormData) => Promise<CreateBranchState>;
  labels: BranchCreateLabels;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" className="w-fit" disabled={pending}>
      {label}
    </Button>
  );
}

export function BranchCreateForm({ locale, action, labels }: BranchCreateFormProps) {
  const [state, formAction] = useFormState<CreateBranchState, FormData>(action, { error: null });

  return (
    <form action={formAction} className="grid gap-3 rounded-2xl border border-white/10 p-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-3 md:grid-cols-2">
        <Input name="name" placeholder={labels.name} required />
        <Input name="city" placeholder={labels.city} required />
        <Input name="address" placeholder={labels.address} required />
        <div className="md:col-span-2">
          <MediaSelector
            name="imageUrl"
            folder="banners"
            defaultValue={null}
            labels={labels.media}
          />
        </div>
        <Input name="googleMapsUrl" type="url" placeholder={labels.googleMapsUrl} />
      </div>
      {state?.error ? (
        <div className="space-y-1 text-xs text-rose-200">
          <p>{labels.error}</p>
          <p>{labels.errorDetails.replace("{detail}", state.error)}</p>
        </div>
      ) : null}
      <SubmitButton label={labels.submit} />
    </form>
  );
}
