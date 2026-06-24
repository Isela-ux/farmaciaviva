"use client";



import { useChat } from "@ai-sdk/react";

import { DefaultChatTransport } from "ai";

import type { UIMessage } from "ai";

import { useRef, useEffect, useState, useMemo } from "react";

import Link from "next/link";

import { AssistantMessage } from "@/components/AssistantMessage";

import { MedicoVirtualPlantas } from "@/components/MedicoVirtualPlantas";

import type { PlantaMedicoVirtual } from "@/types/database";



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

async function buscarPlantasDelTurno(
  mensajes: { role: string; content: string }[],
  consulta: string,
  respuestaAsistente: string
): Promise<PlantaMedicoVirtual[]> {
  const res = await fetch("/api/chat/plantas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: mensajes,
      consulta,
      respuestaAsistente,
    }),
  });

  if (!res.ok) return [];

  const data = (await res.json()) as { plantas?: PlantaMedicoVirtual[] };
  return data.plantas ?? [];
}



export function ChatAssistant({

  plantaId,

  nombrePlanta,

  plantaInicial,

}: {

  plantaId?: number;

  nombrePlanta?: string;

  plantaInicial?: PlantaMedicoVirtual | null;

}) {

  const finRef = useRef<HTMLDivElement>(null);
  const plantasResueltasRef = useRef<Set<string>>(new Set());

  const [input, setInput] = useState("");

  const [plantasPorIndice, setPlantasPorIndice] = useState<
    Map<number, PlantaMedicoVirtual[]>
  >(new Map());

  const transport = useMemo(

    () => new DefaultChatTransport({ api: "/api/chat" }),

    []

  );

  const { messages, sendMessage, status, error } = useChat({ transport });



  const cargando = status === "submitted" || status === "streaming";



  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, cargando]);

  /** Tarjetas según la respuesta final del turno (no el historial previo). */
  useEffect(() => {
    if (cargando) return;

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (m.role !== "assistant") continue;
      if (plantasResueltasRef.current.has(m.id)) continue;

      const respuesta = textoMensaje(m).trim();
      if (!respuesta) continue;

      const consulta =
        i > 0 && messages[i - 1]?.role === "user"
          ? textoMensaje(messages[i - 1]).trim()
          : "";

      plantasResueltasRef.current.add(m.id);

      const historial = messages
        .slice(0, i)
        .map((msg) => ({ role: msg.role, content: textoMensaje(msg) }));

      void buscarPlantasDelTurno(historial, consulta, respuesta).then((plantas) => {
        if (!plantas.length) return;
        setPlantasPorIndice((prev) => {
          const next = new Map(prev);
          next.set(i, plantas);
          return next;
        });
      });
    }
  }, [messages, cargando]);

  function enviar(texto: string) {
    const t = texto.trim();
    if (!t || cargando) return;

    setInput("");
    void sendMessage({ text: t });
  }



  return (
    <div className="flex min-h-[calc(100dvh-3.25rem)] flex-1 flex-col overflow-hidden bg-card-white">
      <div className="relative shrink-0 border-b border-sun-gold/30 bg-gradient-to-br from-academic-navy via-forest to-leaf-bright px-6 py-5 text-white lg:px-10">
        <div className="mx-auto flex max-w-6xl items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sun-gold/20 text-xl ring-2 ring-sun-gold/40">
            🩺
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sun-gold">
              Farmacia Viva · VIC 2026
            </p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">
              Médico Virtual
            </h1>
            <p className="mt-1 text-sm text-mint/90">
              Consultas sobre plantas medicinales con información verificada del catálogo.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-4 h-1 w-20 max-w-6xl rounded-full bg-gradient-to-r from-sun-gold to-sun-amber" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden px-4 sm:px-6 lg:px-10">
        <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-botanical to-page-bg/40 py-4" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversación con el Médico Virtual">

        {messages.length === 0 && (

          <div className="space-y-4">

            {(plantaInicial || nombrePlanta) && (

              <div className="space-y-3 rounded-xl border-2 border-sun-gold/30 bg-gradient-to-br from-cream to-white p-4 shadow-sm">
                <p className="text-sm font-medium text-forest">
                  Consulta sobre{" "}
                  <strong className="text-leaf-bright">{plantaInicial?.nombreComun ?? nombrePlanta}</strong>
                </p>

                {plantaInicial && (

                  <MedicoVirtualPlantas plantas={[plantaInicial]} />

                )}

                {plantaId != null && (

                  <Link

                    href={`/planta/${plantaId}?nombre=${encodeURIComponent(plantaInicial?.nombreComun ?? nombrePlanta ?? "")}`}

                    className="inline-block text-sm font-medium text-sun-amber hover:text-leaf-bright hover:underline"

                  >

                    Ver ficha completa →

                  </Link>

                )}

              </div>

            )}

            <p className="rounded-lg border border-forest/10 bg-white/80 px-3 py-2 text-sm text-earth-soft">
              Pregunta sobre usos, propiedades, preparaciones o ubicación. Las respuestas
              incluyen la imagen y datos de las plantas del catálogo.
            </p>
            <div className="flex flex-wrap gap-2">
              {(nombrePlanta || plantaInicial?.nombreComun
                ? [
                    `¿Para qué sirve ${plantaInicial?.nombreComun ?? nombrePlanta}?`,
                    `¿Cómo se prepara ${plantaInicial?.nombreComun ?? nombrePlanta}?`,
                  ]
                : SUGERENCIAS
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  className="rounded-lg border border-sun-gold/40 bg-white px-3 py-2 text-xs font-medium text-forest shadow-sm outline-none transition hover:border-sun-gold hover:bg-cream hover:shadow focus-visible:ring-2 focus-visible:ring-sun-gold/50"
                >
                  {s}
                </button>
              ))}
            </div>

          </div>

        )}



        {messages.map((m, i) => {
          const plantas =
            m.role === "assistant" ? (plantasPorIndice.get(i) ?? []) : [];

          return (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "user" ? (
                <div className="max-w-[75%] rounded-2xl rounded-br-md border border-leaf-bright/30 bg-gradient-to-br from-forest to-leaf-bright px-4 py-2.5 text-sm leading-relaxed text-white shadow-md lg:max-w-[60%]">
                  <p className="whitespace-pre-wrap">{textoMensaje(m)}</p>
                </div>
              ) : (
                <div className="w-full max-w-4xl space-y-3 rounded-2xl rounded-bl-md border border-forest/10 border-l-4 border-l-sun-gold bg-white p-4 text-sm text-forest shadow-sm">
                  {plantas.length > 0 && (
                    <div className="flex justify-center">
                      <MedicoVirtualPlantas plantas={plantas} />
                    </div>
                  )}
                  <AssistantMessage texto={textoMensaje(m)} />
                </div>
              )}
            </div>
          );
        })}



        {cargando && (
          <div className="flex justify-start" role="status" aria-live="polite">
            <div className="flex items-center gap-2 rounded-2xl border border-forest/10 bg-white px-4 py-2.5 text-sm text-earth-soft shadow-sm">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sun-gold [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sun-gold [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sun-gold [animation-delay:300ms]" />
              </span>
              El Médico Virtual está consultando el catálogo…
            </div>
          </div>
        )}



        {error && (

          <div className="rounded-xl border border-accent-coral/30 bg-accent-coral/10 px-4 py-3 text-sm text-accent-coral">

            {error.message.includes("API key") ||

            error.message.includes("503") ||

            error.message.includes("DEEPSEEK")

              ? "Configura DEEPSEEK_API_KEY en .env.local para activar el Médico Virtual."

              : error.message.includes("quota") ||

                  error.message.includes("Quota") ||

                  error.message.includes("Cuota") ||

                  error.message.includes("429") ||

                  error.message.includes("insufficient")

                ? "Cuota de DeepSeek agotada. Espera 1 minuto e intenta de nuevo."

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
          className="flex shrink-0 gap-2 border-t-2 border-sun-gold/20 bg-white py-4"
          aria-label="Enviar consulta al Médico Virtual"
        >
          <label className="sr-only" htmlFor="medico-virtual-consulta">
            Escribe tu consulta sobre plantas medicinales
          </label>
          <input
            id="medico-virtual-consulta"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu consulta sobre plantas medicinales…"
            disabled={cargando}
            aria-label="Escribe tu consulta sobre plantas medicinales"
            className="flex-1 rounded-xl border-2 border-forest/15 bg-botanical px-4 py-3 text-sm outline-none transition focus-visible:border-sun-gold/50 focus-visible:ring-2 focus-visible:ring-sun-gold/20 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={cargando || !input.trim()}
            aria-label="Enviar consulta"
            className="rounded-xl bg-gradient-to-r from-forest to-leaf-bright px-6 py-3 text-sm font-semibold text-white shadow-md outline-none transition hover:from-leaf-bright hover:to-hero-green focus-visible:ring-2 focus-visible:ring-sun-gold/50 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            Enviar
          </button>
        </form>

        <p className="shrink-0 border-t border-forest/8 bg-cream/50 py-2.5 text-center text-xs text-earth" role="note">
          Información educativa — no sustituye consejo médico profesional.{" "}
          <Link href="/catalogo" className="font-medium text-leaf-bright underline hover:text-forest">
            Ver catálogo
          </Link>
        </p>
      </div>
    </div>

  );

}


