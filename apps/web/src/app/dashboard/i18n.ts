export const esMX = {
  title: "Panel",
  subtitle: "Resumen operativo del día.",
  loading: "Cargando...",
  errorLoad: "No se pudo cargar el panel.",
  emptyValue: "Sin datos",
  cardDateLabel: "Fecha",
  cardShiftLabel: "Caja",
  cardSalesCountLabel: "Ventas hoy",
  cardSalesTotalLabel: "Total hoy",
  shiftOpen: "Abierta",
  shiftClosed: "Cerrada",
  shiftNoOpen: "Sin apertura registrada",
  salesSummaryTitle: "Resumen de ventas",
  salesSummarySubtitle: "Totales del día por método de pago.",
  salesSummaryTotal: "Total vendido",
  salesSummaryAverage: "Ticket promedio",
  alertsTitle: "Alertas operativas",
  alertsSubtitle: "Acciones rápidas del inventario.",
  alertOutOfStock: "Sin stock",
  alertLowStock: "Stock bajo",
  alertEmpty: "Sin alertas",
  alertStockValue: "Stock {value}",
  proofsTitle: "Comprobantes pendientes",
  proofsSubtitle: "Ventas pendientes de comprobante.",
  proofsSaleLabel: "Venta {id}",
  tournamentAlertTitle: "Torneos pendientes",
  tournamentAlertSubtitle: "Torneos cerrados sin ganadores.",
  activityTitle: "Actividad reciente",
  activitySubtitle: "Últimos movimientos del día.",
  activityEmpty: "No hay actividad hoy.",
  paymentCash: "Efectivo",
  paymentTransfer: "Transferencia",
  paymentCard: "Tarjeta",
  paymentStoreCredit: "Crédito de tienda"
} as const;

export type Dictionary = typeof esMX;
export type DictionaryKey = keyof Dictionary;

export function t(key: DictionaryKey, params?: Record<string, string | number>): string {
  const template = esMX[key];
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce<string>((result, [token, value]) => {
    return result.replace(new RegExp(`\\{${token}\\}`, "g"), String(value));
  }, String(template));
}
