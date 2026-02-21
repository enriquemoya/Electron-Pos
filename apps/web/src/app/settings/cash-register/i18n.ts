export const esMX = {
  title: "Caja",
  subtitle: "Abre y cierra turnos de caja.",
  openTitle: "Abrir caja",
  openDescription: "Registra el efectivo inicial del turno.",
  openAmountLabel: "Efectivo inicial",
  openAmountPlaceholder: "0.00",
  openAction: "Abrir caja",
  activeTitle: "Caja abierta",
  openedAtLabel: "Hora de apertura",
  openingAmountLabel: "Monto inicial",
  salesTotalLabel: "Total de ventas",
  cashTotalLabel: "Total efectivo",
  transferTotalLabel: "Total transferencia",
  cardTotalLabel: "Total tarjeta",
  storeCreditTotalLabel: "Crédito tienda",
  expectedAmountLabel: "Esperado",
  closeTitle: "Cerrar caja",
  closeDescription: "Ingresa el efectivo contado para cerrar.",
  realAmountLabel: "Efectivo contado",
  realAmountPlaceholder: "0.00",
  differenceLabel: "Diferencia",
  closeAction: "Cerrar caja",
  historyTitle: "Historial de cortes",
  historyEmpty: "Aún no hay cortes registrados.",
  errorInvalidAmount: "Ingresa un monto válido.",
  errorLoad: "No se pudo cargar la caja.",
  errorOpen: "No se pudo abrir la caja.",
  errorClose: "No se pudo cerrar la caja.",
  noValue: "No disponible"
} as const;

export type Dictionary = typeof esMX;
export type DictionaryKey = keyof Dictionary;

export function t(key: DictionaryKey): string {
  return esMX[key];
}