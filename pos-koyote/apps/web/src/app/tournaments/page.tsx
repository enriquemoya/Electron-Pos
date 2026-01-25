"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { GameType, Tournament } from "@pos/core";
import { t } from "./i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Filters = {
  from?: string;
  to?: string;
  game?: string;
  gameTypeId?: string;
  minParticipants?: number;
  maxParticipants?: number;
};

declare global {
  interface Window {
    api?: {
      tournaments: {
        createTournament: (payload: {
          name: string;
          game: string;
          gameTypeId?: string | null;
          expansionId?: string | null;
          date: string;
          maxCapacity: number;
          entryPriceAmount: number;
          prizeType: Tournament["prizeType"];
          prizeValueAmount: number;
          winnerCount: number;
          prizeDistribution: number[];
        }) => Promise<Tournament>;
        listTournamentsPaged: (filters: Filters & {
          sortBy?: "DATE" | "GAME" | "PARTICIPANTS";
          sortDir?: "ASC" | "DESC";
          page?: number;
          pageSize?: number;
        }) => Promise<{
          items: { tournament: Tournament; participantCount: number }[];
          total: number;
          page: number;
          pageSize: number;
        }>;
      };
      gameTypes: {
        listGameTypes: (activeOnly?: boolean) => Promise<GameType[]>;
      };
    };
  }
}

function getToday(): string {
  return new Date().toLocaleDateString("en-CA");
}

function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toLocaleDateString("en-CA");
}

function statusLabel(status: Tournament["status"]) {
  switch (status) {
    case "DRAFT":
      return t("statusDraft");
    case "OPEN":
      return t("statusOpen");
    case "CLOSED":
      return t("statusClosed");
    default:
      return status;
  }
}

