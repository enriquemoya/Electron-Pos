import type { Money } from "./money";

export type TournamentStatus = "DRAFT" | "OPEN" | "CLOSED";
export type TournamentPrizeType = "STORE_CREDIT" | "PRODUCT" | "MIXED";

export type Tournament = {
  id: string;
  name: string;
  game: string;
  gameTypeId?: string | null;
  expansionId?: string | null;
  date: string;
  maxCapacity: number;
  entryPrice: Money;
  prizeType: TournamentPrizeType;
  prizeValue: Money;
  winnerCount: number;
  prizeDistribution: number[];
  status: TournamentStatus;
  createdAt: string;
  updatedAt: string;
};

export type TournamentParticipant = {
  id: string;
  tournamentId: string;
  name: string;
  customerId?: string | null;
  createdAt: string;
};

export type TournamentPrize = {
  id: string;
  tournamentId: string;
  participantId: string;
  position: number;
  prizeType: TournamentPrizeType;
  creditAmount?: Money | null;
  productNotes?: string | null;
  createdAt: string;
};

export function canAddParticipant(tournament: Tournament, currentCount: number): boolean {
  if (tournament.status === "CLOSED") {
    return false;
  }
  return currentCount < tournament.maxCapacity;
}

export function canAssignWinner(tournament: Tournament): boolean {
  return tournament.status === "CLOSED";
}
