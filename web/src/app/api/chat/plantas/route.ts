import type { MensajeConversacion } from "@/lib/rag";
import { buscarContextoRAG } from "@/lib/rag";
import { buscarPlantasParaTarjetas, obtenerPlantasPorIds } from "@/lib/plants";
import { plantasMencionadasParaTarjetas } from "@/lib/validar-salida-plantas";
import { registrarEventoAgente } from "@/lib/agente-observabilidad";

export async function POST(req: Request) {
  const body = await req.json();
  const messages: MensajeConversacion[] = body.messages ?? [];

  const bodyConsulta = typeof body.consulta === "string" ? body.consulta.trim() : "";
  const ultimoUsuario = [...messages].reverse().find((m) => m.role === "user");
  const consulta = bodyConsulta || ultimoUsuario?.content?.trim() || "";

  const respuestaAsistente =
    typeof body.respuestaAsistente === "string" ? body.respuestaAsistente.trim() : "";

  const restringirAContextoRAG = body.restringirAContextoRAG === true;

  if (!consulta && !respuestaAsistente) {
    return Response.json({ plantas: [] });
  }

  let plantas = await buscarPlantasParaTarjetas(
    consulta,
    messages,
    respuestaAsistente || undefined
  );

  if (restringirAContextoRAG && respuestaAsistente) {
    const contexto = await buscarContextoRAG(consulta, { mensajes: messages, limite: 3 });
    const ids = contexto
      .map((c) => c.id_especie)
      .filter((id): id is number => Number.isFinite(id));
    const plantasContexto = await obtenerPlantasPorIds(ids);
    const filtradas = await plantasMencionadasParaTarjetas(respuestaAsistente, plantasContexto);
    if (filtradas.length > 0) {
      plantas = filtradas;
      registrarEventoAgente("validacion_salida", {
        fuente: "chat_plantas",
        tarjetas: filtradas.length,
        contexto: plantasContexto.length,
      });
    }
  }

  return Response.json({ plantas });
}
