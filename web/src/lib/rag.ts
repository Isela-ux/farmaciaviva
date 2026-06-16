import { embed } from "ai";
import { google } from "@ai-sdk/google";
import { createClient } from "@/lib/supabase/server";
import {
  buscarPlantasMencionadasEnTexto,
  buscarPlantasPorTexto,
  esConsultaDeSeguimiento,
  extraerTerminosBusqueda,
  obtenerFichaPlanta,
} from "@/lib/plants";
import { etiquetaUbicacion } from "@/lib/images";
import type { FichaPlanta, PlantaCatalogo, PlantEmbedding } from "@/types/database";

const EMBEDDING_MODEL = "gemini-embedding-001";
const CHAT_MODEL = "gemini-2.5-flash";

export type MensajeConversacion = { role: string; content: string };

export async function generarEmbedding(texto: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.textEmbeddingModel(EMBEDDING_MODEL),
    value: texto,
    providerOptions: {
      google: { outputDimensionality: 768 },
    },
  });
  return embedding;
}

function textoContextoDesdeFicha(ficha: FichaPlanta): string {
  const lineas: string[] = [];
  const nombre =
    ficha.nombresComunes[0]?.nombre_comun ||
    ficha.especie.nombre_cientifico ||
    `Especie #${ficha.especie.id_especie}`;

  lineas.push(`Planta: ${nombre}`);

  if (ficha.especie.nombre_cientifico) {
    lineas.push(`Nombre científico: ${ficha.especie.nombre_cientifico}`);
  }

  if (ficha.especie.descripcion_botanica) {
    lineas.push(`Descripción: ${ficha.especie.descripcion_botanica}`);
  }
  if (ficha.especie.origen_geografico) {
    lineas.push(`Origen geográfico: ${ficha.especie.origen_geografico}`);
  }

  if (ficha.ubicaciones.length > 0) {
    const lugares = ficha.ubicaciones
      .slice(0, 12)
      .map((eu) => {
        const ubi = ficha.catalogoUbicaciones.get(eu.id_ubicacion);
        const lugar = ubi ? etiquetaUbicacion(ubi) : `Ubicación #${eu.id_ubicacion}`;
        const detalles = [
          eu.es_nativa != null && (eu.es_nativa ? "nativa" : "no nativa"),
          eu.es_cultivada != null && (eu.es_cultivada ? "cultivada" : ""),
          eu.abundancia,
          eu.observaciones,
        ]
          .filter(Boolean)
          .join("; ");
        return detalles ? `${lugar} (${detalles})` : lugar;
      })
      .join("\n- ");
    lineas.push(`Ubicaciones reportadas:\n- ${lugares}`);
  }

  if (ficha.habitats.length > 0) {
    const habs = ficha.habitats
      .map((eh) => {
        const h = ficha.catalogoHabitats.get(eh.id_habitat);
        return h ? `${h.nombre_habitat}${h.descripcion ? `: ${h.descripcion}` : ""}` : null;
      })
      .filter(Boolean)
      .join("; ");
    if (habs) lineas.push(`Hábitat: ${habs}`);
  }

  if (ficha.usos.length > 0) {
    const usos = ficha.usos
      .map((u) => {
        const cat = u.id_categoria_uso
          ? ficha.categoriasUso.get(u.id_categoria_uso)?.nombre_categoria
          : null;
        const partes = [
          cat && `Categoría: ${cat}`,
          u.descripcion_uso,
          u.parte_utilizada && `Parte: ${u.parte_utilizada}`,
          u.forma_preparacion && `Preparación: ${u.forma_preparacion}`,
          u.via_administracion && `Vía: ${u.via_administracion}`,
          u.riesgos_contraindicaciones && `Riesgos: ${u.riesgos_contraindicaciones}`,
        ].filter(Boolean);
        return partes.join(". ");
      })
      .join("\n- ");
    lineas.push(`Usos medicinales:\n- ${usos}`);
  }

  if (ficha.propiedades.length > 0) {
    const props = ficha.propiedades
      .map((ep) => {
        const p = ficha.catalogoPropiedades.get(ep.id_propiedad);
        return p
          ? `${p.nombre_propiedad}${p.descripcion ? `: ${p.descripcion}` : ""}`
          : null;
      })
      .filter(Boolean)
      .join("; ");
    if (props) lineas.push(`Propiedades: ${props}`);
  }

  return lineas.join("\n");
}

