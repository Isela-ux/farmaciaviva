import { streamText, type UIMessage } from "ai";
import { buscarContextoRAG, construirPromptSistema, modeloChat } from "@/lib/rag";
import { DEEPSEEK_PROVIDER_OPTIONS, tieneClaveDeepSeek } from "@/lib/ai-config";
import { evaluarFiltroEntrada } from "@/lib/filtro-entrada-agente";
import { registrarEventoAgente } from "@/lib/agente-observabilidad";

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
    msg.includes("Cuota") ||
    msg.includes("insufficient")
  ) {
    return "Cuota de DeepSeek agotada. Espera 1 minuto e intenta de nuevo.";
  }
  if (msg.includes("API key") || msg.includes("API_KEY") || msg.includes("401")) {
    return "Configura DEEPSEEK_API_KEY en las variables de entorno.";
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

  if (!tieneClaveDeepSeek()) {
    return new Response(
      JSON.stringify({
        error: "Configura DEEPSEEK_API_KEY en las variables de entorno.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const filtro = evaluarFiltroEntrada(consulta);
  if (!filtro.permitido) {
    registrarEventoAgente(
      filtro.razon === "prompt_injection" ? "filtro_injection" : "filtro_off_topic",
      { fuente: "api_chat" }
    );
    return new Response(JSON.stringify({ error: filtro.mensaje, filtro: filtro.razon }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const mensajesChat = messages.map((m) => ({
    role: m.role,
    content: textoDeMensaje(m),
  }));

  const contexto = await buscarContextoRAG(consulta, { mensajes: mensajesChat });
  registrarEventoAgente("rag_contexto", {
    fuente: "api_chat",
    fragmentos: contexto.length,
    especies: contexto.map((c) => c.id_especie).filter(Boolean),
  });
  const system = construirPromptSistema(contexto);

  try {
    const result = streamText({
      model: modeloChat(),
      maxRetries: 0,
      providerOptions: DEEPSEEK_PROVIDER_OPTIONS,
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
    registrarEventoAgente("error_api", { fuente: "api_chat", mensaje });
    console.error("[api/chat]", mensaje);
    return new Response(JSON.stringify({ error: mensaje }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
