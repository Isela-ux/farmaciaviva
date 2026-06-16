import { streamText, type UIMessage } from "ai";
import { buscarContextoRAG, construirPromptSistema, modeloChat } from "@/lib/rag";

export const maxDuration = 30;

function textoDeMensaje(m: UIMessage): string {
  return (
    m.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("") ?? ""
  );
}

function mensajeErrorAmigable(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    msg.includes("quota") ||
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("Cuota")
  ) {
    return "Cuota de Gemini agotada. Espera 1 minuto e intenta de nuevo.";
  }
  if (msg.includes("API key") || msg.includes("API_KEY")) {
    return "Configura GOOGLE_GENERATIVE_AI_API_KEY en las variables de entorno.";
  }
  return "No se pudo generar la respuesta. Intenta de nuevo en unos segundos.";
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const ultimoUsuario = [...messages].reverse().find((m) => m.role === "user");
  const consulta = ultimoUsuario ? textoDeMensaje(ultimoUsuario) : "";

  if (!consulta.trim()) {
    return new Response("Consulta vacía", { status: 400 });
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "Configura GOOGLE_GENERATIVE_AI_API_KEY en las variables de entorno.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const mensajesChat = messages.map((m) => ({
    role: m.role,
    content: textoDeMensaje(m),
  }));

  const contexto = await buscarContextoRAG(consulta, { mensajes: mensajesChat });
  const system = construirPromptSistema(contexto);

  try {
    const result = streamText({
      model: modeloChat(),
      maxRetries: 1,
      system,
      messages: mensajesChat.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    });

    return result.toUIMessageStreamResponse({
      onError: mensajeErrorAmigable,
    });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error desconocido";
    console.error("[api/chat]", mensaje);
    return new Response(JSON.stringify({ error: mensaje }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