async function chunksDesdePlantas(
  plantas: PlantaCatalogo[]
): Promise<PlantEmbedding[]> {
  const chunks: PlantEmbedding[] = [];

  for (const p of plantas) {
    const ficha = await obtenerFichaPlanta(p.nombreComun.id_especie);
    chunks.push({
      id: chunks.length,
      id_especie: p.nombreComun.id_especie,
      chunk_type: "ficha_completa",
      content: ficha
        ? textoContextoDesdeFicha(ficha)
        : `${p.nombreComun.nombre_comun} (${p.nombreCientifico ?? "sin nombre científico"})`,
      metadata: { nombre_comun: p.nombreComun.nombre_comun },
      similarity: 0.8,
    });
  }

  return chunks;
}

function unificarPlantas(...listas: PlantaCatalogo[][]): PlantaCatalogo[] {
  const ids = new Set<number>();
  const out: PlantaCatalogo[] = [];
  for (const lista of listas) {
    for (const p of lista) {
      if (ids.has(p.nombreComun.id_especie)) continue;
      ids.add(p.nombreComun.id_especie);
      out.push(p);
    }
  }
  return out;
}

/** Arma la consulta de recuperación usando todo el hilo, no solo el último mensaje. */
export function construirConsultaRAG(
  mensajes: MensajeConversacion[],
  consultaActual: string
): string {
  const recientes = mensajes.slice(-8).map((m) => m.content.trim()).filter(Boolean);
  const historial = recientes.join("\n");

  if (esConsultaDeSeguimiento(consultaActual) || extraerTerminosBusqueda(consultaActual).length === 0) {
    return historial;
  }

  return `${historial}\n${consultaActual}`;
}

export async function buscarContextoRAG(
  consulta: string,
  opciones?: { mensajes?: MensajeConversacion[]; limite?: number }
): Promise<PlantEmbedding[]> {
  const limite = opciones?.limite ?? 6;
  const mensajes = opciones?.mensajes ?? [];
  const consultaActual = consulta.trim();

  const textoConversacion = mensajes.map((m) => m.content).join("\n");
  const consultaExpandida = construirConsultaRAG(mensajes, consultaActual);

  const plantasMencionadas = await buscarPlantasMencionadasEnTexto(textoConversacion, limite);
  const plantasPorBusqueda = await buscarPlantasPorTexto(consultaExpandida, limite);
  const plantas = unificarPlantas(plantasMencionadas, plantasPorBusqueda);

  if (plantas.length > 0) {
    return chunksDesdePlantas(plantas.slice(0, limite));
  }

  const supabase = await createClient();

  try {
    const embedding = await generarEmbedding(consultaExpandida);
    const { data, error } = await supabase.rpc("match_plant_embeddings", {
      query_embedding: embedding,
      match_threshold: 0.45,
      match_count: limite,
    });

    if (!error && data?.length) {
      return data as PlantEmbedding[];
    }
  } catch {
    // Sin embeddings indexados
  }

  return [];
}

export function construirPromptSistema(contexto: PlantEmbedding[]): string {
  const fragmentos = contexto
    .map(
      (c, i) =>
        `[${i + 1}] Especie #${c.id_especie} (${c.chunk_type}):\n${c.content}`
    )
    .join("\n\n");

  return `Eres el asistente de Farmacia Viva, un recurso educativo sobre plantas medicinales de México.

REGLAS:
- Responde con base en el CONTEXTO RECUPERADO y en el historial de la conversación.
- Si el usuario hace una pregunta de seguimiento ("sus usos", "y dónde", "esa planta"), infiere de qué planta habla según mensajes anteriores y el contexto.
- Si el contexto incluye la planta, responde con esos datos; no digas que no está en el catálogo.
- Cita las fuentes numeradas [1], [2], etc. cuando uses información del contexto.
- No des consejos médicos definitivos; incluye advertencias sobre consultar a un profesional de salud.
- Responde en español, de forma clara y accesible.

CONTEXTO RECUPERADO:
${fragmentos || "(Sin coincidencias en el catálogo para esta consulta)"}`;
}

export function modeloChat() {
  return google(CHAT_MODEL);
}

export { CHAT_MODEL, EMBEDDING_MODEL };
