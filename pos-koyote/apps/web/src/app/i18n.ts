export const esMX = {
  appName: "Koyote POS",
  sidebarEyebrow: "Punto de venta",
  sidebarActiveBadge: "Ahora",
  sidebarInactiveBadge: "Ir",
  sidebarFooter: "Modo local activo.",
  navDashboard: "Panel",
  navProducts: "Productos",
  navNewSale: "Nueva venta",
  navInventory: "Inventario",
  navSales: "Ventas",
  navTournaments: "Torneos",
  navCustomers: "Clientes",
  navReports: "Reportes",
  navSettings: "Configuracion",
  metadataTitle: "Koyote POS",
  metadataDescription: "POS local para tienda TCG"
} as const;

export type Dictionary = typeof esMX;
export type DictionaryKey = keyof Dictionary;

export function t(key: DictionaryKey): string {
  return esMX[key];
}
