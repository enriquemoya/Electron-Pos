const dictionary = {
  dbTitle: "Base de datos no disponible",
  dbDescription:
    "No se pudo abrir la base de datos local. Puedes restaurar un respaldo o reiniciar la aplicacion.",
  dataTitle: "Datos no validos",
  dataDescription:
    "Se encontro un problema con los datos. Regresa al inicio o reinicia la aplicacion.",
  renderTitle: "Error de interfaz",
  renderDescription:
    "La interfaz tuvo un fallo inesperado. Regresa al inicio o reinicia la aplicacion.",
  genericTitle: "Error inesperado",
  genericDescription:
    "Ocurrio un error inesperado. Regresa al inicio o reinicia la aplicacion.",
  backupsTitle: "Respaldos disponibles",
  backupsEmpty: "No hay respaldos disponibles.",
  backupsLast: "Ultimo respaldo",
  statusLabel: "Estado",
  sizeLabel: "Tamano",
  sizeUnitKb: "KB",
  sizeUnitMb: "MB",
  dateLabel: "Fecha",
  separator: "-",
  actionRestore: "Restaurar respaldo",
  actionHome: "Volver al inicio",
  actionRestart: "Reiniciar aplicacion",
  actionCreateBackup: "Crear respaldo ahora",
  confirmRestore:
    "Esta accion reemplazara los datos actuales. Deseas continuar con la restauracion?",
  confirmRestart: "Deseas reiniciar la aplicacion?",
  loading: "Cargando...",
  errorLoad: "No se pudo cargar la informacion de respaldos.",
  errorRestore: "No se pudo restaurar el respaldo."
} as const;

type DictionaryKey = keyof typeof dictionary;

export function t(key: DictionaryKey) {
  return dictionary[key];
}
