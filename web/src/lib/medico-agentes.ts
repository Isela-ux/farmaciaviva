import type { PadecimientoSeleccionado } from "@/lib/arbol-padecimientos";
import type { PlantEmbedding } from "@/types/database";

/** Agente 1 — Especialista clínico: conversación guiada (máx. 3 preguntas). */
export function promptTriaje(
  pad: PadecimientoSeleccionado,
  turnosTriaje: number,
  respuestasPaciente: number
): string {
  if (respuestasPaciente >= 3) {
    return `Eres ${pad.especialista} del Médico Virtual de Farmacia Viva (recurso educativo, México).

PADECIMIENTO: ${pad.padecimiento}
RUTA: ${pad.ruta.join(" → ")}

El paciente ya respondió 3 veces. CIERRA la conversación ahora:
- En 1-2 frases resume lo esencial (intensidad, duración, síntomas asociados).
- Di explícitamente: «Con base en lo que me contaste, ahora te preparo una orientación y plantas del catálogo.»
- NO hagas ninguna pregunta nueva.
- NO des nombres de plantas ni preparaciones todavía (vendrán en el siguiente paso automático).
- OBLIGATORIO: termina con esta línea exacta en una línea aparte:
[TRIAJE_COMPLETO]`;
  }

  const enfoque =
    respuestasPaciente === 0
      ? "INTENSIDAD (leve, moderada o fuerte) y cómo afecta su día a día"
      : respuestasPaciente === 1
        ? "DURACIÓN (desde cuándo, constante o va y viene)"
        : "SÍNTOMAS ASOCIADOS o agravantes (fiebre, náusea, otros dolores, etc.)";

  return `Eres ${pad.especialista} del Médico Virtual de Farmacia Viva (recurso educativo, México).

PADECIMIENTO REPORTADO: ${pad.padecimiento}
RUTA DE SÍNTOMAS: ${pad.ruta.join(" → ")}
PREGUNTA ${turnosTriaje} DE MÁXIMO 3 — ENFOQUE: ${enfoque}

TU ROL:
- Lee TODO lo que el paciente ya dijo; NO repitas preguntas sobre datos que ya están en su mensaje.
- Si el padecimiento ya indica zona o tipo (ojos, digestión, luz solar, etc.), NO preguntes otra vez «qué parte del cuerpo».
- Si menciona dolor o molestia con la luz, el contexto es ocular (fotofobia) salvo que diga lo contrario.
- Si el paciente menciona otro dolor o zona (ej. «dolor abdominal», «también cabeza»), es una RESPUESTA — intégrala al mismo caso.
- Haz UNA sola pregunta breve, empática y clara sobre el ENFOQUE indicado arriba.
- NO recomiendes plantas, preparaciones ni medicamentos.
- NO des orientación clínica ni resumen todavía (eso viene después de las 3 respuestas).
- Tono cálido, español claro.
- PROHIBIDO escribir [TRIAJE_COMPLETO] mientras aún estés preguntando.`;
}

/** Agente 2 y 3 — Plantas + preparación, con contexto RAG. */
export function promptRecomendacion(
  pad: PadecimientoSeleccionado,
  contexto: PlantEmbedding[],
  notasTriaje: string
): string {
  const fragmentos = contexto
    .map((c) => {
      const nombre =
        (c.metadata?.nombre_comun as string | undefined) ||
        c.content.split("\n")[0]?.replace(/^Planta:\s*/, "") ||
        "Planta";
      return `### ${nombre}\n${c.content}`;
    })
    .join("\n\n");

  return `Eres un equipo de dos especialistas del Médico Virtual de Farmacia Viva (México).
Responde SOLO con información del CONTEXTO RECUPERADO. Español claro, máximo 280 palabras total.

PADECIMIENTO: ${pad.padecimiento}
ESPECIALISTA CLÍNICO: ${pad.especialista}
NOTAS DEL TRIAJE: ${notasTriaje || "Sin notas adicionales"}

FORMATO OBLIGATORIO (tres secciones con estos encabezados exactos):

## 💡 Orientación sobre tu malestar
- 2-4 frases claras sobre qué podría estar pasando según lo que contó el paciente (lenguaje educativo; NO es diagnóstico médico definitivo).
- Indica cuándo conviene acudir a un profesional de salud.
- Conecta el malestar con el contexto del triaje.

## 🌿 Especialista en plantas medicinales
- Viñetas (-) con 1 a 3 plantas del catálogo, usos y por qué podrían ayudar en este padecimiento.
- Solo plantas presentes en el contexto.

## 🫖 Especialista en preparación
- Viñetas (-) con forma de preparación, parte utilizada y vía (infusión, decocción, etc.) según el contexto.
- Incluye una advertencia breve de consultar a un profesional de salud.

CONTEXTO RECUPERADO:
${fragmentos || "(Sin coincidencias en el catálogo para esta consulta)"}`;
}

