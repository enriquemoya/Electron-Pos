"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState
} from "@tanstack/react-table";

import { MediaSelector } from "@/components/admin/media/media-selector";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type BranchRecord = {
  id: string;
  name: string;
  address: string;
  city: string;
  googleMapsUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type BranchFormPayload = {
  id?: string;
  name: string;
  city: string;
  address: string;
  googleMapsUrl: string;
  imageUrl: string;
};

type ActionResult = {
  ok: boolean;
  error?: string;
};

type MediaLabels = React.ComponentProps<typeof MediaSelector>["labels"];

type Labels = {
  title: string;
  subtitle: string;
  search: string;
  searchPlaceholder: string;
  empty: string;
  columns: {
    name: string;
    city: string;
    address: string;
    coords: string;
    updatedAt: string;
    action: string;
  };
  fields: {
    name: string;
    city: string;
    address: string;
    imageUrl: string;
    googleMapsUrl: string;
  };
  actions: {
    create: string;
    edit: string;
    save: string;
    delete: string;
    cancel: string;
    prev: string;
    next: string;
  };
  modal: {
    createTitle: string;
    createDescription: string;
    editTitle: string;
    editDescription: string;
  };
  confirm: {
    title: string;
    createDescription: string;
    updateDescription: string;
    deleteTitle: string;
    deleteDescription: string;
    continue: string;
    cancel: string;
  };
  errors: {
    details: string;
    required: string;
  };
  toasts: {
    createSuccess: string;
    createError: string;
    updateSuccess: string;
    updateError: string;
    deleteSuccess: string;
    deleteError: string;
  };
  media: MediaLabels;
};

type Props = {
  locale: string;
  branches: BranchRecord[];
  labels: Labels;
  createBranch: (formData: FormData) => Promise<ActionResult>;
  updateBranch: (formData: FormData) => Promise<ActionResult>;
  deleteBranch: (formData: FormData) => Promise<ActionResult>;
};

function toBranchFormPayload(branch?: BranchRecord): BranchFormPayload {
  if (!branch) {
    return {
      name: "",
      city: "",
      address: "",
      googleMapsUrl: "",
      imageUrl: ""
    };
  }

  return {
    id: branch.id,
    name: branch.name,
    city: branch.city,
    address: branch.address,
    googleMapsUrl: branch.googleMapsUrl ?? "",
    imageUrl: branch.imageUrl ?? ""
  };
}

function validatePayload(payload: BranchFormPayload, labels: Labels) {
  if (!payload.name.trim() || !payload.city.trim() || !payload.address.trim()) {
    return labels.errors.required;
  }
  return null;
}

function buildFormData(locale: string, payload: BranchFormPayload) {
  const formData = new FormData();
  formData.set("locale", locale);
  if (payload.id) {
    formData.set("id", payload.id);
  }
  formData.set("name", payload.name.trim());
  formData.set("city", payload.city.trim());
  formData.set("address", payload.address.trim());
  formData.set("googleMapsUrl", payload.googleMapsUrl.trim());
  formData.set("imageUrl", payload.imageUrl.trim());
  return formData;
}

function BranchFormDialog({
  mode,
  locale,
  branch,
  labels,
  createBranch,
  updateBranch,
  triggerClassName
}: {
  mode: "create" | "edit";
  locale: string;
  branch?: BranchRecord;
  labels: Labels;
  createBranch: (formData: FormData) => Promise<ActionResult>;
  updateBranch: (formData: FormData) => Promise<ActionResult>;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [form, setForm] = React.useState<BranchFormPayload>(toBranchFormPayload(branch));

  React.useEffect(() => {
    if (open) {
      setForm(toBranchFormPayload(branch));
    }
  }, [branch, open]);

  const submit = () => {
    const validationError = validatePayload(form, labels);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    startTransition(async () => {
      const formData = buildFormData(locale, form);
      const result = mode === "create" ? await createBranch(formData) : await updateBranch(formData);

      if (!result.ok) {
        toast.error(labels.errors.details.replace("{detail}", result.error ?? (mode === "create" ? labels.toasts.createError : labels.toasts.updateError)));
        return;
      }

      toast.success(mode === "create" ? labels.toasts.createSuccess : labels.toasts.updateSuccess);
      setConfirmOpen(false);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant={mode === "create" ? "default" : "outline"}
            size={mode === "create" ? "default" : "sm"}
            className={triggerClassName}
          >
            {mode === "create" ? labels.actions.create : labels.actions.edit}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl border-white/10 bg-base-900 text-white">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? labels.modal.createTitle : labels.modal.editTitle}</DialogTitle>
            <DialogDescription className="text-white/60">
              {mode === "create" ? labels.modal.createDescription : labels.modal.editDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${mode}-branch-name`}>{labels.fields.name}</Label>
              <Input
                id={`${mode}-branch-name`}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${mode}-branch-city`}>{labels.fields.city}</Label>
              <Input
                id={`${mode}-branch-city`}
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`${mode}-branch-address`}>{labels.fields.address}</Label>
              <Input
                id={`${mode}-branch-address`}
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{labels.fields.imageUrl}</Label>
              <MediaSelector
                name="imageUrl"
                folder="banners"
                defaultValue={form.imageUrl || null}
                labels={labels.media}
                onChange={(value) => setForm((current) => ({ ...current, imageUrl: value ?? "" }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`${mode}-branch-google-maps`}>{labels.fields.googleMapsUrl}</Label>
              <Input
                id={`${mode}-branch-google-maps`}
                value={form.googleMapsUrl}
                onChange={(event) => setForm((current) => ({ ...current, googleMapsUrl: event.target.value }))}
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {labels.actions.cancel}
            </Button>
            <Button
              type="button"
              className="bg-accent-500 text-base-950 hover:bg-accent-500/90"
              onClick={() => setConfirmOpen(true)}
              disabled={pending}
            >
              {labels.actions.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-white/10 bg-base-900 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.confirm.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {mode === "create" ? labels.confirm.createDescription : labels.confirm.updateDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/10">
              {labels.confirm.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-accent-500 text-base-950 hover:bg-accent-500/90"
              onClick={(event) => {
                event.preventDefault();
                if (pending) {
                  return;
                }
                submit();
              }}
            >
              {labels.confirm.continue}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DeleteBranchButton({
  branch,
  locale,
  labels,
  deleteBranch
}: {
  branch: BranchRecord;
  locale: string;
  labels: Labels;
  deleteBranch: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="border-rose-400/40 text-rose-200 hover:bg-rose-500/10">
          {labels.actions.delete}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-white/10 bg-base-900 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.confirm.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription className="text-white/60">
            {labels.confirm.deleteDescription.replace("{name}", branch.name)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/10">
            {labels.confirm.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-rose-500 text-white hover:bg-rose-500/90"
            onClick={(event) => {
              event.preventDefault();
              if (pending) {
                return;
              }

              startTransition(async () => {
                const formData = new FormData();
                formData.set("id", branch.id);
                formData.set("locale", locale);
                const result = await deleteBranch(formData);
                if (!result.ok) {
                  toast.error(labels.errors.details.replace("{detail}", result.error ?? labels.toasts.deleteError));
                  return;
                }
                toast.success(labels.toasts.deleteSuccess);
                router.refresh();
              });
            }}
          >
            {labels.confirm.continue}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AdminBranchesScreen({ locale, branches, labels, createBranch, updateBranch, deleteBranch }: Props) {
  const [query, setQuery] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "updatedAt", desc: true }]);
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const filteredBranches = React.useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return branches;
    }

    return branches.filter((branch) => {
      return [branch.name, branch.city, branch.address].some((value) => value.toLowerCase().includes(search));
    });
  }, [branches, query]);

  const columns = React.useMemo<ColumnDef<BranchRecord>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: () => labels.columns.name,
        cell: ({ row }) => {
          const branch = row.original;
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-white">{branch.name}</div>
              <div className="text-xs text-white/60">{branch.city}</div>
            </div>
          );
        }
      },
      {
        accessorKey: "address",
        header: () => labels.columns.address,
        cell: ({ row }) => <span className="text-sm text-white/70">{row.original.address}</span>
      },
      {
        id: "coords",
        header: () => labels.columns.coords,
        cell: ({ row }) =>
          row.original.googleMapsUrl ? (
            <a
              href={row.original.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent-500 hover:text-accent-400"
            >
              {labels.fields.googleMapsUrl}
            </a>
          ) : (
            <span className="text-sm text-white/40">--</span>
          )
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            className="h-auto p-0 text-xs uppercase tracking-[0.2em] text-white/50 hover:bg-transparent hover:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {labels.columns.updatedAt}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-white/60">
            {new Date(row.original.updatedAt).toLocaleString(locale)}
          </span>
        )
      },
      {
        id: "actions",
        header: () => labels.columns.action,
        cell: ({ row }) => {
          const branch = row.original;
          return (
            <div className="flex flex-wrap justify-end gap-2">
              <BranchFormDialog
                mode="edit"
                locale={locale}
                branch={branch}
                labels={labels}
                createBranch={createBranch}
                updateBranch={updateBranch}
                triggerClassName="border-white/10 text-white hover:bg-white/10"
              />
              <DeleteBranchButton branch={branch} locale={locale} labels={labels} deleteBranch={deleteBranch} />
            </div>
          );
        }
      }
    ];
  }, [labels, locale, createBranch, updateBranch, deleteBranch]);

  const table = useReactTable({
    data: filteredBranches,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-white">{labels.title}</h1>
          <p className="text-sm text-white/60">{labels.subtitle}</p>
        </div>
        <BranchFormDialog
          mode="create"
          locale={locale}
          labels={labels}
          createBranch={createBranch}
          updateBranch={updateBranch}
        />
      </div>

      <Card className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="grid gap-2">
          <Label htmlFor="branches-search">{labels.search}</Label>
          <Input
            id="branches-search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPagination((current) => ({ ...current, pageIndex: 0 }));
            }}
            placeholder={labels.searchPlaceholder}
          />
        </div>
      </Card>

      <Card className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-white/60">
                  {labels.empty}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-white/[0.04]">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="border-white/10 text-white"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {labels.actions.prev}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/10 text-white"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {labels.actions.next}
        </Button>
      </div>
    </div>
  );
}
