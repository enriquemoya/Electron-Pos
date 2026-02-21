export const esMX = {
  title: "Integraciones",
  subtitle: "Sincronizacion offline de catalogo y ventas POS.",
  driveTitle: "Motor de sincronizacion POS",
  driveDescription: "Reemplaza el flujo de Google Drive con snapshot, delta y cola local.",
  statusLabel: "Estado",
  terminalNotActivated: "Terminal no activada",
  terminalActive: "Terminal activa",
  terminalOffline: "Modo offline",
  branchLabel: "Sucursal",
  snapshotVersionLabel: "Version de snapshot",
  queueLabel: "Eventos en cola",
  refreshAction: "Actualizar estado",
  syncNowAction: "Sincronizar ahora",
  syncNowBusy: "Sincronizando...",
  syncNowDone: "Sincronizacion completada",
  syncNowFailed: "Sincronizacion fallida",
  reconcileAction: "Reconciliar",
  reconcileBusy: "Reconciliando...",
  reconcileDone: "Reconciliacion completada",
  reconcileFailed: "Reconciliacion fallida",
  lastSyncLabel: "Ultima sincronizacion",
  lastReconcileLabel: "Ultima reconciliacion",
  oldestQueuedLabel: "Evento mas antiguo en cola",
  notAvailable: "No disponible",
  helpLocalFirst:
    "La sucursal local es la fuente de verdad para operaciones offline.",
  desktopOnlyNotice: "Disponible solo en la app de escritorio.",
  desktopOnlyAction: "Abre Koyote POS Desktop para conectar."
} as const;

export type Dictionary = typeof esMX;
export type DictionaryKey = keyof Dictionary;

export function t(key: DictionaryKey): string {
  return esMX[key];
}
