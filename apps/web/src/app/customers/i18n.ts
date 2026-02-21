export const esMX = {
  title: "Clientes",
  subtitle: "Administra clientes y credito de tienda.",
  filtersTitle: "Filtros",
  filterNameLabel: "Nombre",
  filterPhoneLabel: "Telefono",
  filterEmailLabel: "Email",
  filterNamePlaceholder: "Buscar por nombre",
  filterPhonePlaceholder: "Buscar por telefono",
  filterEmailPlaceholder: "Buscar por email",
  clearFilters: "Limpiar filtros",
  createAction: "Crear cliente",
  editAction: "Editar",
  viewCreditAction: "Ver credito",
  loading: "Cargando...",
  emptyState: "No hay resultados.",
  tableName: "Cliente",
  tablePhone: "Telefono",
  tableEmail: "Email",
  tableActions: "Acciones",
  pageLabel: "Pagina {page} de {total}",
  prevPage: "Anterior",
  nextPage: "Siguiente",
  pageSizeLabel: "{size} por pagina",
  modalCreateTitle: "Crear cliente",
  modalEditTitle: "Editar cliente",
  firstNamesLabel: "Nombre(s)",
  lastNamePaternalLabel: "Apellido paterno",
  lastNameMaternalLabel: "Apellido materno",
  phoneLabel: "Telefono",
  emailLabel: "Email",
  saveAction: "Guardar",
  cancelAction: "Cancelar",
  errorContactRequired: "Debes registrar telefono o email.",
  errorPhoneDuplicate: "El telefono ya esta registrado.",
  errorEmailDuplicate: "El email ya esta registrado.",
  errorLoad: "No se pudieron cargar los clientes.",
  errorSave: "No se pudo guardar el cliente."
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
