import type { FaseGuia, MensajeGuia } from "@/hooks/useMedicoGuia";

/** Textos y estilos solo para UI — no afectan la lógica del flujo. */

export type PresentacionAgente = {
  nombre: string;
  subtitulo: string;
  avatar: string;
  bubbleClass: string;
  badgeClass: string;
};

export function presentacionAgente(agente?: MensajeGuia["agente"]): PresentacionAgente | null {
  if (agente === "triaje") {
    return {
      nombre: "Guía Farmacia Viva",
      subtitulo: "Te escucho con calma",
      avatar: "🌿",
      bubbleClass:
        "border-forest/12 bg-gradient-to-br from-white via-white to-mint-light/40 shadow-md shadow-forest/5",
      badgeClass: "bg-forest/8 text-forest",
    };
  }
  if (agente === "plantas") {
    return {
      nombre: "Especialista en plantas",
      subtitulo: "Recomendación del catálogo",
      avatar: "🍵",
      bubbleClass:
        "border-sun-gold/35 bg-gradient-to-br from-cream/80 via-white to-sun-gold/10 shadow-md shadow-sun-gold/10",
      badgeClass: "bg-sun-gold/20 text-forest",
    };
  }
  if (agente === "sistema") {
    return {
      nombre: "Farmacia Viva",
      subtitulo: "Empecemos juntos",
      avatar: "✨",
      bubbleClass:
        "border-leaf-bright/20 bg-gradient-to-br from-white to-botanical shadow-sm",
      badgeClass: "bg-leaf-bright/10 text-leaf-bright",
    };
  }
  return null;
}

export type ProgresoVisual = {
  pasoActual: 1 | 2 | 3;
  titulo: string;
  detalle: string | null;
};

/** Unifica árbol + triaje en un solo paso visual (sin mostrar «triaje»). */
export function progresoVisual(fase: FaseGuia | null, ruta: string[]): ProgresoVisual | null {
  if (!fase) return null;

  if (fase === "arbol" || fase === "triaje") {
    const detalle =
      ruta.length > 0
        ? ruta[ruta.length - 1]
        : "Cuéntame con tus palabras — estoy aquí para ayudarte";
    return {
      pasoActual: 1,
      titulo: "Conversando contigo",
      detalle,
    };
  }
  if (fase === "recomendacion") {
    return {
      pasoActual: 2,
      titulo: "Explorando el catálogo",
      detalle: "Buscando plantas que puedan acompañarte",
    };
  }
  if (fase === "fin") {
    return {
      pasoActual: 3,
      titulo: "Tu guía está lista",
      detalle: null,
    };
  }
  return null;
}

export const PASOS_PROGRESO = [
  { id: 1, icono: "💬", label: "Platícame" },
  { id: 2, icono: "🔍", label: "Catálogo" },
  { id: 3, icono: "🌱", label: "Tu guía" },
] as const;

export function placeholderEntrada(fase: FaseGuia | null, enFlujoGuia: boolean): string {
  if (enFlujoGuia || fase === "triaje" || fase === "arbol") {
    return "Escribe aquí lo que sientes o lo que quieras contarme…";
  }
  if (fase === "fin") {
    return "¿Otra planta? ¿Un nuevo malestar? Escríbelo aquí…";
  }
  return "Ej.: Me duele la nariz · ¿Para qué sirve el achiote?";
}

export function mensajeCargando(fase: FaseGuia | null, enFlujoGuia: boolean): string {
  if (enFlujoGuia || fase === "arbol" || fase === "triaje") {
    return "Un momento, sigo contigo…";
  }
  return "Consultando el catálogo de plantas…";
}
