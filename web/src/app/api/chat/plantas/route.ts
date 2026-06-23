import type { MensajeConversacion } from "@/lib/rag";
import { buscarPlantasParaTarjetas } from "@/lib/plants";

export async function POST(req: Request) {
  const body = await req.json();
  const messages: MensajeConversacion[] = body.messages ?? [];

  const ultimoUsuario = [...messages].reverse().find((m) => m.role === "user");
  const consulta = ultimoUsuario?.content?.trim() ?? "";

  if (!consulta) {
    return Response.json({ plantas: [] });
  }

  const plantas = await buscarPlantasParaTarjetas(consulta, messages);
  return Response.json({ plantas });
}
