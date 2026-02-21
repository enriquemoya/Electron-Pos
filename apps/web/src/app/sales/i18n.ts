export const esMX = {
  title: "Historial de ventas",
  subtitle: "Consulta ventas y comprobantes.",
  filtersTitle: "Filtros",
  filterDateLabel: "Fecha",
  filterDateToday: "Hoy",
  filterDateLast7: "Últimos 7 días",
  filterDateCustom: "Personalizado",
  filterFromLabel: "Desde",
  filterToLabel: "Hasta",
  filterPaymentLabel: "Método de pago",
  filterProofLabel: "Comprobante",
  filterCustomerLabel: "Cliente",
  filterCustomerPlaceholder: "Buscar cliente",
  filterAll: "Todos",
  filterPending: "Pendientes",
  filterAttached: "Adjuntos",
  backAction: "← Volver",
  clearFilters: "Limpiar filtros",
  methodCash: "Efectivo",
  methodTransfer: "Transferencia",
  methodCard: "Tarjeta",
  methodStoreCredit: "Crédito de tienda",
  tableTicket: "Ticket",
  tableDate: "Fecha",
  tableTotal: "Total",
  tableMethod: "Método",
  tableProof: "Comprobante",
  proofPending: "Comprobante pendiente",
  proofAttached: "Comprobante adjunto",
  emptyState: "No hay resultados.",
  detailTitle: "Detalle de venta",
  detailItems: "Productos",
  quantityLabel: "Cantidad",
  detailPayment: "Pago",
  detailReference: "Referencia",
  detailCustomer: "Cliente",
  detailCustomerEmpty: "No disponible",
  attachProof: "Adjuntar comprobante",
  attachProofHint: "Imagen o PDF",
  reprintTicket: "Reimprimir ticket",
  errorLoad: "No se pudieron cargar las ventas.",
  errorAttach: "No se pudo adjuntar el comprobante.",
  loading: "Cargando...",
  pageLabel: "Página {page} de {total}",
  prevPage: "Anterior",
  nextPage: "Siguiente",
  pageSizeLabel: "{size} por página"
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
