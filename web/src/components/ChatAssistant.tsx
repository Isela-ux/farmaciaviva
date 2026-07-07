"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useRef, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AssistantMessage } from "@/components/AssistantMessage";
import {
  MedicoVirtualBubbleAsistente,
  MedicoVirtualBubbleUsuario,
} from "@/components/MedicoVirtualBubble";
import { MedicoVirtualPlantas } from "@/components/MedicoVirtualPlantas";
import { MedicoVirtualProgreso } from "@/components/MedicoVirtualProgreso";
import { useMedicoGuia } from "@/hooks/useMedicoGuia";
import {
  mensajeCargando,
  placeholderEntrada,
  progresoVisual,
} from "@/lib/medico-virtual-presentacion";
import {
  esConsultaPlantaDirecta,
  esExpresionDeMalestar,
  esIntencionSalirConsulta,
  esMalestarGenericoVago,
  esRespuestaTriaje,
} from "@/lib/arbol-padecimientos";
import { evaluarFiltroEntrada } from "@/lib/filtro-entrada-agente";
import { debeEnrutarAMedicoVirtual } from "@/lib/enrutar-medico-virtual";
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
      restringirAContextoRAG: true,
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
  const [plantasPorIndice, setPlantasPorIndice] = useState<Map<number, PlantaMedicoVirtual[]>>(
    new Map()
  );
  const [avisoEntrada, setAvisoEntrada] = useState<string | null>(null);

  const guia = useMedicoGuia();

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, error } = useChat({ transport });

  const cargandoChat = status === "submitted" || status === "streaming";
  const cargando = cargandoChat || guia.cargandoGuia;
  const progreso = guia.activa ? progresoVisual(guia.fase, guia.ruta) : null;

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, cargando, guia.mensajes]);

  useEffect(() => {
    if (cargandoChat || guia.enFlujoGuia || guia.fase === "recomendacion") return;
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (m.role !== "assistant") continue;
      if (plantasResueltasRef.current.has(m.id)) continue;
      const respuesta = textoMensaje(m).trim();
      if (!respuesta) continue;
      const consulta =
        i > 0 && messages[i - 1]?.role === "user" ? textoMensaje(messages[i - 1]).trim() : "";
      plantasResueltasRef.current.add(m.id);
      const historial = messages.slice(0, i).map((msg) => ({
        role: msg.role,
        content: textoMensaje(msg),
      }));
      void buscarPlantasDelTurno(historial, consulta, respuesta).then((plantas) => {
        if (!plantas.length) return;
        setPlantasPorIndice((prev) => {
          const next = new Map(prev);
          next.set(i, plantas);
          return next;
        });
      });
    }
  }, [messages, cargandoChat, guia.enFlujoGuia, guia.fase]);

  function debeActivarGuiaConversacional(texto: string): boolean {
    return debeEnrutarAMedicoVirtual(texto);
  }

  async function enviar(texto: string) {
    const t = texto.trim();
    if (!t || cargando) return;
    setInput("");

    if (esIntencionSalirConsulta(t)) {
      guia.reiniciarGuia();
      return;
    }

    if (guia.enFlujoGuia || guia.fase === "triaje" || guia.fase === "arbol" || guia.fase === "fin") {
      if (
        (guia.fase === "fin" || guia.fase === "triaje") &&
        esMalestarGenericoVago(t) &&
        !esRespuestaTriaje(t)
      ) {
        guia.reiniciarGuia();
        await guia.iniciarGuia(t);
        return;
      }
      if (
        guia.fase === "fin" &&
        debeActivarGuiaConversacional(t) &&
        !esRespuestaTriaje(t)
      ) {
        guia.reiniciarGuia();
        await guia.iniciarGuia(t);
        return;
      }
      await guia.enviarGuia(t);
      return;
    }

    if (debeActivarGuiaConversacional(t)) {
      if (guia.activa) guia.reiniciarGuia();
      await guia.iniciarGuia(t);
      return;
    }

    const filtro = evaluarFiltroEntrada(t);
    if (!filtro.permitido) {
      setAvisoEntrada(filtro.mensaje);
      return;
    }
    setAvisoEntrada(null);

    void sendMessage({ text: t });
  }

  function salirABuscarPlanta() {
    guia.salirAChatLibre();
    setInput("");
  }

  function empezarNuevoMalestar() {
    guia.reiniciarGuia();
    setInput("");
  }

  const mostrarBienvenida = messages.length === 0 && !guia.activa;
  const mostrarChatLibre = !guia.enFlujoGuia && guia.fase !== "recomendacion" && !guia.activa;
  const sugerencias = nombrePlanta || plantaInicial?.nombreComun
    ? [
        `¿Para qué sirve ${plantaInicial?.nombreComun ?? nombrePlanta}?`,
        `¿Cómo se prepara ${plantaInicial?.nombreComun ?? nombrePlanta}?`,
      ]
    : SUGERENCIAS;

  return (
    <div className="flex min-h-[calc(100dvh-3.25rem)] flex-1 flex-col overflow-hidden bg-card-white">
      <div className="relative shrink-0 overflow-hidden border-b border-sun-gold/30 bg-gradient-to-br from-academic-navy via-forest to-leaf-bright px-6 py-6 text-white lg:px-10">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-sun-gold/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-6 left-1/4 h-28 w-28 rounded-full bg-mint-light/10 blur-xl"
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-6xl items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl shadow-lg ring-2 ring-sun-gold/35 backdrop-blur-sm">
            🌿
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sun-gold">
              Farmacia Viva · VIC 2026
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Tu guía en plantas medicinales
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-mint/95">
              Platícame cómo te sientes o pregúntame por cualquier planta del catálogo. Te acompaño
              paso a paso, con calma.
            </p>
          </div>
        </div>
        <div className="relative mx-auto mt-5 flex max-w-6xl gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium backdrop-blur-sm">
            💬 Conversación natural
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium backdrop-blur-sm">
            🌱 284 especies
          </span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden px-4 sm:px-6 lg:px-10">
        {progreso && <MedicoVirtualProgreso progreso={progreso} />}

        {guia.activa && guia.fase !== "recomendacion" && (
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-forest/6 bg-white/90 px-4 py-2.5 backdrop-blur-sm">
            <button
              type="button"
              onClick={empezarNuevoMalestar}
              disabled={cargando}
              className="rounded-full border border-forest/15 bg-cream/60 px-4 py-2 text-xs font-semibold text-forest outline-none transition hover:border-sun-gold/50 hover:bg-cream focus-visible:ring-2 focus-visible:ring-sun-gold/50 disabled:opacity-50 sm:text-sm"
            >
              ✨ Empezar de nuevo
            </button>
            <button
              type="button"
              onClick={salirABuscarPlanta}
              disabled={cargando}
              className="rounded-full border border-leaf-bright/30 bg-mint-light/30 px-4 py-2 text-xs font-semibold text-leaf-bright outline-none transition hover:border-leaf-bright hover:bg-mint-light/50 focus-visible:ring-2 focus-visible:ring-sun-gold/50 disabled:opacity-50 sm:text-sm"
            >
              🌿 Explorar plantas
            </button>
          </div>
        )}

        <div
          className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-botanical to-page-bg/40 py-4"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Conversación con el Médico Virtual"
        >
          {mostrarBienvenida && (
            <div className="space-y-4">
              {(plantaInicial || nombrePlanta) && (
                <div className="space-y-3 rounded-xl border-2 border-sun-gold/30 bg-gradient-to-br from-cream to-white p-4 shadow-sm">
                  <p className="text-sm font-medium text-forest">
                    Consulta sobre{" "}
                    <strong className="text-leaf-bright">
                      {plantaInicial?.nombreComun ?? nombrePlanta}
                    </strong>
                  </p>
                  {plantaInicial && <MedicoVirtualPlantas plantas={[plantaInicial]} />}
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

              {!plantaInicial && !nombrePlanta && (
                <div className="overflow-hidden rounded-3xl border border-sun-gold/30 bg-gradient-to-br from-white via-cream/50 to-mint-light/25 p-6 text-center shadow-lg shadow-forest/5">
                  <p className="text-lg font-semibold text-forest">Hola, ¿en qué te acompaño hoy?</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-earth-soft">
                    Puedes contarme cómo te sientes o preguntarme por una planta. Sin formularios raros
                    — solo conversación.
                  </p>
                  <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={() => void enviar("Me siento un poco mal")}
                      className="rounded-2xl border border-forest/15 bg-white px-6 py-3.5 text-sm font-semibold text-forest shadow-sm outline-none transition hover:border-sun-gold/40 hover:bg-cream focus-visible:ring-2 focus-visible:ring-sun-gold/50"
                    >
                      😔 No me siento muy bien
                    </button>
                    <button
                      type="button"
                      onClick={() => void enviar("Tengo dolor")}
                      className="rounded-2xl bg-gradient-to-r from-forest to-leaf-bright px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-forest/20 outline-none transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-sun-gold/50"
                    >
                      💬 Cuéntame — tengo molestias
                    </button>
                  </div>
                </div>
              )}

              <p className="rounded-2xl border border-forest/8 bg-white/90 px-4 py-3 text-sm text-earth-soft shadow-sm">
                También puedes ir directo al grano: usos, preparación o propiedades de una planta.
              </p>
              <div className="flex flex-wrap gap-2">
                {sugerencias.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void enviar(s)}
                    className="rounded-full border border-sun-gold/35 bg-white px-4 py-2 text-xs font-medium text-forest shadow-sm outline-none transition hover:border-sun-gold hover:bg-cream hover:shadow focus-visible:ring-2 focus-visible:ring-sun-gold/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {guia.mensajes.map((m, idx) => {
            const esUltimo = m.role === "assistant" && idx === guia.mensajes.length - 1;
            const opciones =
              esUltimo && guia.fase === "arbol" && !cargando ? m.opciones : undefined;

            return (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "user" ? (
                  <MedicoVirtualBubbleUsuario>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </MedicoVirtualBubbleUsuario>
                ) : (
                  <MedicoVirtualBubbleAsistente
                    agente={m.agente}
                    footer={
                      <>
                        {m.agente === "alarma" && (
                          <div className="mt-4 flex flex-wrap gap-2 border-t border-accent-coral/20 pt-4">
                            <a
                              href="tel:911"
                              className="rounded-full bg-accent-coral px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-105"
                            >
                              📞 Llamar al 911 (México)
                            </a>
                            <button
                              type="button"
                              onClick={empezarNuevoMalestar}
                              className="rounded-full border border-forest/20 bg-white px-4 py-2 text-xs font-semibold text-forest transition hover:bg-cream"
                            >
                              ✨ Nueva consulta
                            </button>
                          </div>
                        )}
                        {m.plantas && m.plantas.length > 0 && (
                          <div className="flex justify-center border-t border-forest/6 pt-4">
                            <MedicoVirtualPlantas plantas={m.plantas.slice(0, 3)} />
                          </div>
                        )}
                        {opciones && opciones.length > 0 && (
                          <div className="mt-3 grid gap-2 border-t border-forest/6 pt-4 sm:grid-cols-2">
                            <p className="sm:col-span-2 text-xs font-medium text-earth-soft">
                              ¿Te refieres a alguna de estas?
                            </p>
                            {opciones.map((op) => (
                              <button
                                key={op.id}
                                type="button"
                                onClick={() => void enviar(op.id)}
                                disabled={cargando}
                                className="rounded-xl border border-sun-gold/40 bg-white/80 px-4 py-3 text-left text-sm font-medium text-forest outline-none transition hover:border-sun-gold hover:bg-cream focus-visible:ring-2 focus-visible:ring-sun-gold/50"
                              >
                                {op.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    }
                  >
                    <AssistantMessage texto={m.content} />
                  </MedicoVirtualBubbleAsistente>
                )}
              </div>
            );
          })}

          {mostrarChatLibre &&
            messages.map((m, i) => {
              const plantas = m.role === "assistant" ? (plantasPorIndice.get(i) ?? []) : [];
              return (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "user" ? (
                    <MedicoVirtualBubbleUsuario>
                      <p className="whitespace-pre-wrap">{textoMensaje(m)}</p>
                    </MedicoVirtualBubbleUsuario>
                  ) : (
                    <MedicoVirtualBubbleAsistente
                      agente="triaje"
                      footer={
                        plantas.length > 0 ? (
                          <div className="flex justify-center border-t border-forest/6 pt-4">
                            <MedicoVirtualPlantas plantas={plantas} />
                          </div>
                        ) : undefined
                      }
                    >
                      <AssistantMessage texto={textoMensaje(m)} />
                    </MedicoVirtualBubbleAsistente>
                  )}
                </div>
              );
            })}

          {cargando && (
            <div className="flex justify-start" role="status" aria-live="polite">
              <div className="flex items-center gap-3 rounded-2xl border border-forest/8 bg-white/95 px-4 py-3 text-sm text-earth-soft shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-light/40 text-lg">
                  🌿
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-leaf-bright [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-leaf-bright [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-leaf-bright [animation-delay:300ms]" />
                  </span>
                  {mensajeCargando(guia.fase, guia.enFlujoGuia)}
                </span>
              </div>
            </div>
          )}

          {guia.errorGuia && (
            <div className="rounded-xl border border-accent-coral/30 bg-accent-coral/10 px-4 py-3 text-sm text-accent-coral">
              {guia.errorGuia}
            </div>
          )}

          {avisoEntrada && (
            <div className="rounded-xl border border-sun-gold/40 bg-sun-gold/10 px-4 py-3 text-sm text-academic-navy">
              {avisoEntrada}
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

          {guia.fase === "fin" && (
            <p className="rounded-2xl border border-leaf-bright/20 bg-mint-light/25 px-4 py-3 text-center text-xs text-forest">
              ¿Quieres seguir explorando? Usa los botones de arriba o escribe aquí abajo.
            </p>
          )}

          <div ref={finRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void enviar(input);
          }}
          className="flex shrink-0 gap-2 border-t-2 border-sun-gold/20 bg-white py-4"
          aria-label="Enviar consulta al Médico Virtual"
        >
          <label className="sr-only" htmlFor="medico-virtual-consulta">
            Escribe tu consulta
          </label>
          <input
            id="medico-virtual-consulta"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholderEntrada(guia.fase, guia.enFlujoGuia)}
            disabled={cargando || guia.fase === "recomendacion"}
            aria-label="Escribe tu consulta"
            className="flex-1 rounded-2xl border border-forest/12 bg-botanical px-4 py-3 text-sm outline-none transition focus-visible:border-sun-gold/50 focus-visible:ring-2 focus-visible:ring-sun-gold/20 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={cargando || !input.trim() || guia.fase === "recomendacion"}
            aria-label="Enviar consulta"
            className="rounded-full bg-gradient-to-r from-forest to-leaf-bright px-6 py-3 text-sm font-semibold text-white shadow-md outline-none transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-sun-gold/50 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            Enviar ✨
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
