import { generateText } from "ai";
import {
  consultaRAGDesdePadecimiento,
  type PadecimientoSeleccionado,
} from "@/lib/arbol-padecimientos";
import {
  contarRespuestasPacienteTriaje,
  contarTurnosTriaje,
  evaluarTriajeCompleto,
  extraerTriajeCompleto,
  promptRecomendacion,
  promptTriaje,
} from "@/lib/medico-agentes";
import { DEEPSEEK_PROVIDER_OPTIONS, tieneClaveDeepSeek } from "@/lib/ai-config";
import { buscarPlantasParaRecomendacion, obtenerPlantasPorIds } from "@/lib/plants";
import { buscarContextoRAG, chunksDesdePlantasCatalogo, construirPromptSistema, modeloChat } from "@/lib/rag";

export const maxDuration = 45;

function textoDeMensaje(m: { role: string; content: string }): string {
  return m.content?.trim() ?? "";
}

export async function POST(req: Request) {
  const body = await req.json();
  const fase = body.fase as "triaje" | "recomendacion" | "consulta_planta";
  const padecimiento = body.padecimiento as PadecimientoSeleccionado | undefined;
  const messages: { role: string; content: string }[] = body.messages ?? [];
  const notasTriajePrevias: string = body.notasTriaje ?? "";

  if (!tieneClaveDeepSeek()) {
    return new Response(
      JSON.stringify({ error: "Configura DEEPSEEK_API_KEY en las variables de entorno." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  if (fase === "consulta_planta") {
    const consulta = messages.at(-1)?.content?.trim() ?? "";
    if (!consulta) {
      return new Response(JSON.stringify({ error: "Consulta requerida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const plantasContextoIds = Array.isArray(body.plantasContextoIds)
      ? (body.plantasContextoIds as number[]).filter((id) => Number.isFinite(id))
      : [];

    const contexto = await buscarContextoRAG(consulta, {
      mensajes: messages,
      limite: 3,
      plantasContextoIds,
    });

    const { text } = await generateText({
      model: modeloChat(),
      maxRetries: 0,
      providerOptions: DEEPSEEK_PROVIDER_OPTIONS,
      system: construirPromptSistema(contexto),
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: textoDeMensaje(m),
      })),
    });

    return Response.json({
      texto: text,
      plantas: await obtenerPlantasPorIds(
        contexto.map((c) => c.id_especie).filter((id): id is number => Number.isFinite(id))
      ),
    });
  }

  if (!padecimiento?.padecimiento) {
    return new Response(JSON.stringify({ error: "Padecimiento requerido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (fase === "triaje") {
    const turnos = contarTurnosTriaje(messages);
    const respuestasPaciente = contarRespuestasPacienteTriaje(messages);
    const ultimoEsPaciente = messages.at(-1)?.role === "user";

    const { text } = await generateText({
      model: modeloChat(),
      maxRetries: 0,
      providerOptions: DEEPSEEK_PROVIDER_OPTIONS,
      system: promptTriaje(padecimiento, turnos + 1, respuestasPaciente),
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: textoDeMensaje(m),
      })),
    });

    const { completo: tieneMarcador, textoLimpio, notasTriaje } = extraerTriajeCompleto(text);
    const notas = notasTriajePrevias
      ? `${notasTriajePrevias}\n${notasTriaje}`
      : notasTriaje;

    const triajeCompleto =
      ultimoEsPaciente && evaluarTriajeCompleto(textoLimpio, tieneMarcador, respuestasPaciente);

    return Response.json({
      texto: textoLimpio,
      triajeCompleto,
      notasTriaje: notas,
    });
  }

  if (fase === "recomendacion") {
    const plantasRanked = await buscarPlantasParaRecomendacion(
      padecimiento,
      notasTriajePrevias,
      3
    );
    const contexto =
      plantasRanked.length > 0
        ? await chunksDesdePlantasCatalogo(plantasRanked)
        : await buscarContextoRAG(consultaRAGDesdePadecimiento(padecimiento, notasTriajePrevias), {
            limite: 3,
          });

    const { text } = await generateText({
      model: modeloChat(),
      maxRetries: 0,
      providerOptions: DEEPSEEK_PROVIDER_OPTIONS,
      system: promptRecomendacion(padecimiento, contexto, notasTriajePrevias),
      messages: [
        {
          role: "user",
          content: `Genera la recomendación de plantas y preparación para: ${padecimiento.padecimiento}`,
        },
      ],
    });

    return Response.json({
      texto: text,
      plantas: await obtenerPlantasPorIds(
        (plantasRanked.length > 0
          ? plantasRanked.map((p) => p.nombreComun.id_especie)
          : contexto.map((c) => c.id_especie)
        ).filter((id): id is number => Number.isFinite(id))
      ),
    });
  }

  return new Response(JSON.stringify({ error: "Fase no válida" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
