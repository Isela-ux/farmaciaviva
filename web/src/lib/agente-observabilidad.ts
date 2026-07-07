export type EventoAgente =
  | "guardrail_urgente"
  | "guardrail_precaucion"
  | "filtro_off_topic"
  | "filtro_injection"
  | "validacion_salida"
  | "rag_contexto"
  | "error_api"
  | "reintento_agotado";

export function registrarEventoAgente(
  evento: EventoAgente,
  datos?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === "production" && evento !== "guardrail_urgente") {
    return;
  }
  const payload = {
    ts: new Date().toISOString(),
    agente: "medico_virtual",
    evento,
    ...datos,
  };
  console.info("[agente]", JSON.stringify(payload));
}
