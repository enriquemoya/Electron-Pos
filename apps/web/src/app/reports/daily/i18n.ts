export const esMX = {
  title: "Reporte diario",
  subtitle: "Resumen de ventas y caja por día.",
  dateLabel: "Fecha",
  summaryTitle: "Resumen del día",
  totalSales: "Total de ventas",
  salesCount: "Número de ventas",
  pendingProofs: "Comprobantes pendientes",
  paymentBreakdown: "Totales por método de pago",
  methodCash: "Efectivo",
  methodTransfer: "Transferencia",
  methodCard: "Tarjeta",
  methodStoreCredit: "Crédito de tienda",
  creditSummary: "Resumen de crédito",
  creditGranted: "Crédito otorgado",
  creditUsed: "Crédito usado",
  shiftsTitle: "Turnos del día",
  shiftId: "Turno",
  shiftOpened: "Apertura",
  shiftClosed: "Cierre",
  shiftOpeningAmount: "Inicial",
  shiftExpected: "Esperado",
  shiftReal: "Real",
  shiftDifference: "Diferencia",
  salesListTitle: "Ventas del día",
  salesTicket: "Ticket",
  salesTime: "Hora",
  salesTotal: "Total",
  salesMethod: "Método",
  emptySales: "No hay ventas este día.",
  emptyShifts: "No hay turnos este día.",
  generatePdf: "Generar PDF",
  openPdf: "Abrir PDF",
  loading: "Cargando...",
  errorLoad: "No se pudo cargar el reporte.",
  errorPdf: "No se pudo generar el PDF.",
  warningDifference: "Diferencias en caja detectadas."
} as const;

export type Dictionary = typeof esMX;
export type DictionaryKey = keyof Dictionary;

export function t(key: DictionaryKey): string {
  return esMX[key];
}
