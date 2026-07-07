/** Nodo del árbol de decisiones para la guía por síntomas. */
export type NodoPadecimiento = {
  id: string;
  label: string;
  /** Pregunta que muestra la UI en este nivel (si tiene hijos). */
  pregunta?: string;
  hijos?: NodoPadecimiento[];
  /** Resumen legible del padecimiento (solo hojas). */
  padecimiento?: string;
  /** Términos para recuperación RAG al llegar a la hoja. */
  terminosRAG?: string[];
  /** Especialista que atiende esta rama (canalización). */
  especialista?: string;
};

export type PadecimientoSeleccionado = {
  id: string;
  label: string;
  padecimiento: string;
  terminosRAG: string[];
  especialista: string;
  ruta: string[];
};

/**
 * Árbol inicial: Dolor → cabeza / estómago / menstrual / garganta.
 * Extensible sin afectar la consulta libre del Médico Virtual.
 */
export const ARBOL_PADECIMIENTOS: NodoPadecimiento = {
  id: "raiz",
  label: "Malestar",
  pregunta: "¿Qué tipo de malestar presentas?",
  hijos: [
    {
      id: "dolor",
      label: "Dolor",
      pregunta: "¿Qué tipo de dolor sientes?",
      especialista: "Especialista en dolor y malestar general",
      hijos: [
        {
          id: "dolor-cabeza",
          label: "De cabeza",
          padecimiento: "Dolor de cabeza",
          terminosRAG: ["dolor de cabeza", "cefalea", "migrana", "tension"],
          especialista: "Especialista en cefaleas",
        },
        {
          id: "dolor-estomago",
          label: "De estómago",
          padecimiento: "Dolor o malestar estomacal",
          terminosRAG: ["dolor estomago", "digestivo", "gastrico", "colico abdominal"],
          especialista: "Especialista en digestión",
        },
        {
          id: "dolor-menstrual",
          label: "Menstrual",
          padecimiento: "Dolor menstrual o cólicos",
          terminosRAG: ["dolor menstrual", "colico menstrual", "regla", "dismenorrea"],
          especialista: "Especialista en salud menstrual",
        },
        {
          id: "dolor-garganta",
          label: "De garganta",
          padecimiento: "Dolor de garganta o irritación faríngea",
          terminosRAG: ["dolor garganta", "faringitis", "tos", "irritacion garganta"],
          especialista: "Especialista en vías respiratorias superiores",
        },
      ],
    },
  ],
};

export function esHoja(nodo: NodoPadecimiento): boolean {
  return Boolean(nodo.padecimiento && nodo.terminosRAG?.length);
}

export function padecimientoDesdeNodo(
  nodo: NodoPadecimiento,
  ruta: string[]
): PadecimientoSeleccionado | null {
  if (!esHoja(nodo) || !nodo.padecimiento || !nodo.terminosRAG) return null;
  return {
    id: nodo.id,
    label: nodo.label,
    padecimiento: nodo.padecimiento,
    terminosRAG: nodo.terminosRAG,
    especialista: nodo.especialista ?? "Especialista clínico",
    ruta,
  };
}

export function consultaRAGDesdePadecimiento(
  pad: PadecimientoSeleccionado,
  notasTriaje?: string
): string {
  const base = `Plantas medicinales para ${pad.padecimiento.toLowerCase()}: ${pad.terminosRAG.join(", ")}`;
  if (!notasTriaje?.trim()) return base;
  return `${base}. Contexto del paciente: ${notasTriaje.trim()}`;
}

