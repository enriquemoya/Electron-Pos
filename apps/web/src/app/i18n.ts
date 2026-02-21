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
  terminalAlreadyActivatedError: "Esta terminal ya fue activada. Genera una nueva llave en admin.",
  terminalRevokedError: "Esta terminal fue revocada. Regenera una llave para volver a activarla.",
  terminalFingerprintMismatchError: "La llave esta ligada a otro dispositivo. Regenera una nueva llave.",
  pinTitle: "Ingreso de empleado",
  pinDescription: "Ingresa tu PIN de 6 digitos para continuar.",
  pinLabel: "PIN",
  pinPlaceholder: "******",
  pinClear: "Limpiar",
  pinBackspace: "Borrar",
  pinSubmit: "Ingresar",
  pinSubmitting: "Validando...",
  pinInvalidError: "PIN incorrecto.",
  pinForbiddenError: "Usuario inactivo o bloqueado.",
  pinBranchError: "PIN no permitido en esta sucursal.",
  sessionExpiredError: "Sesion expirada. Inicia sesion de nuevo.",
  permissionDeniedTitle: "Acceso restringido",
  permissionDeniedDescription: "Tu rol no tiene permisos para esta seccion.",
  metadataTitle: "Koyote POS",
  metadataDescription: "POS local para tienda TCG"
} as const;

export type Dictionary = typeof esMX;
export type DictionaryKey = keyof Dictionary;

export function t(key: DictionaryKey): string {
  return esMX[key];
}
