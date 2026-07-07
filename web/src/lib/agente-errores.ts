export const MAX_REINTENTOS_AGENTE = 3;

export const MENSAJE_ERROR_TRIAJE =
  "No se pudo continuar el triaje. Intenta de nuevo en unos segundos.";

export const MENSAJE_ERROR_RECOMENDACION =
  "No se pudo generar la orientación y plantas. Escribe «muéstrame las plantas» para reintentar.";

export const MENSAJE_ERROR_CONSULTA_PLANTA =
  "No se pudo consultar la planta en el catálogo.";

export function mensajeEscalamientoPorFallos(intentos: number): string {
  if (intentos < MAX_REINTENTOS_AGENTE) {
    return "";
  }
  return `No pude completar la consulta después de varios intentos. **Intenta de nuevo** en un momento o, si tu malestar es urgente, **busca atención médica** (en México: **911**).`;
}

export function debeEscalarPorFallos(intentos: number): boolean {
  return intentos >= MAX_REINTENTOS_AGENTE;
}