function normalizarEntrada(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** Síntomas que activan la guía conversacional sin decir «tengo dolor». */
const SINTOMAS_CONOCIDOS: Array<{
  patron: RegExp;
  id: string;
  label: string;
  padecimiento: string;
  terminosRAG: string[];
  especialista: string;
}> = [
  {
    patron: /\b(luz del sol|luz solar|luz brillante|fotofobia|fotosensibil|me molesta la luz|duelen con la luz|duele con la luz|sensible a la luz|me ciega la luz|con la luz)\b/,
    id: "sintoma-fotofobia",
    label: "Sensibilidad a la luz (ojos)",
    padecimiento: "Dolor o molestia en los ojos con exposición a la luz (fotofobia)",
    terminosRAG: ["fotofobia", "dolor ojos", "luz solar", "ocular", "oftalmologia"],
    especialista: "Especialista oftalmológico",
  },
  {
    patron: /\b(diarrea|deposiciones? liquidas|evacuaciones frecuentes)\b/,
    id: "sintoma-diarrea",
    label: "Diarrea",
    padecimiento: "Diarrea o deposiciones líquidas",
    terminosRAG: ["diarrea", "digestivo", "intestinal", "colitis"],
    especialista: "Especialista en digestión",
  },
  {
    patron: /\b(estrenimiento|estreñimiento|constipacion|constipación|no puedo defecar)\b/,
    id: "sintoma-estrenimiento",
    label: "Estreñimiento",
    padecimiento: "Estreñimiento o dificultad para evacuar",
    terminosRAG: ["estrenimiento", "constipacion", "digestivo", "intestinal"],
    especialista: "Especialista en digestión",
  },
  {
    patron: /\b(nausea|nauseas|vomito|vomitos|vómito|vómitos|ganas de vomitar|arcadas)\b/,
    id: "sintoma-nausea",
    label: "Náuseas o vómito",
    padecimiento: "Náuseas, vómito o malestar estomacal",
    terminosRAG: ["nausea", "vomito", "digestivo", "estomago"],
    especialista: "Especialista en digestión",
  },
  {
    patron: /\b(fiebre|calentura|temperatura alta|tengo calentura)\b/,
    id: "sintoma-fiebre",
    label: "Fiebre",
    padecimiento: "Fiebre o sensación de calentura",
    terminosRAG: ["fiebre", "febril", "antipiretico"],
    especialista: "Especialista clínico",
  },
  {
    patron: /\b(tos|toser|tos seca|tos con flema|flema)\b/,
    id: "sintoma-tos",
    label: "Tos",
    padecimiento: "Tos o irritación respiratoria",
    terminosRAG: ["tos", "respiratorio", "expectorante", "bronquial"],
    especialista: "Especialista en vías respiratorias",
  },
  {
    patron: /\b(gripa|gripe|resfriado|resfriada|congestion|congestión)\b/,
    id: "sintoma-gripa",
    label: "Gripe o resfriado",
    padecimiento: "Gripe, resfriado o congestión",
    terminosRAG: ["gripe", "resfriado", "congestion", "respiratorio"],
    especialista: "Especialista en vías respiratorias",
  },
  {
    patron: /\b(mareo|mareos|vertigo|vértigo|me mareo)\b/,
    id: "sintoma-mareo",
    label: "Mareo",
    padecimiento: "Mareo o vértigo",
    terminosRAG: ["mareo", "vertigo", "equilibrio"],
    especialista: "Especialista clínico",
  },
  {
    patron: /\b(acidez|agruras|reflujo|ardor estomacal)\b/,
    id: "sintoma-acidez",
    label: "Acidez estomacal",
    padecimiento: "Acidez, agruras o reflujo",
    terminosRAG: ["acidez", "agruras", "reflujo", "digestivo"],
    especialista: "Especialista en digestión",
  },
  {
    patron: /\b(infeccion vaginal|infección vaginal|flujo vaginal|picazon vaginal|picor vaginal|ardor vaginal|hongos vaginal|candidiasis)\b/,
    id: "sintoma-vaginal",
    label: "Infección o molestia vaginal",
    padecimiento: "Infección o molestia vaginal",
    terminosRAG: ["infeccion vaginal", "flujo", "ginecologico", "candidiasis"],
    especialista: "Especialista en salud ginecológica",
  },
];

function padecimientoDesdeSintoma(texto: string): PadecimientoSeleccionado | null {
  const t = normalizarEntrada(texto);
  for (const item of SINTOMAS_CONOCIDOS) {
    if (!item.patron.test(t)) continue;
    return {
      id: item.id,
      label: item.label,
      padecimiento: item.padecimiento,
      terminosRAG: item.terminosRAG,
      especialista: item.especialista,
      ruta: ["Malestar reportado", item.label],
    };
  }
  return null;
}

function textoMencionaSintoma(texto: string): boolean {
  const t = normalizarEntrada(texto);
  return SINTOMAS_CONOCIDOS.some((s) => s.patron.test(t));
}

function textoExpresaDolorOMalestar(texto: string): boolean {
  const t = normalizarEntrada(texto);
  return (
    /\b(me duele|me duelen|duele|duelen|doliendo|dolor|me molesta|me molestan|siento|me arde|me pica)\b/.test(
      t
    ) || /\b(han estado doliendo|estado doliendo|me han dolido|ultimamente me)\b/.test(t)
  );
}

/** Malestar vago sin zona corporal — debe mostrar opciones del árbol, no saltar a triaje. */
export function esMalestarGenericoVago(texto: string): boolean {
  const t = normalizarEntrada(texto);

  const tieneZonaCorporal =
    /\b(cabeza|estomago|estómago|garganta|pecho|diente|muela|nariz|oido|oído|espalda|menstrual|regla|abdominal|lumbar)\b/.test(
      t
    ) || textoMencionaSintoma(texto);

  if (tieneZonaCorporal) return false;

  if (
    /\b(no se que me pasa|no sé qué me pasa|no se que tengo|no sé qué tengo|no se que es|no sé qué es)\b/.test(
      t
    )
  ) {
    return true;
  }

  if (/\b(me siento mal|no me siento bien|me siento malo|me siento un poco mal)\b/.test(t)) {
    return true;
  }

  if (/\b(ando mal|estoy mal|me encuentro mal)\b/.test(t)) {
    return true;
  }

  if (/\b(me siento|me encuentro)\b/.test(t) && t.split(/\s+/).length <= 8) {
    return true;
  }

  return false;
}

/** Busca un nodo por id en el árbol. */
export function encontrarNodoPorId(
  id: string,
  raiz: NodoPadecimiento = ARBOL_PADECIMIENTOS
): NodoPadecimiento | null {
  if (raiz.id === id) return raiz;
  for (const hijo of raiz.hijos ?? []) {
    const found = encontrarNodoPorId(id, hijo);
    if (found) return found;
  }
  return null;
}

const SINONIMOS_NODO: Record<string, string[]> = {
  dolor: ["dolor", "duele", "dolencia", "malestar", "me duele", "tengo dolor", "siento dolor"],
  "dolor-cabeza": ["cabeza", "cefalea", "migrana", "migrana", "craneo", "de cabeza"],
  "dolor-estomago": ["estomago", "estómago", "barriga", "panza", "abdomen", "digestivo", "de estomago"],
  "dolor-menstrual": ["menstrual", "regla", "menstruacion", "menstruación", "colico", "cólico", "dismenorrea"],
  "dolor-garganta": ["garganta", "tragar", "faringe", "irritacion garganta", "irritación garganta", "de garganta"],
};

function coincideConNodo(texto: string, nodoId: string): boolean {
  const t = normalizarEntrada(texto);
  const sinonimos = SINONIMOS_NODO[nodoId] ?? [];
  return sinonimos.some((s) => t.includes(normalizarEntrada(s)));
}

export type ResultadoInterpretacion =
  | { tipo: "avanzar"; nodo: NodoPadecimiento; ruta: string[]; mensajeAsistente: string }
  | { tipo: "hoja"; padecimiento: PadecimientoSeleccionado; mensajeAsistente: string }
  | { tipo: "opciones"; mensajeAsistente: string; opciones: { id: string; label: string }[] }
  | { tipo: "no_entendido"; mensajeAsistente: string; opciones: { id: string; label: string }[] };

/** Malestar con parte del cuerpo descrita en texto libre (ej. «me duele la nariz»). */
export function padecimientoDesdeDescripcion(texto: string): PadecimientoSeleccionado | null {
  const desdeSintoma = padecimientoDesdeSintoma(texto);
  if (desdeSintoma) return desdeSintoma;

  const t = normalizarEntrada(texto);
  if (!textoExpresaDolorOMalestar(texto)) return null;

  const mapa: Array<{
    patron: RegExp;
    id: string;
    label: string;
    padecimiento: string;
    terminosRAG: string[];
    especialista: string;
  }> = [
    {
      patron: /\b(ojos?|ocular|vista|pupila|parpados?|párpados?)\b/,
      id: "dolor-ojos",
      label: "Ojos",
      padecimiento: "Dolor o molestia en los ojos",
      terminosRAG: ["dolor ojos", "ocular", "oftalmologia", "irritacion ocular"],
      especialista: "Especialista oftalmológico",
    },
    {
      patron: /\b(nariz|nasal|senos?|sinus)\b/,
      id: "dolor-nariz",
      label: "Nariz",
      padecimiento: "Dolor o malestar nasal",
      terminosRAG: ["dolor nasal", "nariz", "congestion", "sinusitis", "respiratorio"],
      especialista: "Especialista en vías respiratorias superiores",
    },
    {
      patron: /\b(oido|oído|oreja)\b/,
      id: "dolor-oido",
      label: "Oído",
      padecimiento: "Dolor de oído",
      terminosRAG: ["dolor oido", "otalgia", "oido"],
      especialista: "Especialista en otorrinolaringología",
    },
    {
      patron: /\b(muela|muelas|diente|dientes|mandibula|mandíbula)\b/,
      id: "dolor-dental",
      label: "Muelas o dientes",
      padecimiento: "Dolor dental o de muelas",
      terminosRAG: ["dolor dental", "muela", "diente", "odontalgia"],
      especialista: "Especialista en dolor orofacial",
    },
    {
      patron: /\b(espalda|lumbar|columna)\b/,
      id: "dolor-espalda",
      label: "Espalda",
      padecimiento: "Dolor de espalda",
      terminosRAG: ["dolor espalda", "lumbar", "lumbalgia"],
      especialista: "Especialista en dolor musculoesquelético",
    },
    {
      patron: /\b(pecho|torax|tórax)\b/,
      id: "dolor-pecho",
      label: "Pecho",
      padecimiento: "Dolor o molestia en el pecho",
      terminosRAG: ["dolor pecho", "toracico"],
      especialista: "Especialista clínico",
    },
  ];

  for (const item of mapa) {
    if (!item.patron.test(t)) continue;
    return {
      id: item.id,
      label: item.label,
      padecimiento: item.padecimiento,
      terminosRAG: item.terminosRAG,
      especialista: item.especialista,
      ruta: ["Malestar reportado", item.label],
    };
  }

  if (textoExpresaDolorOMalestar(texto) && !esMalestarGenericoVago(texto)) {
    const resumen = texto.trim().slice(0, 80);
    return {
      id: "malestar-libre",
      label: resumen.length > 40 ? `${resumen.slice(0, 40)}…` : resumen,
      padecimiento: resumen,
      terminosRAG: t.split(/\s+/).filter((w) => w.length >= 4).slice(0, 6),
      especialista: "Especialista clínico",
      ruta: ["Malestar reportado", resumen.length > 50 ? `${resumen.slice(0, 50)}…` : resumen],
    };
  }

  return null;
}

function opcionesDe(nodo: NodoPadecimiento): { id: string; label: string }[] {
  return (nodo.hijos ?? []).map((h) => ({ id: h.id, label: h.label }));
}

function mensajeCanalizacion(nodo: NodoPadecimiento, ruta: string[]): string {
  const esp = nodo.especialista ? `\n\nTe canalizo con **${nodo.especialista}**.` : "";
  return `${nodo.pregunta ?? "¿Podrías precisar un poco más?"}${esp}`;
}

function buscarHojaPorTexto(texto: string, raiz: NodoPadecimiento = ARBOL_PADECIMIENTOS): NodoPadecimiento | null {
  if (esHoja(raiz) && coincideConNodo(texto, raiz.id)) return raiz;
  for (const hijo of raiz.hijos ?? []) {
    const found = buscarHojaPorTexto(texto, hijo);
    if (found) return found;
  }
  return null;
}

/**
 * Interpreta texto libre o id de opción y avanza en el árbol.
 * Ej.: «Tengo dolor» → pregunta subtipo; «De cabeza» → hoja + triaje.
 */
export function interpretarEntradaGuia(
  entrada: string,
  nodoActualId: string,
  rutaActual: string[]
): ResultadoInterpretacion {
  const nodo = encontrarNodoPorId(nodoActualId) ?? ARBOL_PADECIMIENTOS;
  const texto = entrada.trim();
  const opciones = opcionesDe(nodo);

  if (!texto) {
    return {
      tipo: "opciones",
      mensajeAsistente: mensajeCanalizacion(nodo, rutaActual),
      opciones,
    };
  }

  const hijoPorId = (nodo.hijos ?? []).find((h) => h.id === texto);
  if (hijoPorId) {
    return resolverAvance(hijoPorId, [...rutaActual, hijoPorId.label]);
  }

  if (nodo.id === "raiz") {
    const hojaDirecta = buscarHojaPorTexto(texto);
    if (hojaDirecta) {
      const ruta = construirRutaHasta(hojaDirecta.id);
      return resolverAvance(hojaDirecta, ruta);
    }

    if (esExpresionDeMalestar(texto) && esMalestarGenericoVago(texto)) {
      return {
        tipo: "opciones",
        mensajeAsistente:
          "Gracias por contarme. **Todavía no te mostraré plantas** — primero necesito entender tu malestar.\n\n¿Qué sientes con más claridad? Puedes elegir una opción o describirlo:",
        opciones,
      };
    }

    const padecimientoEspecifico = padecimientoDesdeDescripcion(texto);
    if (padecimientoEspecifico && padecimientoEspecifico.id !== "malestar-libre") {
      return {
        tipo: "hoja",
        padecimiento: padecimientoEspecifico,
        mensajeAsistente: `Entendido: **${padecimientoEspecifico.padecimiento}**.\n\nSoy **${padecimientoEspecifico.especialista}**. Te haré unas preguntas breves antes de sugerir plantas del catálogo.`,
      };
    }

    for (const hijo of nodo.hijos ?? []) {
      if (coincideConNodo(texto, hijo.id)) {
        return resolverAvance(hijo, [...rutaActual, hijo.label]);
      }
    }

    if (esExpresionDeMalestar(texto)) {
      return {
        tipo: "opciones",
        mensajeAsistente:
          "Gracias por contarme. **Todavía no te mostraré plantas** — primero necesito entender tu malestar.\n\n¿Qué sientes con más claridad? Puedes elegir una opción o describirlo:",
        opciones,
      };
    }
  }

  const padecimientoLibre = padecimientoDesdeDescripcion(texto);
  if (padecimientoLibre) {
    return {
      tipo: "hoja",
      padecimiento: padecimientoLibre,
      mensajeAsistente: `Entendido: **${padecimientoLibre.padecimiento}**.\n\nSoy **${padecimientoLibre.especialista}**. Te haré unas preguntas breves antes de sugerir plantas del catálogo.`,
    };
  }

  if (nodo.hijos?.length) {
    for (const hijo of nodo.hijos) {
      if (coincideConNodo(texto, hijo.id) || normalizarEntrada(texto).includes(normalizarEntrada(hijo.label))) {
        return resolverAvance(hijo, [...rutaActual, hijo.label]);
      }
    }
  }

  return {
    tipo: "no_entendido",
    mensajeAsistente:
      "No identifiqué bien tu respuesta. Puedes elegir una opción o escribir con tus palabras, por ejemplo: «de cabeza», «menstrual» o «me duele la garganta».",
    opciones,
  };
}

function construirRutaHasta(idHoja: string): string[] {
  const path: string[] = [];
  function walk(nodo: NodoPadecimiento, acc: string[]): boolean {
    const next = [...acc, nodo.label];
    if (nodo.id === idHoja) {
      path.push(...next);
      return true;
    }
    for (const h of nodo.hijos ?? []) {
      if (walk(h, next)) return true;
    }
    return false;
  }
  walk(ARBOL_PADECIMIENTOS, []);
  return path;
}

function resolverAvance(nodo: NodoPadecimiento, ruta: string[]): ResultadoInterpretacion {
  if (esHoja(nodo)) {
    const pad = padecimientoDesdeNodo(nodo, ruta);
    if (!pad) {
      return {
        tipo: "no_entendido",
        mensajeAsistente: "Hubo un problema al registrar tu síntoma. Intenta de nuevo.",
        opciones: opcionesDe(ARBOL_PADECIMIENTOS),
      };
    }
    return {
      tipo: "hoja",
      padecimiento: pad,
      mensajeAsistente: `Entendido: **${pad.padecimiento}**.\n\nSoy **${pad.especialista}**. Para orientarte mejor con plantas del catálogo, necesito hacerte unas preguntas breves.`,
    };
  }

  return {
    tipo: "avanzar",
    nodo,
    ruta,
    mensajeAsistente: mensajeCanalizacion(nodo, ruta),
  };
}

export function mensajeBienvenidaGuia(): string {
  return `Gracias por contarme. **Primero te haré preguntas** para entender cómo te sientes; las plantas del catálogo las verás al final.`;
}

export function esPedidoOrientacionFinal(texto: string): boolean {
  const t = normalizarEntrada(texto);
  return (
    /\b(diagnostico|diagnóstico|que tengo|qué tengo|que me pasa|qué me pasa|que es lo que tengo|qué es lo que tengo|y ahora|que hago|qué hago|conclusion|conclusión|orientacion|orientación|valoracion|valoración|que significa|qué significa|que puede ser|qué puede ser|me puedes decir que|me puedes decir qué)\b/.test(
      t
    ) ||
    /\b(que me recomiend\w*|qué me recomiend\w*|dame tu opinion|dame tu opinión|que opinas|qué opinas)\b/.test(
      t
    )
  );
}

export function esPedidoRecomendacionPlantas(texto: string): boolean {
  const t = normalizarEntrada(texto);
  if (esPedidoOrientacionFinal(texto)) return true;
  if (
    /\b(recomiend\w*|sugier\w*|que plantas|qué plantas|cuales plantas|cuáles plantas|que puedo tomar|qué puedo tomar|que me sirve|qué me sirve|plantas para|que consumir|qué consumir)\b/.test(
      t
    ) &&
    /\b(para|tomar|consumir|ayude|ayudar|eso|este caso|mi caso|malestar|sintoma|síntoma|padecimiento|tengo|duele|duelen|con eso|me ayude)\b/.test(
      t
    )
  ) {
    return true;
  }
  return (
    /\b(ya dime las plantas|dame plantas|muestrame plantas|muéstrame plantas|quiero plantas|necesito plantas|pasar a plantas|recomendacion de plantas|recomendación de plantas)\b/.test(
      t
    ) || /\bque plantas me recomiend\w*\b/.test(t)
  );
}

export function esPreguntaSobreUsosPlanta(texto: string): boolean {
  const t = normalizarEntrada(texto);
  if (/\b(tengo|cargo|sufro|me duele|me siento|ultimamente me|me han estado)\b/.test(t)) {
    return false;
  }
  return (
    /\b(para que sirve|para qué sirve|para que malestares|para qué malestares|que malestares|qué malestares|que enfermedades|qué enfermedades|que padecimientos|qué padecimientos|que sintomas|qué síntomas|que sintomas|qué dolencias|que dolencias|usos medicinales|propiedades medicinales|beneficios medicinales|indicaciones medicinales)\b/.test(
      t
    ) ||
    (/\b(sirve para|ayuda con|ayuda en|trata|util para|útil para)\b/.test(t) &&
      /\b(malestar|malestares|enfermedad|padecimiento|sintoma|síntoma|dolor|dolencia)\b/.test(t))
  );
}

export function esConsultaSeguimientoPlanta(texto: string): boolean {
  const t = normalizarEntrada(texto);
  return (
    /\b(su|sus|esta|este|esa|ese|ello)\b/.test(t) ||
    /\b(modo de uso|modo de empleo|como se usa|cómo se usa|como se prepara|cómo se prepara|forma de uso|forma de preparaci[oó]n)\b/.test(
      t
    )
  );
}

export function esConsultaPlantaDirecta(texto: string): boolean {
  const t = normalizarEntrada(texto);
  if (esPedidoRecomendacionPlantas(texto)) return false;
  if (esPreguntaSobreUsosPlanta(texto)) return true;
  if (
    /\b(para que sirve|para qué sirve|como se prepara|cómo se prepara|que es|qué es|nombre cientifico|nombre científico|planta llamada|busco la planta|buscame una planta)\b/.test(
      t
    )
  ) {
    return true;
  }
  if (
    /\b(mas informacion|más informacion|mas info|más info|informacion del|información del|informacion de la|información de la|informacion sobre|información sobre|hablame del|háblame del|hablame de la|háblame de la|dime del|dime de la|cuentame del|cuéntame del|cuentame sobre|cuéntame sobre)\b/.test(
      t
    )
  ) {
    return true;
  }
  if (
    /\b(cuales plantas|cuáles plantas|qué plantas|que plantas)\b/.test(t) &&
    !/\b(recomiend|sugier|consumir|tomar|para eso|para mi|ayude)\b/.test(t)
  ) {
    return true;
  }
  return false;
}

/**
 * Detecta si el usuario describe un malestar (sin palabra clave fija).
 * Ej.: «me siento un poco mal», «ando mal», «me duele algo».
 */
export function esExpresionDeMalestar(texto: string): boolean {
  const t = normalizarEntrada(texto);
  if (!t || esConsultaPlantaDirecta(t) || esPreguntaSobreUsosPlanta(texto)) return false;

  for (const hijo of ARBOL_PADECIMIENTOS.hijos ?? []) {
    if (coincideConNodo(texto, hijo.id)) return true;
  }
  if (buscarHojaPorTexto(texto)) return true;

  const patrones = [
    "me siento",
    "no me siento",
    "me encuentro",
    "ando mal",
    "estoy mal",
    "un poco mal",
    "muy mal",
    "me molesta",
    "tengo dolor",
    "me duele",
    "me duelen",
    "doliendo",
    "duelen",
    "han estado doliendo",
    "ultimamente me",
    "siento dolor",
    "dolor de",
    "dolor en",
    "me arde",
    "me pica",
    "nausea",
    "nauseas",
    "vomito",
    "vómito",
    "estoy enferm",
    "me siento debil",
    "me siento débil",
    "me siento cansad",
    "ansiedad",
    "estres",
    "estrés",
    "no me siento bien",
    "tengo",
    "cargo",
    "sufro",
    "padezco",
    "presento",
  ];
  if (patrones.some((p) => t.includes(p))) return true;

  if (/\bmalestar\b/.test(t) && !/\bmalestares\b/.test(t)) return true;

  if (textoMencionaSintoma(texto)) return true;
  if (textoExpresaDolorOMalestar(texto)) return true;

  if (
    t.length <= 120 &&
    /\b(me|mi|mis)\b/.test(t) &&
    /\b(siento|tengo|duele|duelen|doliendo|molesta|mal|bien|encuentro|cargo|sufro|padezco)\b/.test(t)
  ) {
    return true;
  }

  if (
    t.length <= 80 &&
    /\b(tengo|cargo|sufro|padezco|presento)\b/.test(t) &&
    t.split(/\s+/).length <= 6
  ) {
    return true;
  }

  return false;
}

/** @deprecated alias — usar esExpresionDeMalestar */
export function debeIniciarGuiaSintomas(texto: string): boolean {
  return esExpresionDeMalestar(texto);
}

/** El usuario quiere salir de la consulta actual (nuevo tema o buscar planta). */
export function esIntencionSalirConsulta(texto: string): boolean {
  const t = normalizarEntrada(texto);
  return (
    /\b(otro malestar|otra consulta|nuevo malestar|nuevo sintoma|nuevo síntoma|empezar de nuevo|reiniciar|salir|cambiar tema|buscar planta|consultar planta|preguntar por una planta|modo planta|consulta libre)\b/.test(
      t
    ) || /^(nuevo|reiniciar|salir|cambiar)$/i.test(t.trim())
  );
}

/** Respuesta al triaje que nombra zona o tipo de dolor (ej. «dolor abdominal», «de cabeza también»). */
export function esRespuestaSintomaEnTriaje(texto: string): boolean {
  const t = normalizarEntrada(texto).trim();
  if (!t || t.length > 90) return false;

  if (/^dolor\b/.test(t) && t.split(/\s+/).length <= 6) return true;

  const respuestasCortas = [
    "abdominal",
    "estomago",
    "estómago",
    "cabeza",
    "garganta",
    "espalda",
    "pecho",
    "menstrual",
    "ocular",
    "ojos",
    "oido",
    "oído",
    "nariz",
    "lumbar",
    "digestivo",
  ];
  if (respuestasCortas.includes(t)) return true;
  if (respuestasCortas.some((z) => t === `dolor ${z}` || t === `de ${z}` || t === `en ${z}`)) return true;

  if (/^(en el|en la|en los|en las|del|de la|de)\b/.test(t) && t.split(/\s+/).length <= 8) return true;
  if (/\b(tambien|también|ademas|además|otro|otra|solo|solamente)\b/.test(t) && t.split(/\s+/).length <= 12) {
    return true;
  }

  if (/\b(acompañad\w*|acompanad\w*|junto con|ademas de|además de)\b/.test(t) && t.split(/\s+/).length <= 22) {
    return true;
  }
  if (/\b(con diarrea|con vomito|con vómito|o diarrea|o vomito|o vómito|y diarrea|y vomito|y vómito|diarrea y|vomito y|vómito y)\b/.test(t)) {
    return true;
  }
  if (/^(no|si|sí|nop|noup|no pues|pues si|pues no)\b/.test(t) && t.split(/\s+/).length <= 18) return true;

  return false;
}

/** Intento de manipular el agente — nunca tratar como respuesta de triaje. */
export function esIntentoManipulacionAgente(texto: string): boolean {
  const norm = normalizarEntrada(texto);
  return /\b(ignora|olvida|prompt|reglas|instrucciones|jailbreak|bypass|desarrollador|system)\b/.test(
    norm
  );
}

/** Respuesta breve al triaje (duración, intensidad, sí/no) — no un malestar nuevo. */
export function esRespuestaTriaje(texto: string): boolean {
  if (esIntentoManipulacionAgente(texto)) return false;
  if (esIntencionSalirConsulta(texto)) return false;
  if (esConsultaPlantaDirecta(texto)) return false;
  if (esPedidoRecomendacionPlantas(texto)) return false;
  if (esRespuestaSintomaEnTriaje(texto)) return true;

  const t = normalizarEntrada(texto);
  if (t.length <= 120) {
    if (/\b(acompañad\w*|acompanad\w*|con diarrea|con vomito|con vómito|o diarrea|o vomito|o vómito)\b/.test(t)) {
      return true;
    }
    if (/^(no|si|sí|no pues|pues)\b/.test(t) && t.split(/\s+/).length <= 18) return true;
  }

  if (padecimientoDesdeDescripcion(texto)) return false;

  if (t.length > 140) return false;

  if (
    /^(si|sí|no|tal vez|puede ser|un poco|mucho|moderado|leve|intenso|muy|bastante|nada|regular)\b/.test(
      t
    )
  ) {
    return true;
  }
  if (/\b(dia|dias|día|días|semana|semanas|mes|meses|hora|horas|minuto|minutos|desde|hace|ayer|hoy)\b/.test(t)) {
    return true;
  }
  if (/\b\d+\b/.test(t)) return true;
  if (
    t.split(/\s+/).length <= 8 &&
    !textoMencionaSintoma(texto) &&
    !/\b(que|qué|como|cómo|dime|dame|muestra|revela|cuál|cual|ignora|olvida|prompt|reglas)\b/.test(t)
  ) {
    return true;
  }

  return false;
}

/** Malestar distinto al padecimiento activo — solo si el paciente inicia consulta nueva explícita. */
export function esNuevoMalestarDistinto(
  texto: string,
  padecimientoActual: PadecimientoSeleccionado | null
): boolean {
  if (!padecimientoActual) return false;
  if (esRespuestaTriaje(texto) || esRespuestaSintomaEnTriaje(texto)) return false;
  if (esIntencionSalirConsulta(texto)) return false;

  const t = normalizarEntrada(texto);
  const iniciaConsultaNueva =
    /\b(tengo|cargo|sufro|padezco|ultimamente|desde hace|me han estado|me duele mucho|me siento)\b/.test(t);
  if (!iniciaConsultaNueva) return false;

  const nuevo = padecimientoDesdeDescripcion(texto);
  if (nuevo) return nuevo.id !== padecimientoActual.id;
  return esExpresionDeMalestar(texto);
}
