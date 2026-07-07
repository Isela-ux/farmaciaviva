import type { PadecimientoSeleccionado } from "@/lib/arbol-padecimientos";
import { evaluarGuardrailClinico, type ResultadoGuardrail } from "@/lib/guardrails-clinicos";

/** Nodos del árbol cuyo padecimiento implica revisión de alarma clínica. */
const PADECIMIENTOS_ALARMA_EN_ARBOL = [
  /\b(pecho|torax|tórax|cardiac)\b/i,
  /\b(respirar|ahogo|falta de aire)\b/i,
  /\b(sangrado|hemorragia)\b/i,
];

function padecimientoRequiereAlarma(padecimiento: string): boolean {
  return PADECIMIENTOS_ALARMA_EN_ARBOL.some((p) => p.test(padecimiento));
}

/**
 * Guardrail al llegar a una hoja del árbol o al elegir opción con texto clínico.
 * Complementa evaluarGuardrailClinico sin cambiar el flujo del árbol.
 */
export function evaluarGuardrailArbol(
  entradaUsuario: string,
  padecimiento?: PadecimientoSeleccionado | null
): ResultadoGuardrail | null {
  const partes = [entradaUsuario.trim()];
  if (padecimiento?.padecimiento) partes.push(padecimiento.padecimiento);
  if (padecimiento?.label) partes.push(padecimiento.label);

  const texto = partes.filter(Boolean).join("\n");
  const resultado = evaluarGuardrailClinico([{ role: "user", content: texto }]);

  if (resultado.nivel === "urgente") return resultado;

  if (padecimiento && padecimientoRequiereAlarma(padecimiento.padecimiento)) {
    const esPecho = /\b(pecho|torax|tórax|cardiac)\b/i.test(padecimiento.padecimiento);
    const contextoClinico = esPecho
      ? `dolor de pecho ${padecimiento.padecimiento} ${entradaUsuario}`
      : `malestar en ${padecimiento.padecimiento} ${entradaUsuario}`;
    const refuerzo = evaluarGuardrailClinico([{ role: "user", content: contextoClinico }]);
    if (refuerzo.nivel !== "ninguno") return refuerzo;
  }

  return resultado.nivel === "precaucion" ? resultado : null;
}