export function extraerTriajeCompleto(texto: string): {
  completo: boolean;
  textoLimpio: string;
  notasTriaje: string;
} {
  const completo = texto.includes("[TRIAJE_COMPLETO]");
  const textoLimpio = texto.replace(/\[TRIAJE_COMPLETO\]/g, "").trim();
  return { completo, textoLimpio, notasTriaje: textoLimpio };
}

export function contarTurnosTriaje(mensajes: { role: string; content: string }[]): number {
  return mensajes.filter((m) => m.role === "assistant").length;
}

/** Respuestas reales del paciente (sin el mensaje automático inicial del sistema). */
export function contarRespuestasPacienteTriaje(
  mensajes: { role: string; content: string }[]
): number {
  const usuarios = mensajes.filter((m) => m.role === "user");
  return Math.max(0, usuarios.length - 1);
}

/** Si el mensaje aún espera respuesta del paciente, no cerrar triaje. */
export function esPreguntaPendiente(texto: string): boolean {
  const t = texto.trim();
  if (!t) return false;
  if (t.includes("¿")) return true;
  if (/\?\s*$/.test(t)) return true;
  // Solo patrones interrogativos claros (evitar falsos positivos como «lo que me contaste»)
  return /(?:^|[.!]\s+)(?:podr[ií]as|puedes|me dices|cu[eé]ntame|cu[aá]l|cu[aá]ndo|cu[aá]nto|c[oó]mo|qu[eé] tal|tienes|sientes|presentas|hay)\b/i.test(
    t
  );
}

/** El asistente prometió orientación/plantas al cerrar la conversación. */
export function prometeRecomendacion(texto: string): boolean {
  return /\b(te preparo|preparo tu|preparo una|a continuaci[oó]n|orientaci[oó]n y plantas|plantas del cat[aá]logo)\b/i.test(
    texto
  );
}

/** El modelo cerró con resumen / transición a recomendación (aunque olvide el marcador). */
export function pareceCierreTriaje(texto: string): boolean {
  const t = texto.trim();
  if (!t || esPreguntaPendiente(t)) return false;
  if (t.includes("[TRIAJE_COMPLETO]")) return true;
  return (
    /\b(entend|resum|segun lo que|según lo que|con base en|por lo que|interpret|claro tu caso|preparo tu|te preparo|orientacion|orientación|a continuacion|a continuación|catalogo|catálogo)\b/i.test(
      t
    ) && t.length >= 40
  );
}

export function evaluarTriajeCompleto(
  texto: string,
  tieneMarcador: boolean,
  respuestasPaciente: number
): boolean {
  if (prometeRecomendacion(texto)) return true;
  if (esPreguntaPendiente(texto)) return false;
  if (respuestasPaciente >= 3) return true;
  if (tieneMarcador && respuestasPaciente >= 2) return true;
  if (respuestasPaciente >= 2 && pareceCierreTriaje(texto)) return true;
  return false;
}

/** ¿Debe lanzarse la recomendación tras este turno de triaje? */
export function debeGenerarRecomendacion(
  texto: string,
  respuestasPaciente: number,
  triajeCompletoApi = false
): boolean {
  if (triajeCompletoApi) return true;
  return evaluarTriajeCompleto(texto, texto.includes("[TRIAJE_COMPLETO]"), respuestasPaciente);
}
