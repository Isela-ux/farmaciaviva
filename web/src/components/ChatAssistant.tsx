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

function normalizarTexto(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function textoMencionaPlanta(texto: string, p: PlantaMedicoVirtual): boolean {
  const t = normalizarTexto(texto);
  if (t.includes(normalizarTexto(p.nombreComun))) return true;
  const genero = p.nombreCientifico?.split(/\s+/)[0];
  return Boolean(genero && t.includes(normalizarTexto(genero)));
}

/** Solo muestra tarjetas cuando la planta aparece en la consulta o en la respuesta. */
function plantasVisibles(
  candidatas: PlantaMedicoVirtual[],
  consultaUsuario: string,
  textoRespuesta: string,
  respuestaCompleta: boolean
): PlantaMedicoVirtual[] {
  if (!candidatas.length) return [];

  const porConsulta = candidatas.filter((p) => textoMencionaPlanta(consultaUsuario, p));
  if (porConsulta.length === 1) return porConsulta;
  if (porConsulta.length > 1) return porConsulta.slice(0, 3);

  if (!respuestaCompleta || !textoRespuesta.trim()) return [];

  return candidatas
    .filter((p) => textoMencionaPlanta(textoRespuesta, p))
    .slice(0, 3);
}



async function buscarPlantasDelTurno(

  mensajes: { role: string; content: string }[]

): Promise<PlantaMedicoVirtual[]> {

  const res = await fetch("/api/chat/plantas", {

    method: "POST",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify({ messages: mensajes }),

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



  function enviar(texto: string) {
    const t = texto.trim();
    if (!t || cargando) return;

    setInput("");

    const historial = [
      ...messages.map((m) => ({ role: m.role, content: textoMensaje(m) })),
      { role: "user" as const, content: t },
    ];
    const indiceAsistente = messages.length + 1;

    void sendMessage({ text: t });

    buscarPlantasDelTurno(historial).then((plantas) => {
      if (!plantas.length) return;
      setPlantasPorIndice((prev) => {
        const next = new Map(prev);
        next.set(indiceAsistente, plantas);
        return next;
      });
    });
  }



  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[480px] flex-col overflow-hidden rounded-2xl border-2 border-forest/15 bg-card-white shadow-lg ring-1 ring-sun-gold/10">
      <div className="relative border-b border-sun-gold/30 bg-gradient-to-br from-academic-navy via-forest to-leaf-bright px-5 py-5 text-white">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sun-gold/20 text-xl ring-2 ring-sun-gold/40">
            🩺
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sun-gold">
              Farmacia Viva · VIC 2026
            </p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight">Médico Virtual</h1>
            <p className="mt-1 text-sm text-mint/90">
              Consultas sobre plantas medicinales con información verificada del catálogo.
            </p>
          </div>
        </div>
        <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-sun-gold to-sun-amber" />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-botanical to-page-bg/40 px-5 py-4">

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
                  className="rounded-lg border border-sun-gold/40 bg-white px-3 py-2 text-xs font-medium text-forest shadow-sm transition hover:border-sun-gold hover:bg-cream hover:shadow"
                >
                  {s}
                </button>
              ))}
            </div>

          </div>

        )}



        {messages.map((m, i) => {
          const consultaUsuario =
            i > 0 && messages[i - 1]?.role === "user"
              ? textoMensaje(messages[i - 1])
              : "";
          const esUltimoMensaje = i === messages.length - 1;
          const respuestaCompleta =
            m.role !== "assistant" || !esUltimoMensaje || !cargando;
          const plantas = plantasVisibles(
            plantasPorIndice.get(i) ?? [],
            consultaUsuario,
            textoMensaje(m),
            respuestaCompleta
          );

          return (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-md border border-leaf-bright/30 bg-gradient-to-br from-forest to-leaf-bright px-4 py-2.5 text-sm leading-relaxed text-white shadow-md">
                  <p className="whitespace-pre-wrap">{textoMensaje(m)}</p>
                </div>
              ) : (
                <div className="w-full max-w-[92%] space-y-3 rounded-2xl rounded-bl-md border border-forest/10 border-l-4 border-l-sun-gold bg-white p-4 text-sm text-forest shadow-sm sm:max-w-[88%]">
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
          <div className="flex justify-start">
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
        className="flex gap-2 border-t-2 border-sun-gold/20 bg-white p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu consulta sobre plantas medicinales…"
          disabled={cargando}
          className="flex-1 rounded-xl border-2 border-forest/15 bg-botanical px-4 py-2.5 text-sm outline-none transition focus:border-sun-gold/50 focus:ring-2 focus:ring-sun-gold/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={cargando || !input.trim()}
          className="rounded-xl bg-gradient-to-r from-forest to-leaf-bright px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-leaf-bright hover:to-hero-green disabled:opacity-50"
        >
          Enviar
        </button>
      </form>

      <p className="border-t border-forest/8 bg-cream/50 px-4 py-2.5 text-center text-xs text-earth-soft">
        Información educativa — no sustituye consejo médico profesional.{" "}
        <Link href="/catalogo" className="font-medium text-leaf-bright underline hover:text-forest">
          Ver catálogo
        </Link>
      </p>

    </div>

  );

}