export default function TournamentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<{ tournament: Tournament; participantCount: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState(getDaysAgo(6));
  const [to, setTo] = useState(getToday());
  const [gameTypeId, setGameTypeId] = useState("");
  const [minParticipants, setMinParticipants] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [sortBy, setSortBy] = useState<"DATE" | "GAME" | "PARTICIPANTS">("DATE");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");

  const gameTypeMap = useMemo(() => {
    const map = new Map<string, GameType>();
    gameTypes.forEach((game) => map.set(game.id, game));
    return map;
  }, [gameTypes]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    const api = window.api;
    if (!api) {
      return;
    }
    api.gameTypes.listGameTypes(true).then((list) => {
      setGameTypes(list ?? []);
    });
  }, []);

  useEffect(() => {
    const api = window.api;
    if (!api) {
      return;
    }
    const filters: Filters = {};
    if (from) {
      filters.from = from;
    }
    if (to) {
      filters.to = to;
    }
    if (gameTypeId) {
      filters.gameTypeId = gameTypeId;
    }
    if (minParticipants) {
      filters.minParticipants = Number.parseInt(minParticipants, 10);
    }
    if (maxParticipants) {
      filters.maxParticipants = Number.parseInt(maxParticipants, 10);
    }

    const load = async () => {
      setLoading(true);
      try {
        const response = await api.tournaments.listTournamentsPaged({
          ...filters,
          sortBy,
          sortDir,
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

    load();
  }, [from, to, gameTypeId, minParticipants, maxParticipants, sortBy, sortDir, page, pageSize]);

  const resetFilters = () => {
    setFrom(getDaysAgo(6));
    setTo(getToday());
    setGameTypeId("");
    setMinParticipants("");
    setMaxParticipants("");
    setSortBy("DATE");
    setSortDir("DESC");
    setPage(1);
  };

  const handleCreate = async () => {
    const api = window.api;
    if (!api) {
      return;
    }
    try {
      setLoading(true);
      const today = getToday();
      const created = await api.tournaments.createTournament({
        name: t("draftName"),
        game: "",
        gameTypeId: gameTypes[0]?.id ?? null,
        expansionId: null,
        date: today,
        maxCapacity: 1,
        entryPriceAmount: 0,
        prizeType: "STORE_CREDIT",
        prizeValueAmount: 0,
        winnerCount: 1,
        prizeDistribution: [0]
      });
      router.push(`/tournaments/detail?id=${created.id}`);
    } catch {
      setError(t("errorSave"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
          <p className="text-sm text-zinc-400">{t("subtitle")}</p>
        </div>
        <Button
          type="button"
          onClick={handleCreate}
          className="bg-accent-500 text-black hover:bg-accent-600"
        >
          {t("createAction")}
        </Button>
      </header>

      <Card className="rounded-2xl border border-white/10 bg-base-900 p-4">
        <div className="mb-4 text-sm font-semibold text-white">{t("filterTitle")}</div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("filterFromLabel")}
            </label>
            <Input
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
              className="border-white/10 bg-base-900 text-white"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("filterToLabel")}
            </label>
            <Input
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
              className="border-white/10 bg-base-900 text-white"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("filterGameLabel")}
            </label>
            <Select
              value={gameTypeId || "all"}
              onValueChange={(value) => {
                setGameTypeId(value === "all" ? "" : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="border-white/10 bg-base-900 text-white">
                <SelectValue placeholder={t("filterGameAll")} />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-base-900 text-white">
                <SelectItem value="all">{t("filterGameAll")}</SelectItem>
                {gameTypes.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("filterParticipantsMinLabel")}
            </label>
            <Input
              type="number"
              min={0}
              value={minParticipants}
              onChange={(event) => {
                setMinParticipants(event.target.value);
                setPage(1);
              }}
              className="border-white/10 bg-base-900 text-white"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("filterParticipantsMaxLabel")}
            </label>
            <Input
              type="number"
              min={0}
              value={maxParticipants}
              onChange={(event) => {
                setMaxParticipants(event.target.value);
                setPage(1);
              }}
              className="border-white/10 bg-base-900 text-white"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("filterSortLabel")}
            </label>
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value as "DATE" | "GAME" | "PARTICIPANTS");
                setPage(1);
              }}
            >
              <SelectTrigger className="border-white/10 bg-base-900 text-white">
                <SelectValue placeholder={t("filterSortDate")} />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-base-900 text-white">
                <SelectItem value="DATE">{t("filterSortDate")}</SelectItem>
                <SelectItem value="GAME">{t("filterSortGame")}</SelectItem>
                <SelectItem value="PARTICIPANTS">{t("filterSortParticipants")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("filterSortDirLabel")}
            </label>
            <Select
              value={sortDir}
              onValueChange={(value) => {
                setSortDir(value as "ASC" | "DESC");
                setPage(1);
              }}
            >
              <SelectTrigger className="border-white/10 bg-base-900 text-white">
                <SelectValue placeholder={t("filterSortDesc")} />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-base-900 text-white">
                <SelectItem value="DESC">{t("filterSortDesc")}</SelectItem>
                <SelectItem value="ASC">{t("filterSortAsc")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={resetFilters} className="border-white/10 text-white">
            {t("clearFilters")}
          </Button>
        </div>
      </Card>

      {loading ? <div className="text-sm text-zinc-400">{t("loading")}</div> : null}
      {error ? <div className="text-sm text-rose-300">{error}</div> : null}

      <Card className="rounded-2xl border border-white/10 bg-base-900 p-4">
        <div className="mb-4 text-sm font-semibold text-white">{t("listTitle")}</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tableName")}</TableHead>
              <TableHead>{t("tableGame")}</TableHead>
              <TableHead>{t("tableDate")}</TableHead>
              <TableHead>{t("tableParticipants")}</TableHead>
              <TableHead>{t("tableStatus")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-400">
                  {t("listEmpty")}
                </TableCell>
              </TableRow>
            ) : (
              items.map(({ tournament, participantCount }) => {
                const gameLabel =
                  tournament.gameTypeId && gameTypeMap.get(tournament.gameTypeId)
                    ? gameTypeMap.get(tournament.gameTypeId)?.name
                    : tournament.game;
                return (
                  <TableRow
                    key={tournament.id}
                    className="cursor-pointer hover:bg-white/5"
                    onClick={() => router.push(`/tournaments/detail?id=${tournament.id}`)}
                  >
                    <TableCell className="font-semibold text-white">{tournament.name}</TableCell>
                    <TableCell>{gameLabel || "-"}</TableCell>
                    <TableCell>{tournament.date}</TableCell>
                    <TableCell>{participantCount}</TableCell>
                    <TableCell>{statusLabel(tournament.status)}</TableCell>
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
    </div>
  );
}
