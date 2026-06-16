"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useRef, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AssistantMessage } from "@/components/AssistantMessage";

const SUGERENCIAS = [
  "¿Para qué se usa la manzanilla?",
  "Plantas para problemas digestivos",
  "¿Qué plantas tienen propiedades antiinflamatorias?",
];

function textoMensaje(m: UIMessage): string {
  return (
    m.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("") ?? ""
  );
}

export function ChatAssistant() {
  const finRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  );
  const { messages, sendMessage, status, error } = useChat({ transport });

  const cargando = status === "submitted" || status === "streaming";

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, cargando]);

  async function enviar(texto: string) {
    const t = texto.trim();
    if (!t || cargando) return;
    setInput("");
    await sendMessage({ text: t });
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[480px] flex-col rounded-2xl border border-forest/10 bg-card-white shadow-sm">
      <div className="border-b border-forest/10 px-5 py-4">
        <h1 className="text-lg font-semibold text-forest">Asistente Farmacia Viva</h1>
        <p className="text-sm text-earth-soft">
          Consultas asistidas con recuperación de contexto (RAG) sobre plantas medicinales.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-earth-soft">
              Pregunta sobre usos, propiedades o preparaciones. Las respuestas se basan en
              las fichas del catálogo.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  className="rounded-full border border-sage/40 bg-mint-light px-3 py-1.5 text-xs text-forest transition hover:bg-mint"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "user" ? (
              <div className="max-w-[85%] rounded-2xl bg-hero-green px-4 py-2.5 text-sm leading-relaxed text-white">
                <p className="whitespace-pre-wrap">{textoMensaje(m)}</p>
              </div>
            ) : (
              <div className="w-full max-w-[92%] space-y-2 rounded-2xl bg-mint-light/60 p-3 text-sm text-forest sm:max-w-[85%]">
                <AssistantMessage texto={textoMensaje(m)} />
              </div>
            )}
          </div>
        ))}

        {cargando && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-mint-light px-4 py-2.5 text-sm text-earth-soft">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-hero-green [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-hero-green [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-hero-green [animation-delay:300ms]" />
              </span>
              Buscando en el catálogo…
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-accent-coral/30 bg-accent-coral/10 px-4 py-3 text-sm text-accent-coral">
            {error.message.includes("API key") || error.message.includes("503")
              ? "Configura GOOGLE_GENERATIVE_AI_API_KEY en .env.local para activar el asistente."
              : error.message.includes("quota") ||
                  error.message.includes("Quota") ||
                  error.message.includes("Cuota") ||
                  error.message.includes("429")
                ? "Cuota de Gemini agotada. Espera 1 minuto e intenta de nuevo."
                : error.message && error.message !== "An error occurred."
                  ? error.message
                  : "No se pudo obtener respuesta. Recarga la página e intenta de nuevo."}
          </div>
        )}
        <div ref={finRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(input);
        }}
        className="flex gap-2 border-t border-forest/10 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu consulta…"
          disabled={cargando}
          className="flex-1 rounded-xl border border-forest/15 px-4 py-2.5 text-sm outline-none ring-hero-green/30 focus:ring-2 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={cargando || !input.trim()}
          className="rounded-xl bg-hero-green px-4 py-2.5 text-sm font-medium text-white transition hover:bg-leaf-bright disabled:opacity-50"
        >
          Enviar
        </button>
      </form>

      <p className="border-t border-forest/5 px-4 py-2 text-center text-xs text-earth-soft">
        Información educativa — no sustituye consejo médico.{" "}
        <Link href="/catalogo" className="underline hover:text-forest">
          Ver catálogo
        </Link>
      </p>
    </div>
  );
}
