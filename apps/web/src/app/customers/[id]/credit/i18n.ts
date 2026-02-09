export const esMX = {
  title: "Crédito de tienda",
  subtitle: "Consulta y ajusta el saldo del cliente.",
  backAction: "? Volver",
  balanceLabel: "Saldo disponible",
  grantTitle: "Asignar crédito",
  amountLabel: "Monto",
  reasonLabel: "Motivo",
  reasonTournament: "Torneo",
  reasonEvent: "Evento",
  reasonManual: "Manual",
  grantAction: "Asignar crédito",
  amountPlaceholder: "0.00",
  historyTitle: "Movimientos",
  movementEmpty: "Sin movimientos registrados.",
  errorLoad: "No se pudo cargar el crédito.",
  errorGrant: "No se pudo asignar el crédito.",
  customerLabel: "Cliente",
  emptyValue: "No disponible"
} as const;

export type Dictionary = typeof esMX;
export type DictionaryKey = keyof Dictionary;

export function t(key: DictionaryKey): string {
  return esMX[key];
}
