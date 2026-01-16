export const esMX = {
  title: "Catalogo de juegos",
  subtitle: "Administra los tipos de juego usados en productos y torneos.",
  createAction: "Crear juego",
  editAction: "Editar",
  saveAction: "Guardar",
  cancelAction: "Cancelar",
  nameLabel: "Nombre",
  statusLabel: "Estado",
  activeLabel: "Activo",
  inactiveLabel: "Inactivo",
  modalCreateTitle: "Nuevo juego",
  modalEditTitle: "Editar juego",
  emptyState: "No hay juegos registrados.",
  loading: "Cargando...",
  errorLoad: "No se pudieron cargar los juegos.",
  errorSave: "No se pudo guardar el juego.",
  errorName: "Falta el nombre del juego."
} as const;

export type Dictionary = typeof esMX;
export type DictionaryKey = keyof Dictionary;

export function t(key: DictionaryKey): string {
  return esMX[key];
}
