export const esMX = {
  title: "Configuracion",
  subtitle: "Preferencias de tienda y dispositivos.",
  storeTitle: "Configuracion de tienda",
  storeDescription: "Impuestos, recibos, roles y dispositivos.",
  cashRegisterTitle: "Caja",
  cashRegisterDescription: "Abrir y cerrar turnos de caja.",
  cashRegisterAction: "Abrir caja",
  integrationsTitle: "Integraciones",
  integrationsDescription: "Conecta servicios externos como Google Drive.",
  integrationsAction: "Abrir integraciones",
  gameTypesTitle: "Catalogo de juegos",
  gameTypesDescription: "Controla los tipos de juego usados en productos y torneos.",
  gameTypesAction: "Abrir catalogo",
  expansionsTitle: "Juegos y expansiones",
  expansionsDescription: "Administra los juegos y sus expansiones.",
  expansionsAction: "Abrir catalogo"
} as const;

export type Dictionary = typeof esMX;
export type DictionaryKey = keyof Dictionary;

export function t(key: DictionaryKey): string {
  return esMX[key];
}
