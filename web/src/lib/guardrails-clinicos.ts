/**
 * Guardrails clínicos — capa de seguridad del Médico Virtual.
 * Detecta síntomas de alarma y escala a atención profesional antes de recomendar plantas.
 */

export type NivelGuardrail = "ninguno" | "precaucion" | "urgente";

export type ResultadoGuardrail = {
  nivel: NivelGuardrail;
  motivos: string[];
  bloquearPlantas: boolean;
  mensajeEscalamiento: string;
  mensajePrecaucion?: string;
};

type ReglaGuardrail = {
  nivel: "urgente" | "precaucion";
  patron: RegExp;
  motivo: string;
};

const REGLAS: ReglaGuardrail[] = [
  // Urgente — atención médica presencial o emergencia
  { nivel: "urgente", patron: /\b(sangrado abundante|hemorragia|mucho sangrado|sangro mucho|perdi mucho sangre|pérdida abundante de sangre)\b/i, motivo: "sangrado abundante" },
  { nivel: "urgente", patron: /\b(dolor de pecho|dolor en el pecho|opresion en el pecho|opresión en el pecho|dolor toracico|dolor torácico)\b/i, motivo: "dolor en el pecho" },
  { nivel: "urgente", patron: /\b(no puedo respirar|dificultad para respirar|me ahogo|falta de aire|se me cierra la garganta)\b/i, motivo: "dificultad respiratoria" },
  { nivel: "urgente", patron: /\b(desmayo|desmaye|perdi el conocimiento|perdí el conocimiento|me desmaye|me desmayé)\b/i, motivo: "pérdida de conocimiento" },
  { nivel: "urgente", patron: /\b(convulsion|convulsión|convulsiones)\b/i, motivo: "convulsiones" },
  { nivel: "urgente", patron: /\b(dolor de cabeza muy fuerte|peor dolor de cabeza|dolor de cabeza repentino|dolor de cabeza intenso)\b/i, motivo: "cefalea intensa o súbita" },
  { nivel: "urgente", patron: /\b(embarazada|embarazo).{0,40}(sangr|dolor fuerte|perdida|pérdida)/i, motivo: "síntomas alarmantes en embarazo" },
  { nivel: "urgente", patron: /\b(sangr|dolor fuerte).{0,40}(embarazada|embarazo)/i, motivo: "síntomas alarmantes en embarazo" },
  { nivel: "urgente", patron: /\b(pensamiento suicida|quiero morir|hacerme dano|hacerme daño|no quiero vivir)\b/i, motivo: "riesgo para la vida" },

  // Precaución — consultar profesional pronto; plantas solo con advertencia fuerte
  { nivel: "precaucion", patron: /\b(sangrado|sangro|manchado|manchando|spotting)\b/i, motivo: "sangrado" },
  { nivel: "precaucion", patron: /\b(muy debil|muy débil|debilidad extrema|sin fuerzas|no puedo levantarme)\b/i, motivo: "debilidad marcada" },
  { nivel: "precaucion", patron: /\b(fiebre alta|fiebre de 39|fiebre de 40|temperatura muy alta|calentura fuerte)\b/i, motivo: "fiebre alta" },
  { nivel: "precaucion", patron: /\b(vomito constante|vómito constante|no puedo retener|vomito sin parar|vómito sin parar)\b/i, motivo: "vómito persistente" },
  { nivel: "precaucion", patron: /\b(dolor muy fuerte|dolor insoportable|dolor intenso|me duele muchisimo|me duele muchísimo)\b/i, motivo: "dolor muy intenso" },
  { nivel: "precaucion", patron: /\b(infeccion|infección).{0,30}(grave|empeora|pus|fiebre)/i, motivo: "posible infección grave" },
];

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function textoDesdeMensajes(
  mensajes: { role: string; content: string }[],
  extra?: string
): string {
  const partes = mensajes.filter((m) => m.role === "user").map((m) => m.content);
  if (extra?.trim()) partes.push(extra);
  return partes.join("\n");
}

function mensajeUrgente(motivos: string[]): string {
  const lista = motivos.map((m) => `• ${m}`).join("\n");
  return `## ⚠️ Atención médica recomendada

Por lo que describes (**${motivos.join(", ")}**), es importante que **consultes de inmediato** con un profesional de salud o acudas a urgencias si los síntomas empeoran.

${lista}

**Farmacia Viva es un recurso educativo** y **no sustituye** una valoración clínica presencial. En esta situación **no es seguro** basarse solo en plantas medicinales.

### Qué puedes hacer ahora
- Contacta a tu médico, una clínica o servicios de urgencia de tu localidad.
- Si el malestar es severo o empeora rápido, **llama a emergencias** (en México: **911**).
- Cuando estés estable y con orientación profesional, puedes volver aquí para preguntar por plantas del catálogo.

¿Hay algo más en lo que pueda orientarte de forma general mientras buscas atención?`;
}

function mensajePrecaucion(motivos: string[]): string {
  return `> **Aviso de seguridad:** Detectamos señales que requieren precaución (${motivos.join(", ")}). Consulta a un profesional de salud para descartar complicaciones. La información sobre plantas que sigue es **solo educativa** y no reemplaza una valoración médica.`;
}

/** Evalúa síntomas de alarma en el texto de la conversación. */
export function evaluarGuardrailClinico(
  mensajes: { role: string; content: string }[],
  textoAdicional?: string
): ResultadoGuardrail {
  const texto = normalizar(textoDesdeMensajes(mensajes, textoAdicional));
  if (!texto.trim()) {
    return { nivel: "ninguno", motivos: [], bloquearPlantas: false, mensajeEscalamiento: "" };
  }

  const urgentes = new Set<string>();
  const precauciones = new Set<string>();

  for (const regla of REGLAS) {
    if (!regla.patron.test(texto)) continue;
    if (regla.nivel === "urgente") urgentes.add(regla.motivo);
    else if (!urgentes.size) precauciones.add(regla.motivo);
  }

  if (urgentes.size > 0) {
    const motivos = [...urgentes];
    return {
      nivel: "urgente",
      motivos,
      bloquearPlantas: true,
      mensajeEscalamiento: mensajeUrgente(motivos),
    };
  }

  if (precauciones.size > 0) {
    const motivos = [...precauciones];
    return {
      nivel: "precaucion",
      motivos,
      bloquearPlantas: false,
      mensajeEscalamiento: "",
      mensajePrecaucion: mensajePrecaucion(motivos),
    };
  }

  return { nivel: "ninguno", motivos: [], bloquearPlantas: false, mensajeEscalamiento: "" };
}

/** Anteponer aviso de precaución a una recomendación con plantas (sin duplicar). */
export function aplicarPrecaucionATexto(
  texto: string,
  precaucion?: string
): string {
  if (!precaucion?.trim()) return texto;
  // La API /guia ya puede haber antepuesto el mismo aviso
  if (/aviso de seguridad/i.test(texto)) return texto;
  return `${precaucion}\n\n---\n\n${texto}`;
}
