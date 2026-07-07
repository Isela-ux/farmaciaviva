import { esConsultaPlantaDirecta, esExpresionDeMalestar } from "@/lib/arbol-padecimientos";
import { evaluarGuardrailClinico } from "@/lib/guardrails-clinicos";

/**
 * ¿Debe ir al flujo del Médico Virtual (árbol/triaje/guardrails) y no al chat libre RAG?
 */
export function debeEnrutarAMedicoVirtual(texto: string): boolean {
  if (esConsultaPlantaDirecta(texto)) return false;
  if (esExpresionDeMalestar(texto)) return true;
  const guardrail = evaluarGuardrailClinico([{ role: "user", content: texto }]);
  return guardrail.nivel !== "ninguno";
}
