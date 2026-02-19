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
  terminalActivationTitle: "Activacion de terminal",
  terminalActivationDescription:
    "Ingresa la llave de activacion generada en el panel admin para habilitar este POS.",
  terminalActivationLabel: "Llave de activacion",
  terminalActivationPlaceholder: "Pega la llave aqui",
  terminalActivateAction: "Activar terminal",
  terminalActivatingAction: "Activando...",
  terminalActivatedMessage: "Terminal activada.",
  terminalNotActivatedMessage: "Terminal no activada.",
  terminalOfflineMessage: "Modo sin conexion. Ultima verificacion:",
  terminalRevokedMessage: "Terminal revocada. Reactiva para continuar.",
  terminalGenericError: "No se pudo completar la operacion.",
  terminalInvalidKeyError: "La llave de activacion no es valida.",
  terminalRateLimitedError: "Demasiados intentos. Intenta nuevamente en unos minutos.",
  metadataTitle: "Koyote POS",
  metadataDescription: "POS local para tienda TCG"
} as const;

export type Dictionary = typeof esMX;
export type DictionaryKey = keyof Dictionary;

export function t(key: DictionaryKey): string {
  return esMX[key];
}
