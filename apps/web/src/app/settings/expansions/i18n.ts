export const esMX = {
  title: "Juegos y expansiones",
  subtitle: "Administra las expansiones por juego.",
  gameTypeFilterLabel: "Juego",
  gameTypeFilterPlaceholder: "Selecciona un juego",
  createAction: "Crear expansión",
  editAction: "Editar",
  deactivateAction: "Desactivar",
  deleteAction: "Eliminar",
  tableName: "Nombre",
  tableCode: "Código",
  tableRelease: "Lanzamiento",
  tableStatus: "Estado",
  tableActions: "Acciones",
  statusActive: "Activa",
  statusInactive: "Inactiva",
  emptyState: "Sin expansiones registradas.",
  loading: "Cargando...",
  modalCreateTitle: "Crear expansión",
  modalEditTitle: "Editar expansión",
  gameTypeLabel: "Juego",
  nameLabel: "Nombre",
  codeLabel: "Código",
  releaseLabel: "Fecha de lanzamiento",
  statusLabel: "Estado",
  saveAction: "Guardar",
  cancelAction: "Cancelar",
  errorLoad: "No se pudieron cargar las expansiones.",
  errorSave: "No se pudo guardar la expansión.",
  errorName: "Falta el nombre de la expansión.",
  errorGameType: "Selecciona un juego para continuar.",
  errorDeleteReferenced: "No se puede eliminar una expansión en uso. Desactívala en su lugar."
} as const;

export type Dictionary = typeof esMX;
export type DictionaryKey = keyof Dictionary;

export function t(key: DictionaryKey): string {
  return esMX[key];
}
