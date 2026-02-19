export const esMX = {
  title: "Inventario",
  subtitle: "Revisa existencias y estados de stock.",
  filtersTitle: "Filtros",
  filterNameLabel: "Producto",
  filterNamePlaceholder: "Buscar por producto",
  filterGameLabel: "Juego",
  filterGameAll: "Todos",
  filterStockLabel: "Estado",
  filterStockAll: "Todos",
  stockNormal: "Normal",
  stockLow: "Stock bajo",
  stockOut: "Sin stock",
  clearFilters: "Limpiar filtros",
  loading: "Cargando...",
  emptyState: "No hay resultados.",
  tableProduct: "Producto",
  tableGame: "Juego",
  tableStock: "Existencias",
  tableStatus: "Estado",
  pageLabel: "Pagina {page} de {total}",
  prevPage: "Anterior",
  nextPage: "Siguiente",
  pageSizeLabel: "{size} por pagina",
  errorLoad: "No se pudo cargar el inventario."
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
