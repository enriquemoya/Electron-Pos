"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type {
  Customer,
  Expansion,
  GameType,
  PaymentMethod,
  Tournament,
  TournamentParticipant,
  TournamentPrize,
  TournamentPrizeType
} from "@pos/core";
import { requiresProof } from "@pos/core";
import { t } from "../i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TournamentDetail = {
  tournament: Tournament;
  participants: TournamentParticipant[];
  prizes: TournamentPrize[];
};

type TabKey = "details" | "participants" | "sales" | "winners";

const emptyAmount = "";

function parseAmount(value: string): number | null {
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.round(parsed * 100);
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    amount / 100
  );
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

function formatCustomerName(customer: Customer) {
  return `${customer.firstNames} ${customer.lastNamePaternal} ${customer.lastNameMaternal}`.trim();
}

function mapError(message: string | undefined): string | undefined {
  switch (message) {
    case "Participant already registered.":
      return t("participantDuplicate");
    case "Participant must be customer.":
      return t("participantClientRequired");
    case "Winner missing customer.":
      return t("winnerClientRequired");
    case "Tournament has winners.":
      return t("deleteBlockedWinners");
    case "Tournament has sales.":
      return t("deleteBlockedSales");
    default:
      return undefined;
  }
}

export default function TournamentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const routeId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const tournamentId = searchParams.get("id") ?? routeId;
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [detail, setDetail] = useState<TournamentDetail | null>(null);
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [expansions, setExpansions] = useState<Expansion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [gameTypeId, setGameTypeId] = useState("none");
  const [expansionId, setExpansionId] = useState("none");
  const [date, setDate] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [prizeType, setPrizeType] = useState<TournamentPrizeType>("STORE_CREDIT");
  const [prizeValue, setPrizeValue] = useState("");
  const [winnerCount, setWinnerCount] = useState("1");
  const [prizeDistribution, setPrizeDistribution] = useState<string[]>(["0"]);

  const [participantQuery, setParticipantQuery] = useState("");
  const [participantResults, setParticipantResults] = useState<Customer[]>([]);
  const [participantCustomer, setParticipantCustomer] = useState<Customer | null>(null);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickContext, setQuickContext] = useState<"participants" | "sales">("participants");
  const [quickFirstNames, setQuickFirstNames] = useState("");
  const [quickLastNamePaternal, setQuickLastNamePaternal] = useState("");
  const [quickLastNameMaternal, setQuickLastNameMaternal] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [quickError, setQuickError] = useState<string | null>(null);

  const [entryQuery, setEntryQuery] = useState("");
  const [entryResults, setEntryResults] = useState<Customer[]>([]);
  const [entryCustomer, setEntryCustomer] = useState<Customer | null>(null);
  const [entryMethod, setEntryMethod] = useState<PaymentMethod>("EFECTIVO");
  const [entryReference, setEntryReference] = useState("");
  const [entryProof, setEntryProof] = useState<File | null>(null);

  const [winnerSelection, setWinnerSelection] = useState<string[]>([]);
  const [winnerNotes, setWinnerNotes] = useState("");
  const [participantContacts, setParticipantContacts] = useState<Record<string, Customer>>({});

  const gameTypeMap = useMemo(() => {
    const map = new Map<string, GameType>();
    gameTypes.forEach((game) => map.set(game.id, game));
    return map;
  }, [gameTypes]);

  const expansionMap = useMemo(() => {
    const map = new Map<string, Expansion>();
    expansions.forEach((expansion) => map.set(expansion.id, expansion));
    return map;
  }, [expansions]);

  const winnerSelectionValid = useMemo(() => {
    const expectedCount = Number.parseInt(winnerCount, 10) || 0;
    if (!detail?.participants || expectedCount <= 0) {
      return false;
    }
    const trimmed = winnerSelection.slice(0, expectedCount);
    if (trimmed.some((id) => !id)) {
      return false;
    }
    if (new Set(trimmed).size !== trimmed.length) {
      return false;
    }
    return !trimmed.some((id) => {
      const participant = detail.participants.find((entry) => entry.id === id);
      return !participant?.customerId;
    });
  }, [detail?.participants, winnerCount, winnerSelection]);

  const isClosed = detail?.tournament.status === "CLOSED";
  const isOpen = detail?.tournament.status === "OPEN";
  const capacityFull =
    detail?.participants.length !== undefined &&
    detail?.tournament.maxCapacity !== undefined &&
    detail.participants.length >= detail.tournament.maxCapacity;

  const refreshDetail = useCallback(async () => {
    const api = window.api;
    if (!api || !tournamentId) {
      return;
    }
    setLoading(true);
    try {
      const data = await api.tournaments.getTournamentDetail(tournamentId);
      setDetail(data);
      setError(null);
    } catch {
      setError(t("errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    refreshDetail();
  }, [refreshDetail]);

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
    if (gameTypeId === "none") {
      setExpansions([]);
      setExpansionId("none");
      return;
    }
    api.expansions
      .getExpansionsByGame(gameTypeId, true)
      .then((list) => setExpansions(list ?? []))
      .catch(() => setExpansions([]));
  }, [gameTypeId]);

  useEffect(() => {
    if (!detail?.tournament) {
      return;
    }
      const tournament = detail.tournament;
      setName(tournament.name);
      setGameTypeId(tournament.gameTypeId ?? "none");
      setExpansionId(tournament.expansionId ?? "none");
      setDate(tournament.date);
    setMaxCapacity(String(tournament.maxCapacity));
    setEntryPrice((tournament.entryPrice.amount / 100).toFixed(2));
    setPrizeType(tournament.prizeType);
    setPrizeValue((tournament.prizeValue.amount / 100).toFixed(2));
    setWinnerCount(String(tournament.winnerCount ?? 1));
    const distribution = tournament.prizeDistribution ?? [];
    setPrizeDistribution(
      distribution.length > 0
        ? distribution.map((amount) => (amount / 100).toFixed(2))
        : ["0"]
    );
  }, [detail]);

  useEffect(() => {
    const count = Math.max(1, Math.min(8, Number.parseInt(winnerCount, 10) || 1));
    setPrizeDistribution((current) => {
      const next = [...current];
      while (next.length < count) {
        next.push("0");
      }
      return next.slice(0, count);
    });
    setWinnerSelection((current) => {
      const next = [...current];
      while (next.length < count) {
        next.push("");
      }
      return next.slice(0, count);
    });
  }, [winnerCount]);

  useEffect(() => {
    const amounts = prizeDistribution.map((value) => parseAmount(value || emptyAmount) ?? 0);
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    setPrizeValue((total / 100).toFixed(2));
  }, [prizeDistribution]);

  useEffect(() => {
    const api = window.api;
    if (!api || !detail?.participants) {
      return;
    }
    const loadContacts = async () => {
      const uniqueIds = Array.from(
        new Set(detail.participants.map((entry) => entry.customerId).filter(Boolean))
      ) as string[];
      if (uniqueIds.length === 0) {
        setParticipantContacts({});
        return;
      }
      const entries = await Promise.all(
        uniqueIds.map(async (id) => [id, await api.customers.getCustomerDetail(id)] as const)
      );
      const map: Record<string, Customer> = {};
      entries.forEach(([id, customer]) => {
        if (customer) {
          map[id] = customer;
        }
      });
      setParticipantContacts(map);
    };
    loadContacts();
  }, [detail?.participants]);

  useEffect(() => {
    const api = window.api;
    if (!api) {
      return;
    }
    if (!participantQuery.trim()) {
      setParticipantResults([]);
      return;
    }
    const run = async () => {
      try {
        const results = await api.customers.searchCustomers(participantQuery.trim());
        setParticipantResults(results ?? []);
      } catch {
        setParticipantResults([]);
      }
    };
    run();
  }, [participantQuery]);

  useEffect(() => {
    const api = window.api;
    if (!api) {
      return;
    }
    if (!entryQuery.trim()) {
      setEntryResults([]);
      return;
    }
    const run = async () => {
      try {
        const results = await api.customers.searchCustomers(entryQuery.trim());
        setEntryResults(results ?? []);
      } catch {
        setEntryResults([]);
      }
    };
    run();
  }, [entryQuery]);

  const saveTournament = async () => {
    const api = window.api;
    if (!api || !detail?.tournament) {
      return;
    }
    const entryAmount = parseAmount(entryPrice);
    const prizeAmounts = prizeDistribution.map((value) => parseAmount(value || emptyAmount));
    const capacityValue = Number.parseInt(maxCapacity, 10);
    const winnerCountValue = Number.parseInt(winnerCount, 10);
    const selectedGame = gameTypeId !== "none" ? gameTypeMap.get(gameTypeId) : null;
    const selectedExpansion =
      expansionId !== "none" ? expansionMap.get(expansionId) : null;
    if (expansionId !== "none" && gameTypeId === "none") {
      setError(t("expansionRequiresGame"));
      return;
    }
    if (selectedExpansion && selectedExpansion.gameTypeId !== selectedGame?.id) {
      setError(t("expansionMismatch"));
      return;
    }
    if (
      !name.trim() ||
      !selectedGame?.name?.trim() ||
      !date.trim() ||
      !Number.isFinite(capacityValue) ||
      capacityValue <= 0 ||
      entryAmount === null ||
      !Number.isFinite(winnerCountValue) ||
      winnerCountValue < 1 ||
      winnerCountValue > 8 ||
      prizeAmounts.some((amount) => amount === null)
    ) {
      setError(t("errorSave"));
      return;
    }
    if (prizeAmounts.length !== winnerCountValue) {
      setError(t("winnerCountError"));
      return;
    }

    const distribution = prizeAmounts.map((amount) => amount ?? 0);
    const totalPrize = distribution.reduce((sum, amount) => sum + amount, 0);

    try {
      setLoading(true);
      const updated: Tournament = {
        ...detail.tournament,
        name: name.trim(),
        game: selectedGame?.name ?? detail.tournament.game,
        gameTypeId: selectedGame?.id ?? null,
        expansionId: selectedExpansion?.id ?? null,
        date,
        maxCapacity: capacityValue,
        entryPrice: { amount: entryAmount, currency: "MXN" },
        prizeType,
        prizeValue: { amount: totalPrize, currency: "MXN" },
        winnerCount: winnerCountValue,
        prizeDistribution: distribution
      };
      await api.tournaments.updateTournament(updated);
      await refreshDetail();
      setError(null);
      setMessage(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      setError(mapError(message) ?? t("errorSave"));
    } finally {
      setLoading(false);
    }
  };

  const openTournament = async () => {
    if (!detail?.tournament) {
      return;
    }
    const api = window.api;
    if (!api) {
      return;
    }
    try {
      setLoading(true);
      await api.tournaments.updateTournament({ ...detail.tournament, status: "OPEN" });
      await refreshDetail();
      setError(null);
    } catch {
      setError(t("errorSave"));
    } finally {
      setLoading(false);
    }
  };

  const closeTournament = async () => {
    if (!detail?.tournament) {
      return;
    }
    const api = window.api;
    if (!api) {
      return;
    }
    try {
      setLoading(true);
      await api.tournaments.closeTournament(detail.tournament.id);
      await refreshDetail();
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      setError(mapError(message) || t("errorClose"));
    } finally {
      setLoading(false);
    }
  };

  const deleteTournament = async () => {
    const api = window.api;
    if (!api || !detail?.tournament) {
      return;
    }
    try {
      setLoading(true);
      await api.tournaments.deleteTournament(detail.tournament.id);
      router.push("/tournaments");
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      setError(mapError(message) || t("deleteError"));
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = async () => {
    if (!detail?.tournament) {
      return;
    }
    const api = window.api;
    if (!api) {
      return;
    }
    if (!participantCustomer) {
      setError(t("participantClientRequired"));
      return;
    }
    const duplicate = detail.participants.some(
      (entry) => entry.customerId === participantCustomer.id
    );
    if (duplicate) {
      setError(t("participantDuplicate"));
      return;
    }
    try {
      setLoading(true);
      await api.tournaments.addParticipant({
        tournamentId: detail.tournament.id,
        name: formatCustomerName(participantCustomer),
        customerId: participantCustomer.id
      });
      await refreshDetail();
      setParticipantQuery("");
      setParticipantResults([]);
      setParticipantCustomer(null);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      setError(mapError(message) ?? t("errorParticipant"));
    } finally {
      setLoading(false);
    }
  };

  const removeParticipant = async (participantId: string) => {
    if (!detail?.tournament) {
      return;
    }
    const api = window.api;
    if (!api) {
      return;
    }
    try {
      setLoading(true);
      await api.tournaments.removeParticipant({
        tournamentId: detail.tournament.id,
        participantId
      });
      await refreshDetail();
    } catch {
      setError(t("errorParticipant"));
    } finally {
      setLoading(false);
    }
  };

  const sellEntry = async () => {
    if (!detail?.tournament) {
      return;
    }
    const api = window.api;
    if (!api) {
      return;
    }
    if (!entryCustomer) {
      setError(t("entryCustomerRequired"));
      return;
    }
    const duplicate = detail.participants.some(
      (entry) => entry.customerId === entryCustomer.id
    );
    if (duplicate) {
      setError(t("participantDuplicate"));
      return;
    }

    let proofFilePayload: {
      fileBuffer: ArrayBuffer;
      fileName: string;
      mimeType: string;
    } | null = null;

    if (requiresProof(entryMethod) && entryProof) {
      const buffer = await entryProof.arrayBuffer();
      proofFilePayload = {
        fileBuffer: buffer,
        fileName: entryProof.name,
        mimeType: entryProof.type
      };
    }

    const proofStatus = requiresProof(entryMethod)
      ? proofFilePayload
        ? "ATTACHED"
        : "PENDING"
      : "ATTACHED";

    try {
      setLoading(true);
      await api.tournaments.sellEntry({
        tournamentId: detail.tournament.id,
        participant: {
          name: formatCustomerName(entryCustomer),
          customerId: entryCustomer.id
        },
        payment: {
          method: entryMethod,
          reference: entryReference.trim() || null,
          proofStatus,
          proofFile: proofFilePayload
        }
      });

      await refreshDetail();
      setEntryQuery("");
      setEntryResults([]);
      setEntryCustomer(null);
      setEntryMethod("EFECTIVO");
      setEntryReference("");
      setEntryProof(null);
      setError(null);
      setMessage(requiresProof(entryMethod) && !proofFilePayload ? t("entryWarning") : t("entrySuccess"));
    } catch {
      setError(t("entryError"));
    } finally {
      setLoading(false);
    }
  };

  const assignWinner = async () => {
    if (!detail?.tournament) {
      return;
    }
    const api = window.api;
    if (!api) {
      return;
    }
    const expectedCount = Number.parseInt(winnerCount, 10);
    const trimmedSelection = winnerSelection.slice(0, expectedCount);
    if (trimmedSelection.some((id) => !id)) {
      setError(t("winnerCountError"));
      return;
    }
    const uniqueIds = new Set(trimmedSelection);
    if (uniqueIds.size !== trimmedSelection.length) {
      setError(t("winnerDuplicateError"));
      return;
    }
    const missingCustomer = trimmedSelection.some((id) => {
      const participant = detail.participants.find((entry) => entry.id === id);
      return !participant?.customerId;
    });
    if (missingCustomer) {
      setError(t("winnerClientRequired"));
      return;
    }
    try {
      setLoading(true);
      await api.tournaments.assignWinner({
        tournamentId: detail.tournament.id,
        participantIds: trimmedSelection,
        productNotes: winnerNotes.trim() || null
      });
      await refreshDetail();
      setWinnerSelection([]);
      setWinnerNotes("");
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      setError(mapError(message) ?? t("winnerError"));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCustomer = async () => {
    if (!detail?.tournament) {
      return;
    }
    const api = window.api;
    if (!api) {
      return;
    }
    const phone = quickPhone.trim();
    if (!phone) {
      setQuickError(t("quickContactError"));
      return;
    }
    try {
      setLoading(true);
      const now = new Date().toISOString();
      const customer: Customer = {
        id: crypto.randomUUID(),
        firstNames: quickFirstNames.trim(),
        lastNamePaternal: quickLastNamePaternal.trim(),
        lastNameMaternal: quickLastNameMaternal.trim(),
        birthDate: null,
        address: null,
        phone: phone || null,
        email: null,
        createdAt: now,
        updatedAt: now
      };

      const created = await api.customers.createCustomer(customer);
      if (quickContext === "participants") {
        await api.tournaments.addParticipant({
          tournamentId: detail.tournament.id,
          name: formatCustomerName(created),
          customerId: created.id
        });
        await refreshDetail();
        setParticipantQuery("");
        setParticipantResults([]);
        setParticipantCustomer(null);
      } else {
        setEntryCustomer(created);
        setEntryQuery("");
        setEntryResults([]);
      }
      setQuickModalOpen(false);
      setQuickError(null);
      setQuickFirstNames("");
      setQuickLastNamePaternal("");
      setQuickLastNameMaternal("");
      setQuickPhone("");
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      setError(mapError(message) ?? t("errorSave"));
    } finally {
      setLoading(false);
    }
  };

  const tabs = useMemo(
    () => [
      { id: "details" as const, label: t("tabDetails") },
      { id: "participants" as const, label: t("tabParticipants") },
      { id: "sales" as const, label: t("tabSeatSales") },
      { id: "winners" as const, label: t("tabWinners") }
    ],
    []
  );

  const entryPaymentOptions = useMemo(
    () => [
      { value: "EFECTIVO" as const, label: t("paymentCash") },
      { value: "TRANSFERENCIA" as const, label: t("paymentTransfer") },
      { value: "TARJETA" as const, label: t("paymentCard") },
      { value: "CREDITO_TIENDA" as const, label: t("paymentStoreCredit") }
    ],
    []
  );

  if (!tournamentId) {
    return <div className="text-sm text-zinc-400">{t("detailEmpty")}</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="px-0 text-white hover:bg-transparent hover:text-zinc-200"
        >
          {t("backAction")}
        </Button>
      </div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
          <p className="text-sm text-zinc-400">{t("subtitle")}</p>
        </div>
        <div className="text-xs text-zinc-400">
          {statusLabel(detail?.tournament.status ?? "DRAFT")}
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabKey)}
        className="space-y-4"
      >
        <TabsList className="flex flex-wrap justify-start gap-2 bg-transparent">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 data-[state=active]:border-accent-500 data-[state=active]:bg-accent-500/10 data-[state=active]:text-white"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {loading ? <div className="text-sm text-zinc-400">{t("loading")}</div> : null}
        {error ? <div className="text-sm text-rose-300">{error}</div> : null}
        {message ? <div className="text-sm text-emerald-300">{message}</div> : null}

        <TabsContent value="details">
          <section className="rounded-2xl border border-white/10 bg-base-900 p-4">
          <div className="mb-4 text-sm font-semibold text-white">{t("formTitle")}</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("nameLabel")}
              </label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="border-white/10 bg-base-900 text-white"
                disabled={isClosed}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("gameLabel")}
              </label>
                <Select
                  value={gameTypeId}
                  onValueChange={(value) => {
                    setGameTypeId(value);
                    setExpansionId("none");
                  }}
                  disabled={isClosed}
                >
                <SelectTrigger className="border-white/10 bg-base-900 text-white">
                  <SelectValue placeholder={t("gameTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-base-900 text-white">
                  <SelectItem value="none">{t("gameTypePlaceholder")}</SelectItem>
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
                  {t("expansionLabel")}
                </label>
                <Select
                  value={expansionId}
                  onValueChange={(value) => setExpansionId(value)}
                  disabled={isClosed || gameTypeId === "none"}
                >
                  <SelectTrigger className="border-white/10 bg-base-900 text-white">
                    <SelectValue placeholder={t("expansionPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-base-900 text-white">
                    <SelectItem value="none">{t("expansionEmpty")}</SelectItem>
                    {expansions.map((expansion) => (
                      <SelectItem key={expansion.id} value={expansion.id} disabled={!expansion.active}>
                        {expansion.name}
                        {!expansion.active ? ` (${t("expansionInactive")})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {t("dateLabel")}
                </label>
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="border-white/10 bg-base-900 text-white"
                disabled={isClosed}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("capacityLabel")}
              </label>
              <Input
                value={maxCapacity}
                onChange={(event) => setMaxCapacity(event.target.value)}
                className="border-white/10 bg-base-900 text-white"
                disabled={isClosed}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("entryPriceLabel")}
              </label>
              <Input
                value={entryPrice}
                onChange={(event) => setEntryPrice(event.target.value)}
                className="border-white/10 bg-base-900 text-white"
                disabled={isClosed}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("prizeTypeLabel")}
              </label>
              <Select
                value={prizeType}
                onValueChange={(value) => setPrizeType(value as TournamentPrizeType)}
                disabled={isClosed}
              >
                <SelectTrigger className="border-white/10 bg-base-900 text-white">
                  <SelectValue placeholder={t("prizeTypeLabel")} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-base-900 text-white">
                  <SelectItem value="STORE_CREDIT">{t("prizeTypeCredit")}</SelectItem>
                  <SelectItem value="PRODUCT">{t("prizeTypeProduct")}</SelectItem>
                  <SelectItem value="MIXED">{t("prizeTypeMixed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("winnerCountLabel")}
              </label>
              <Input
                type="number"
                min={1}
                max={8}
                value={winnerCount}
                onChange={(event) => setWinnerCount(event.target.value)}
                className="border-white/10 bg-base-900 text-white"
                disabled={isClosed}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("prizeValueLabel")}
              </label>
              <Input
                value={prizeValue}
                className="border-white/10 bg-base-900 text-white"
                disabled
                readOnly
              />
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-semibold text-white">{t("prizeDistributionLabel")}</div>
            <div className="grid gap-3 md:grid-cols-2">
              {prizeDistribution.map((value, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {t("prizePositionLabel")} #{index + 1}
                  </label>
                  <Input
                    value={value}
                    onChange={(event) =>
                      setPrizeDistribution((current) =>
                        current.map((entry, idx) => (idx === index ? event.target.value : entry))
                      )
                    }
                    className="border-white/10 bg-base-900 text-white"
                    disabled={isClosed}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={saveTournament}
              disabled={isClosed}
              className="bg-accent-500 text-black hover:bg-accent-600"
            >
              {t("updateAction")}
            </Button>
            {!isClosed ? (
              <Button
                type="button"
                onClick={openTournament}
                disabled={isOpen}
                variant="outline"
                className="border-white/10 text-white hover:border-white/30"
              >
                {t("openAction")}
              </Button>
            ) : null}
            {!isClosed ? (
              <Button
                type="button"
                onClick={closeTournament}
                variant="outline"
                className="border-white/10 text-white hover:border-white/30"
              >
                {t("closeAction")}
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={deleteTournament}
              variant="outline"
              className="border-rose-500/50 text-rose-200 hover:border-rose-400"
            >
              {t("deleteAction")}
            </Button>
          </div>
        </section>
        </TabsContent>

        <TabsContent value="participants">
          <section className="rounded-2xl border border-white/10 bg-base-900 p-4">
          <div className="mb-3 text-sm font-semibold text-white">{t("participantsTitle")}</div>
          {capacityFull ? (
            <div className="mb-3 text-xs text-amber-300">{t("capacityFull")}</div>
          ) : null}
          <div className="grid gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("participantCustomerLabel")}
              </label>
              <Input
                value={participantQuery}
                onChange={(event) => setParticipantQuery(event.target.value)}
                placeholder={t("participantSearchPlaceholder")}
                className="border-white/10 bg-base-900 text-white"
                disabled={isClosed}
              />
              {participantResults.length > 0 ? (
                <div className="max-h-32 overflow-y-auto rounded-xl border border-white/10 bg-base-900">
                  {participantResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        setParticipantCustomer(customer);
                        setParticipantQuery("");
                        setParticipantResults([]);
                      }}
                      className="flex w-full flex-col gap-1 border-b border-white/5 px-3 py-2 text-left text-xs text-white last:border-b-0 hover:bg-white/5"
                    >
                      <span>{formatCustomerName(customer)}</span>
                      <span className="text-zinc-400">
                        {customer.phone ?? customer.email ?? ""}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              {participantQuery.trim() && participantResults.length === 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setQuickContext("participants");
                    setQuickModalOpen(true);
                    setQuickError(null);
                  }}
                  className="border-white/10 text-white hover:border-white/30"
                  disabled={isClosed}
                >
                  {t("quickRegisterAction")}
                </Button>
              ) : null}
              {participantCustomer ? (
                <Card className="border-white/10 bg-base-950/40 px-3 py-2 text-xs text-zinc-200">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    {t("customerSelectedLabel")}
                  </div>
                  <div>{formatCustomerName(participantCustomer)}</div>
                </Card>
              ) : null}
            </div>
          </div>
          <div className="mt-4">
            <Button
              type="button"
              onClick={addParticipant}
              disabled={isClosed || capacityFull}
              className="bg-accent-500 text-black hover:bg-accent-600"
            >
              {t("participantAddAction")}
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {detail?.participants.length === 0 ? (
              <div className="text-sm text-zinc-400">{t("participantsEmpty")}</div>
            ) : (
              detail?.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-base-950/40 px-3 py-2 text-xs text-white"
                >
                  <div>
                    <div>{participant.name}</div>
                    <div className="text-[10px] text-zinc-400">
                      {participant.customerId
                        ? participantContacts[participant.customerId]?.phone ??
                          participantContacts[participant.customerId]?.email ??
                          ""
                        : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeParticipant(participant.id)}
                    disabled={isClosed}
                    className={`rounded-lg px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                      isClosed
                        ? "cursor-not-allowed text-zinc-500"
                        : "text-rose-200 hover:text-rose-100"
                    }`}
                  >
                    {t("removeAction")}
                  </button>
                </div>
              ))
            )}
          </div>
          </section>
        </TabsContent>

        <TabsContent value="sales">
          <section className="rounded-2xl border border-white/10 bg-base-900 p-4">
          <div className="mb-3 text-sm font-semibold text-white">{t("entryTitle")}</div>
          <div className="grid gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("entryNameLabel")}
              </label>
              <Input
                value={entryQuery}
                onChange={(event) => setEntryQuery(event.target.value)}
                placeholder={t("participantSearchPlaceholder")}
                className="border-white/10 bg-base-900 text-white"
                disabled={isClosed || capacityFull}
              />
              {entryResults.length > 0 ? (
                <div className="max-h-32 overflow-y-auto rounded-xl border border-white/10 bg-base-900">
                  {entryResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        setEntryCustomer(customer);
                        setEntryQuery("");
                        setEntryResults([]);
                      }}
                      className="flex w-full flex-col gap-1 border-b border-white/5 px-3 py-2 text-left text-xs text-white last:border-b-0 hover:bg-white/5"
                    >
                      <span>{formatCustomerName(customer)}</span>
                      <span className="text-zinc-400">
                        {customer.phone ?? customer.email ?? ""}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              {entryQuery.trim() && entryResults.length === 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setQuickContext("sales");
                    setQuickModalOpen(true);
                    setQuickError(null);
                  }}
                  className="border-white/10 text-white hover:border-white/30"
                  disabled={isClosed || capacityFull}
                >
                  {t("quickRegisterAction")}
                </Button>
              ) : null}
              {entryCustomer ? (
                <Card className="border-white/10 bg-base-950/40 px-3 py-2 text-xs text-zinc-200">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    {t("customerSelectedLabel")}
                  </div>
                  <div>{formatCustomerName(entryCustomer)}</div>
                </Card>
              ) : null}
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("entryPaymentLabel")}
              </label>
              <Select
                value={entryMethod}
                onValueChange={(value) => setEntryMethod(value as PaymentMethod)}
                disabled={isClosed || capacityFull}
              >
                <SelectTrigger className="border-white/10 bg-base-900 text-white">
                  <SelectValue placeholder={t("entryPaymentLabel")} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-base-900 text-white">
                  {entryPaymentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("entryReferenceLabel")}
              </label>
              <Input
                value={entryReference}
                onChange={(event) => setEntryReference(event.target.value)}
                className="border-white/10 bg-base-900 text-white"
                disabled={isClosed || capacityFull}
              />
            </div>
          </div>
          {requiresProof(entryMethod) ? (
            <div className="mt-4 flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("entryProofLabel")}
              </label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => setEntryProof(event.target.files?.[0] ?? null)}
                className="border-white/10 bg-base-900 text-xs text-white"
                disabled={isClosed || capacityFull}
              />
            </div>
          ) : null}
          <div className="mt-4 text-xs text-zinc-400">
            {detail ? formatMoney(detail.tournament.entryPrice.amount) : null}
          </div>
          <div className="mt-3">
            <Button
              type="button"
              onClick={sellEntry}
              disabled={isClosed || capacityFull}
              className="bg-accent-500 text-black hover:bg-accent-600"
            >
              {t("entryAction")}
            </Button>
          </div>
          </section>
        </TabsContent>

        <TabsContent value="winners">
          <section className="rounded-2xl border border-white/10 bg-base-900 p-4">
          <div className="mb-3 text-sm font-semibold text-white">{t("winnerTitle")}</div>
          {detail?.prizes.length ? (
            <div className="space-y-2">
              {detail.prizes.map((prize) => {
                const participant = detail.participants.find(
                  (entry) => entry.id === prize.participantId
                );
                return (
                  <div
                    key={prize.id}
                    className="rounded-xl border border-white/10 bg-base-900 px-3 py-2 text-xs text-white"
                  >
                    <div>
                      {t("prizePositionLabel")} #{prize.position} - {participant?.name ?? ""}
                    </div>
                    {prize.creditAmount ? (
                      <div className="text-zinc-400">{formatMoney(prize.creditAmount.amount)}</div>
                    ) : null}
                    {prize.productNotes ? (
                      <div className="text-zinc-400">{prize.productNotes}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-zinc-400">{t("winnerEmpty")}</div>
          )}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {winnerSelection.map((_value, index) => (
              <div key={index} className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {t("prizePositionLabel")} #{index + 1}
                </label>
                <select
                  value={winnerSelection[index] ?? ""}
                  onChange={(event) =>
                    setWinnerSelection((current) =>
                      current.map((entry, idx) => (idx === index ? event.target.value : entry))
                    )
                  }
                  className="rounded-xl border border-white/10 bg-base-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">{t("winnerSelectLabel")}</option>
                  {detail?.participants.map((participant) => (
                    <option
                      key={participant.id}
                      value={participant.id}
                      disabled={!participant.customerId}
                    >
                      {participant.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("winnerNotesLabel")}
            </label>
            <Input
              value={winnerNotes}
              onChange={(event) => setWinnerNotes(event.target.value)}
              className="border-white/10 bg-base-900 text-white"
            />
          </div>
          <div className="mt-3">
            <Button
              type="button"
              onClick={assignWinner}
              disabled={!isClosed || !winnerSelectionValid}
              className="bg-accent-500 text-black hover:bg-accent-600"
            >
              {t("winnerAssignAction")}
            </Button>
          </div>
          </section>
        </TabsContent>
      </Tabs>

      <Dialog
        open={quickModalOpen}
        onOpenChange={(open) => {
          setQuickModalOpen(open);
          if (!open) {
            setQuickError(null);
          }
        }}
      >
        <DialogContent className="border-white/10 bg-base-900 text-white">
          <DialogHeader>
            <DialogTitle>{t("quickModalTitle")}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {t("participantCustomerLabel")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("quickFirstNamesLabel")}
              </label>
              <Input
                value={quickFirstNames}
                onChange={(event) => setQuickFirstNames(event.target.value)}
                className="border-white/10 bg-base-900 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("quickLastNamePaternalLabel")}
              </label>
              <Input
                value={quickLastNamePaternal}
                onChange={(event) => setQuickLastNamePaternal(event.target.value)}
                className="border-white/10 bg-base-900 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("quickLastNameMaternalLabel")}
              </label>
              <Input
                value={quickLastNameMaternal}
                onChange={(event) => setQuickLastNameMaternal(event.target.value)}
                className="border-white/10 bg-base-900 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("quickPhoneLabel")}
              </label>
              <Input
                value={quickPhone}
                onChange={(event) => setQuickPhone(event.target.value)}
                className="border-white/10 bg-base-900 text-white"
              />
            </div>
          </div>
          {quickError ? <div className="text-xs text-rose-300">{quickError}</div> : null}
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              onClick={handleQuickCustomer}
              className="bg-accent-500 text-black hover:bg-accent-600"
            >
              {t("quickSaveAction")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuickModalOpen(false);
                setQuickError(null);
              }}
              className="border-white/10 text-white hover:border-white/30"
            >
              {t("quickCancelAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

