"use client";

import { useEffect, useState } from "react";
import type { Expansion, GameType } from "@pos/core";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { t } from "./i18n";

type ExpansionFormState = {
  gameTypeId: string;
  name: string;
  code: string;
  releaseDate: string;
  active: boolean;
};

const initialForm: ExpansionFormState = {
  gameTypeId: "none",
  name: "",
  code: "",
  releaseDate: "",
  active: true
};

declare global {
  interface Window {
    api?: {
      gameTypes: {
        listGameTypes: (activeOnly?: boolean) => Promise<GameType[]>;
      };
      expansions: {
        getExpansionsByGame: (gameTypeId: string, includeInactive?: boolean) => Promise<Expansion[]>;
        createExpansion: (payload: {
          gameTypeId: string;
          name: string;
          code?: string | null;
          releaseDate?: string | null;
        }) => Promise<Expansion>;
        updateExpansion: (payload: {
          id: string;
          gameTypeId: string;
          name: string;
          code?: string | null;
          releaseDate?: string | null;
          active: boolean;
        }) => Promise<Expansion>;
        deactivateExpansion: (expansionId: string) => Promise<Expansion>;
        deleteExpansion: (expansionId: string) => Promise<void>;
      };
    };
  }
}

export default function ExpansionsPage() {
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [gameTypeId, setGameTypeId] = useState("none");
  const [expansions, setExpansions] = useState<Expansion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expansion | null>(null);
  const [form, setForm] = useState<ExpansionFormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const loadGameTypes = async () => {
    const api = window.api;
    if (!api) {
      return;
    }
    const list = await api.gameTypes.listGameTypes(true);
    setGameTypes(list ?? []);
  };

  const loadExpansions = async (targetGameTypeId: string) => {
    const api = window.api;
    if (!api || targetGameTypeId === "none") {
      setExpansions([]);
      return;
    }
    setLoading(true);
    try {
      const list = await api.expansions.getExpansionsByGame(targetGameTypeId, true);
      setExpansions(list ?? []);
      setError(null);
    } catch {
      setError(t("errorLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGameTypes();
  }, []);

  useEffect(() => {
    loadExpansions(gameTypeId);
  }, [gameTypeId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...initialForm, gameTypeId });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (expansion: Expansion) => {
    setEditing(expansion);
    setForm({
      gameTypeId: expansion.gameTypeId,
      name: expansion.name,
      code: expansion.code ?? "",
      releaseDate: expansion.releaseDate ?? "",
      active: expansion.active
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const api = window.api;
    if (!api) {
      return;
    }
    if (!form.gameTypeId || form.gameTypeId === "none") {
      setFormError(t("errorGameType"));
      return;
    }
    if (!form.name.trim()) {
      setFormError(t("errorName"));
      return;
    }
    try {
      if (editing) {
        await api.expansions.updateExpansion({
          id: editing.id,
          gameTypeId: form.gameTypeId,
          name: form.name.trim(),
          code: form.code.trim() || null,
          releaseDate: form.releaseDate || null,
          active: form.active
        });
      } else {
        await api.expansions.createExpansion({
          gameTypeId: form.gameTypeId,
          name: form.name.trim(),
          code: form.code.trim() || null,
          releaseDate: form.releaseDate || null
        });
      }
      setModalOpen(false);
      await loadExpansions(form.gameTypeId);
    } catch {
      setFormError(t("errorSave"));
    }
  };

  const handleDeactivate = async (expansionId: string) => {
    const api = window.api;
    if (!api) {
      return;
    }
    try {
      await api.expansions.deactivateExpansion(expansionId);
      await loadExpansions(gameTypeId);
      setError(null);
    } catch {
      setError(t("errorSave"));
    }
  };

  const handleDelete = async (expansionId: string) => {
    const api = window.api;
    if (!api) {
      return;
    }
    try {
      await api.expansions.deleteExpansion(expansionId);
      await loadExpansions(gameTypeId);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("referenced")) {
        setError(t("errorDeleteReferenced"));
      } else {
        setError(t("errorSave"));
      }
    }
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
        <div className="mb-4 flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("gameTypeFilterLabel")}
          </label>
          <Select
            value={gameTypeId}
            onValueChange={(value) => {
              setGameTypeId(value);
              setForm((current) => ({ ...current, gameTypeId: value }));
            }}
          >
            <SelectTrigger className="border-white/10 bg-base-900 text-white">
              <SelectValue placeholder={t("gameTypeFilterPlaceholder")} />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-base-900 text-white">
              <SelectItem value="none">{t("gameTypeFilterPlaceholder")}</SelectItem>
              {gameTypes.map((game) => (
                <SelectItem key={game.id} value={game.id}>
                  {game.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? <div className="text-sm text-zinc-400">{t("loading")}</div> : null}
        {error ? <div className="text-sm text-rose-300">{error}</div> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tableName")}</TableHead>
              <TableHead>{t("tableCode")}</TableHead>
              <TableHead>{t("tableRelease")}</TableHead>
              <TableHead>{t("tableStatus")}</TableHead>
              <TableHead className="text-right">{t("tableActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expansions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-400">
                  {t("emptyState")}
                </TableCell>
              </TableRow>
            ) : (
              expansions.map((expansion) => (
                <TableRow key={expansion.id}>
                  <TableCell className="font-semibold text-white">{expansion.name}</TableCell>
                  <TableCell>{expansion.code ?? "-"}</TableCell>
                  <TableCell>{expansion.releaseDate ?? "-"}</TableCell>
                  <TableCell>{expansion.active ? t("statusActive") : t("statusInactive")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-white"
                        onClick={() => openEdit(expansion)}
                      >
                        {t("editAction")}
                      </Button>
                      {expansion.active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 text-white"
                          onClick={() => handleDeactivate(expansion.id)}
                        >
                          {t("deactivateAction")}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 text-white"
                          onClick={() => handleDelete(expansion.id)}
                        >
                          {t("deleteAction")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-white/10 bg-base-900 text-white">
          <DialogHeader>
            <DialogTitle>{editing ? t("modalEditTitle") : t("modalCreateTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("gameTypeLabel")}
              </label>
              <Select
                value={form.gameTypeId}
                onValueChange={(value) => setForm((current) => ({ ...current, gameTypeId: value }))}
              >
                <SelectTrigger className="border-white/10 bg-base-900 text-white">
                  <SelectValue placeholder={t("gameTypeFilterPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-base-900 text-white">
                  <SelectItem value="none">{t("gameTypeFilterPlaceholder")}</SelectItem>
                  {gameTypes.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("nameLabel")}
              </label>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="border-white/10 bg-base-900 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("codeLabel")}
              </label>
              <Input
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                className="border-white/10 bg-base-900 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("releaseLabel")}
              </label>
              <Input
                type="date"
                value={form.releaseDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, releaseDate: event.target.value }))
                }
                className="border-white/10 bg-base-900 text-white"
              />
            </div>
            {editing ? (
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {t("statusLabel")}
                </label>
                <Select
                  value={form.active ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, active: value === "active" }))
                  }
                >
                  <SelectTrigger className="border-white/10 bg-base-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-base-900 text-white">
                    <SelectItem value="active">{t("statusActive")}</SelectItem>
                    <SelectItem value="inactive">{t("statusInactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          {formError ? <div className="text-xs text-rose-300">{formError}</div> : null}
          <DialogFooter className="gap-2 sm:justify-start">
            <Button onClick={handleSave} className="bg-accent-500 text-black">
              {t("saveAction")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="border-white/10 text-white"
            >
              {t("cancelAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
