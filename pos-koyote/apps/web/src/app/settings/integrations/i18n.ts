export const esMX = {
  title: "Integraciones",
  subtitle: "Sincroniza inventario con servicios externos.",
  driveTitle: "Google Drive",
  driveDescription: "Sincroniza el archivo Excel de productos como respaldo.",
  statusLabel: "Estado",
  statusNotConnected: "No conectado",
  statusConnected: "Conectado",
  statusUploading: "Subiendo",
  statusDownloading: "Descargando",
  statusConflict: "Conflicto",
  statusError: "Error",
  connectAction: "Conectar",
  connectPendingTitle: "Pendiente de verificacion",
  connectInstructions: "Abre el enlace y captura el codigo para autorizar.",
  connectUserCodeLabel: "Codigo",
  connectUrlLabel: "Enlace",
  connectFinishAction: "Finalizar conexion",
  copyLinkLabel: "Copiar enlace",
  copyLinkSuccess: "Enlace copiado",
  copyLinkError: "No se pudo copiar",
  selectFileAction: "Seleccionar Excel",
  selectedFileLabel: "Archivo seleccionado",
  noFileSelected: "Sin archivo",
  applyDriveAction: "Aplicar desde Drive",
  applyDriveNote: "Esto reemplaza precios y stock con los valores del Excel.",
  uploadAction: "Subir Excel",
  downloadAction: "Descargar Excel",
  refreshAction: "Actualizar estado",
  lastSyncLabel: "Ultima sincronizacion",
  lastUploadLabel: "Ultima subida",
  lastDownloadLabel: "Ultima descarga",
  conflictsLabel: "Conflictos",
  conflictsNone: "Sin conflictos",
  notAvailable: "No disponible",
  helpLocalFirst:
    "El inventario local es la fuente de verdad. La nube solo refleja cambios.",
  desktopOnlyNotice: "Disponible solo en la app de escritorio.",
  desktopOnlyAction: "Abre Koyote POS Desktop para conectar."
} as const;

export type Dictionary = typeof esMX;
export type DictionaryKey = keyof Dictionary;

export function t(key: DictionaryKey): string {
  return esMX[key];
}
