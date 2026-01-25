"use client";

import { useEffect, useState } from "react";
import type { GameType } from "@pos/core";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { t } from "./i18n";

declare global {
  interface Window {
    api?: {
      gameTypes: {
        listGameTypes: (activeOnly?: boolean) => Promise<GameType[]>;
        createGameType: (payload: { name: string }) => Promise<GameType>;
        updateGameType: (payload: { id: string; name: string; active: boolean }) => Promise<GameType>;
      };
    };
  }
}

export default function GameTypesPage() {
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GameType | null>(null);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const loadGameTypes = async () => {
    const api = window.api;
    if (!api) {
      return;
    }
    setLoading(true);
    try {
      const list = await api.gameTypes.listGameTypes(false);
      setGameTypes(list ?? []);
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

  const openCreate = () => {
    setEditing(null);
    setName("");
    setActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (game: GameType) => {
    setEditing(game);
    setName(game.name);
    setActive(game.active);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const api = window.api;
    if (!api) {
      return;
    }
    if (!name.trim()) {
      setFormError(t("errorName"));
      return;
    }
    try {
      if (editing) {
        await api.gameTypes.updateGameType({ id: editing.id, name: name.trim(), active });
      } else {
        await api.gameTypes.createGameType({ name: name.trim() });
      }
      setModalOpen(false);
      await loadGameTypes();
    } catch {
      setFormError(t("errorSave"));
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
        {loading ? <div className="text-sm text-zinc-400">{t("loading")}</div> : null}
        {error ? <div className="text-sm text-rose-300">{error}</div> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("nameLabel")}</TableHead>
              <TableHead>{t("statusLabel")}</TableHead>
              <TableHead className="text-right">{t("editAction")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gameTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-zinc-400">
                  {t("emptyState")}
                </TableCell>
              </TableRow>
            ) : (
              gameTypes.map((game) => (
                <TableRow key={game.id}>
                  <TableCell className="font-semibold text-white">{game.name}</TableCell>
                  <TableCell>{game.active ? t("activeLabel") : t("inactiveLabel")}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 text-white"
                      onClick={() => openEdit(game)}
                    >
                      {t("editAction")}
                    </Button>
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
                {t("nameLabel")}
              </label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="border-white/10 bg-base-900 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("statusLabel")}
              </label>
              <Select
                value={active ? "active" : "inactive"}
                onValueChange={(value) => setActive(value === "active")}
                disabled={!editing}
              >
                <SelectTrigger className="border-white/10 bg-base-900 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-base-900 text-white">
                  <SelectItem value="active">{t("activeLabel")}</SelectItem>
                  <SelectItem value="inactive">{t("inactiveLabel")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
