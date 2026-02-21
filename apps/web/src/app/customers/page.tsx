"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Customer } from "@pos/core";
import { t } from "./i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type CustomerFormState = {
  firstNames: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
  phone: string;
  email: string;
};

const emptyForm: CustomerFormState = {
  firstNames: "",
  lastNamePaternal: "",
  lastNameMaternal: "",
  phone: "",
  email: ""
};

function mapError(message: string | undefined): string {
  switch (message) {
    case "CONTACT_REQUIRED":
      return t("errorContactRequired");
    case "PHONE_DUPLICATE":
      return t("errorPhoneDuplicate");
    case "EMAIL_DUPLICATE":
      return t("errorEmailDuplicate");
    default:
      return t("errorSave");
  }
}

export default function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nameFilter, setNameFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const loadCustomers = async () => {
    const api = window.api;
    if (!api) {
      return;
    }
    setLoading(true);
    try {
      const response = await api.customers.listPaged({
        name: nameFilter.trim() || undefined,
        phone: phoneFilter.trim() || undefined,
        email: emailFilter.trim() || undefined,
        page,
        pageSize
      });
      setItems(response?.items ?? []);
      setTotal(response?.total ?? 0);
      setError(null);
    } catch {
      setError(t("errorLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [nameFilter, phoneFilter, emailFilter, page, pageSize]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({
      firstNames: customer.firstNames ?? "",
      lastNamePaternal: customer.lastNamePaternal ?? "",
      lastNameMaternal: customer.lastNameMaternal ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? ""
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const api = window.api;
    if (!api) {
      return;
    }
    try {
      const now = new Date().toISOString();
      const payload: Customer = {
        id: editing?.id ?? crypto.randomUUID(),
        firstNames: form.firstNames.trim(),
        lastNamePaternal: form.lastNamePaternal.trim(),
        lastNameMaternal: form.lastNameMaternal.trim(),
        birthDate: editing?.birthDate ?? null,
        address: editing?.address ?? null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        createdAt: editing?.createdAt ?? now,
        updatedAt: now
      };

      if (editing) {
        await api.customers.updateCustomer(payload);
      } else {
        await api.customers.createCustomer(payload);
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFormError(null);
      await loadCustomers();
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      setFormError(mapError(message));
    }
  };

  const resetFilters = () => {
    setNameFilter("");
    setPhoneFilter("");
    setEmailFilter("");
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
          <p className="text-sm text-zinc-400">{t("subtitle")}</p>
        </div>
        <Button className="bg-accent-500 text-black hover:bg-accent-600" onClick={openCreate}>
          {t("createAction")}
        </Button>
      </header>

      <Card className="rounded-2xl border border-white/10 bg-base-900 p-4">
        <div className="mb-4 text-sm font-semibold text-white">{t("filtersTitle")}</div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("filterNameLabel")}</label>
            <Input
              value={nameFilter}
              onChange={(event) => {
                setNameFilter(event.target.value);
                setPage(1);
              }}
              placeholder={t("filterNamePlaceholder")}
              className="border-white/10 bg-base-900 text-white"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("filterPhoneLabel")}</label>
            <Input
              value={phoneFilter}
              onChange={(event) => {
                setPhoneFilter(event.target.value);
                setPage(1);
              }}
              placeholder={t("filterPhonePlaceholder")}
              className="border-white/10 bg-base-900 text-white"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("filterEmailLabel")}</label>
            <Input
              value={emailFilter}
              onChange={(event) => {
                setEmailFilter(event.target.value);
                setPage(1);
              }}
              placeholder={t("filterEmailPlaceholder")}
              className="border-white/10 bg-base-900 text-white"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={resetFilters} className="border-white/10 text-white">
            {t("clearFilters")}
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl border border-white/10 bg-base-900 p-4">
        {loading ? <div className="text-sm text-zinc-400">{t("loading")}</div> : null}
        {error ? <div className="text-sm text-rose-300">{error}</div> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tableName")}</TableHead>
              <TableHead>{t("tablePhone")}</TableHead>
              <TableHead>{t("tableEmail")}</TableHead>
              <TableHead className="text-right">{t("tableActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-zinc-400">
                  {t("emptyState")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((customer) => {
                const name = `${customer.firstNames} ${customer.lastNamePaternal} ${customer.lastNameMaternal}`.trim();
                return (
                  <TableRow key={customer.id}>
                    <TableCell className="font-semibold text-white">{name}</TableCell>
                    <TableCell>{customer.phone ?? "-"}</TableCell>
                    <TableCell>{customer.email ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 text-white"
                          onClick={() => openEdit(customer)}
                        >
                          {t("editAction")}
                        </Button>
                        <Link
                          href={`/customers/credit?id=${customer.id}`}
                          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white"
                        >
                          {t("viewCreditAction")}
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">{t("pageLabel", { page, total: pageCount })}</div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 text-white"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              {t("prevPage")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 text-white"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            >
              {t("nextPage")}
            </Button>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number.parseInt(value, 10));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[110px] border-white/10 bg-base-900 text-xs text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-base-900 text-white">
                {[10, 20, 30, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {t("pageSizeLabel", { size })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-white/10 bg-base-900 text-white">
          <DialogHeader>
            <DialogTitle>{editing ? t("modalEditTitle") : t("modalCreateTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("firstNamesLabel")}</label>
              <Input
                value={form.firstNames}
                onChange={(event) => setForm((current) => ({ ...current, firstNames: event.target.value }))}
                className="border-white/10 bg-base-900 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("lastNamePaternalLabel")}</label>
              <Input
                value={form.lastNamePaternal}
                onChange={(event) => setForm((current) => ({ ...current, lastNamePaternal: event.target.value }))}
                className="border-white/10 bg-base-900 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("lastNameMaternalLabel")}</label>
              <Input
                value={form.lastNameMaternal}
                onChange={(event) => setForm((current) => ({ ...current, lastNameMaternal: event.target.value }))}
                className="border-white/10 bg-base-900 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("phoneLabel")}</label>
              <Input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="border-white/10 bg-base-900 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("emailLabel")}</label>
              <Input
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="border-white/10 bg-base-900 text-white"
              />
            </div>
          </div>
          {formError ? <div className="text-xs text-rose-300">{formError}</div> : null}
          <DialogFooter className="gap-2 sm:justify-start">
            <Button onClick={handleSave} className="bg-accent-500 text-black">
              {t("saveAction")}
            </Button>
            <Button variant="outline" onClick={() => setModalOpen(false)} className="border-white/10 text-white">
              {t("cancelAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
