import {
  esConsultaPlantaDirecta,
  esExpresionDeMalestar,
  esRespuestaTriaje,
  encontrarNodoPorId,
} from "@/lib/arbol-padecimientos";

export type RazonFiltroEntrada = "off_topic" | "prompt_injection";

export type ResultadoFiltroEntrada =
  | { permitido: true }
  | { permitido: false; mensaje: string; razon: RazonFiltroEntrada };

const MENSAJE_OFF_TOPIC = `Solo puedo ayudarte con **salud, malestares y plantas medicinales** del catálogo de Farmacia Viva.

Si tienes un malestar, cuéntame cómo te sientes. Si buscas una planta, pregúntame por su nombre o uso.`;

const MENSAJE_PROMPT_INJECTION = `No puedo cambiar mis reglas de seguridad ni actuar fuera del rol educativo del Médico Virtual.

¿En qué malestar o planta del catálogo te gustaría que te oriente?`;

const PATRONES_OFF_TOPIC = [
  /\b(capital de|presidente de|quien gano|quién ganó|mundial de|bitcoin|criptomoneda)\b/i,
  /\b(receta de pastel|receta de pizza|tarea de|examen de|matematicas|matemáticas)\b/i,
  /\b(pelicula|película|serie de tv|netflix|videojuego|fortnite|minecraft)\b/i,
  /\b(quien invento|quién inventó|fecha de la independencia|revolucion mexicana)\b/i,
  /\b(programa en python|codigo en javascript|código en javascript|hazme un ensayo)\b/i,
];

const PATRONES_INJECTION = [
  /\b(ignora (tus|las) (instrucciones|reglas)|ignore (your|all) (instructions|rules))\b/i,
  /\b(olvida (tus|las) reglas|forget your rules|actua como si no|actúa como si no)\b/i,
  /\b(eres un medico real|eres un médico real|sin limites|sin límites|modo desarrollador)\b/i,
  /\b(jailbreak|dan mode|bypass|prompt injection|system prompt|prompt del sistema)\b/i,
  /\b(dime tu prompt|dime el prompt|muestra tu prompt|revela tu prompt|tus instrucciones internas)\b/i,
  /\b(no sigas las reglas|recomienda cualquier droga|receta medicamentos controlados)\b/i,
];

function normalizar(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/** ¿La entrada es un id de opción del árbol (ej. dolor-cabeza)? */
export function esOpcionArbolId(entrada: string): boolean {
  const t = entrada.trim();
  if (!t || /\s/.test(t)) return false;
  return Boolean(encontrarNodoPorId(t));
}

export type OpcionesFiltroEntrada = {
  enTriaje?: boolean;
  inicioGuia?: boolean;
};

/**
 * Filtro de entrada del agente (PDF: input guard / relevancia de dominio).
 * No bloquea respuestas de triaje, opciones del árbol ni consultas de plantas.
 */
export function evaluarFiltroEntrada(
  texto: string,
  opciones?: OpcionesFiltroEntrada
): ResultadoFiltroEntrada {
  const t = texto.trim();
  if (!t || t.length < 3) return { permitido: true };

  const norm = normalizar(t);

  for (const patron of PATRONES_INJECTION) {
    if (patron.test(norm)) {
      return { permitido: false, mensaje: MENSAJE_PROMPT_INJECTION, razon: "prompt_injection" };
    }
  }

  if (esOpcionArbolId(t)) return { permitido: true };
  if (esConsultaPlantaDirecta(t)) return { permitido: true };
  if (esExpresionDeMalestar(t)) return { permitido: true };
  if (opciones?.enTriaje && esRespuestaTriaje(t)) return { permitido: true };

  const parecePlantaOMedicina =
    /\b(planta|plantas|medicinal|manzanilla|hierba|infusion|infusión|preparacion|preparación|catalogo|catálogo)\b/i.test(
      norm
    ) || /\b(para que sirve|para qué sirve|como se prepara|cómo se prepara)\b/i.test(norm);

  if (parecePlantaOMedicina) return { permitido: true };

  if (opciones?.enTriaje && t.length <= 120) {
    return { permitido: true };
  }

  for (const patron of PATRONES_OFF_TOPIC) {
    if (patron.test(norm)) {
      return { permitido: false, mensaje: MENSAJE_OFF_TOPIC, razon: "off_topic" };
    }
  }

  if (!opciones?.inicioGuia && !opciones?.enTriaje && t.length < 8) {
    return { permitido: true };
  }

  if (
    opciones?.inicioGuia &&
    !esExpresionDeMalestar(t) &&
    !esConsultaPlantaDirecta(t) &&
    !parecePlantaOMedicina &&
    t.length > 20 &&
    /\b(quien|quién|que es el|qué es el|cuando|cuándo|donde|dónde|como funciona|cómo funciona)\b/i.test(
      norm
    ) &&
    !/\b(dolor|malestar|siento|duele|planta|medicinal|salud|nausea|náusea|fiebre|tos)\b/i.test(norm)
  ) {
    return { permitido: false, mensaje: MENSAJE_OFF_TOPIC, razon: "off_topic" };
  }

  return { permitido: true };
}
