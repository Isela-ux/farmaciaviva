import type { MensajeConversacion } from "@/lib/rag";
import { buscarPlantasParaTarjetas } from "@/lib/plants";

export async function POST(req: Request) {
  const body = await req.json();
  const messages: MensajeConversacion[] = body.messages ?? [];

  const bodyConsulta = typeof body.consulta === "string" ? body.consulta.trim() : "";
  const ultimoUsuario = [...messages].reverse().find((m) => m.role === "user");
  const consulta = bodyConsulta || ultimoUsuario?.content?.trim() || "";

  const respuestaAsistente =
    typeof body.respuestaAsistente === "string" ? body.respuestaAsistente.trim() : "";

  if (!consulta && !respuestaAsistente) {
    return Response.json({ plantas: [] });
  }

  const plantas = await buscarPlantasParaTarjetas(
    consulta,
    messages,
    respuestaAsistente || undefined
  );
  return Response.json({ plantas });
}
