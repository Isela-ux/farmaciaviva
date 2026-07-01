"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useRef, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AssistantMessage } from "@/components/AssistantMessage";
import { MedicoVirtualPlantas } from "@/components/MedicoVirtualPlantas";
import {
  etiquetaAgenteGuia,
  etiquetaPasoGuia,
  useMedicoGuia,
} from "@/hooks/useMedicoGuia";
import {
  esConsultaPlantaDirecta,
  esExpresionDeMalestar,
  esIntencionSalirConsulta,
  esNuevoMalestarDistinto,
  esRespuestaTriaje,
} from "@/lib/arbol-padecimientos";
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
    body: JSON.stringify({ messages: mensajes, consulta, respuestaAsistente }),
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

  const guia = useMedicoGuia();

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, error } = useChat({ transport });

  const cargandoChat = status === "submitted" || status === "streaming";
  const cargando = cargandoChat || guia.cargandoGuia;
  const pasoGuia = etiquetaPasoGuia(guia.fase, guia.ruta);

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
    if (esConsultaPlantaDirecta(texto)) return false;
    return esExpresionDeMalestar(texto);
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
        guia.fase === "fin" &&
        debeActivarGuiaConversacional(t) &&
        !esRespuestaTriaje(t)
      ) {
        guia.reiniciarGuia();
        await guia.iniciarGuia(t);
        return;
      }
      if (
        guia.fase === "triaje" &&
        esNuevoMalestarDistinto(t, guia.padecimiento ?? null)
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
              Cuéntame qué sientes (te haré preguntas) o pregunta directamente por una planta del
              catálogo.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-4 h-1 w-20 max-w-6xl rounded-full bg-gradient-to-r from-sun-gold to-sun-amber" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden px-4 sm:px-6 lg:px-10">
        {pasoGuia && guia.activa && (
          <p className="shrink-0 border-b border-forest/8 bg-gradient-to-r from-cream to-white py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-leaf-bright">
            {pasoGuia}
            {guia.ruta.length > 0 && (
              <span className="mt-0.5 block font-normal normal-case tracking-normal text-earth">
                {guia.ruta.join(" → ")}
              </span>
            )}
          </p>
        )}

        {guia.activa && guia.fase !== "recomendacion" && (
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-sun-gold/25 bg-cream/80 px-4 py-2.5">
            <button
              type="button"
              onClick={empezarNuevoMalestar}
              disabled={cargando}
              className="rounded-lg border-2 border-forest/20 bg-white px-3 py-1.5 text-xs font-semibold text-forest outline-none transition hover:border-sun-gold hover:bg-cream focus-visible:ring-2 focus-visible:ring-sun-gold/50 disabled:opacity-50 sm:text-sm"
            >
              🔄 Nuevo malestar
            </button>
            <button
              type="button"
              onClick={salirABuscarPlanta}
              disabled={cargando}
              className="rounded-lg border-2 border-leaf-bright/40 bg-white px-3 py-1.5 text-xs font-semibold text-leaf-bright outline-none transition hover:border-leaf-bright hover:bg-mint-light/30 focus-visible:ring-2 focus-visible:ring-sun-gold/50 disabled:opacity-50 sm:text-sm"
            >
              🌿 Buscar planta
            </button>
            <span className="w-full text-center text-[10px] text-earth-soft sm:w-auto sm:text-xs">
              Usa estos botones para cambiar de consulta sin recargar la página
            </span>
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
                <div className="rounded-2xl border-2 border-sun-gold/50 bg-gradient-to-br from-cream via-white to-mint-light/30 p-5 text-center shadow-sm">
                  <p className="text-sm font-medium text-forest">¿Qué sientes?</p>
                  <p className="mt-1 text-xs text-earth-soft">
                    Cuéntame con tus palabras — no hace falta decir «tengo dolor»
                  </p>
                  <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={() => void enviar("Me siento un poco mal")}
                      className="w-full max-w-xs rounded-xl border-2 border-sun-gold/60 bg-cream px-6 py-3 text-sm font-semibold text-forest shadow-sm outline-none transition hover:bg-sun-gold/15 focus-visible:ring-2 focus-visible:ring-sun-gold/50 sm:w-auto"
                    >
                      Me siento un poco mal
                    </button>
                    <button
                      type="button"
                      onClick={() => void enviar("Tengo dolor")}
                      className="w-full max-w-xs rounded-xl bg-gradient-to-r from-forest to-leaf-bright px-6 py-3 text-sm font-bold text-white shadow-lg outline-none transition hover:from-leaf-bright hover:to-hero-green focus-visible:ring-2 focus-visible:ring-sun-gold/50 sm:w-auto"
                    >
                      Tengo dolor
                    </button>
                  </div>
                </div>
              )}

              <p className="rounded-lg border border-forest/10 bg-white/80 px-3 py-2 text-sm text-earth-soft">
                También puedes preguntar por usos, propiedades o preparación de una planta concreta.
              </p>
              <div className="flex flex-wrap gap-2">
                {sugerencias.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void enviar(s)}
                    className="rounded-lg border border-sun-gold/40 bg-white px-3 py-2 text-xs font-medium text-forest shadow-sm outline-none transition hover:border-sun-gold hover:bg-cream hover:shadow focus-visible:ring-2 focus-visible:ring-sun-gold/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {guia.mensajes.map((m, idx) => {
            const agente = etiquetaAgenteGuia(m.agente);
            const esUltimo = m.role === "assistant" && idx === guia.mensajes.length - 1;
            const opciones =
              esUltimo && guia.fase === "arbol" && !cargando ? m.opciones : undefined;

            return (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "user" ? (
                  <div className="max-w-[75%] rounded-2xl rounded-br-md border border-leaf-bright/30 bg-gradient-to-br from-forest to-leaf-bright px-4 py-2.5 text-sm text-white shadow-md lg:max-w-[60%]">
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                ) : (
                  <div className="w-full max-w-4xl space-y-2 rounded-2xl rounded-bl-md border border-forest/10 border-l-4 border-l-sun-gold bg-white p-4 text-sm text-forest shadow-sm">
                    {agente && (
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-leaf-bright">
                        {agente}
                      </p>
                    )}
                    <AssistantMessage texto={m.content} />
                    {m.plantas && m.plantas.length > 0 && (
                      <div className="flex justify-center pt-3">
                        <MedicoVirtualPlantas plantas={m.plantas.slice(0, 3)} />
                      </div>
                    )}
                    {opciones && opciones.length > 0 && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-sun-amber">
                          Elige una opción o escríbela abajo:
                        </p>
                        {opciones.map((op) => (
                          <button
                            key={op.id}
                            type="button"
                            onClick={() => void enviar(op.label)}
                            disabled={cargando}
                            className="rounded-xl border-2 border-sun-gold/60 bg-cream px-4 py-3 text-sm font-semibold text-forest outline-none transition hover:border-sun-gold hover:bg-sun-gold/15 focus-visible:ring-2 focus-visible:ring-sun-gold/50"
                          >
                            {op.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
                    <div className="max-w-[75%] rounded-2xl rounded-br-md border border-leaf-bright/30 bg-gradient-to-br from-forest to-leaf-bright px-4 py-2.5 text-sm text-white shadow-md lg:max-w-[60%]">
                      <p className="whitespace-pre-wrap">{textoMensaje(m)}</p>
                    </div>
                  ) : (
                    <div className="w-full max-w-4xl space-y-3 rounded-2xl rounded-bl-md border border-forest/10 border-l-4 border-l-sun-gold bg-white p-4 text-sm text-forest shadow-sm">
                      <AssistantMessage texto={textoMensaje(m)} />
                      {plantas.length > 0 && (
                        <div className="flex justify-center pt-1">
                          <MedicoVirtualPlantas plantas={plantas} />
                        </div>
                      )}
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
                {guia.enFlujoGuia || guia.fase === "arbol" || guia.fase === "triaje"
                  ? "El especialista está preparando tu siguiente pregunta…"
                  : "El Médico Virtual está consultando el catálogo…"}
              </div>
            </div>
          )}

          {guia.errorGuia && (
            <div className="rounded-xl border border-accent-coral/30 bg-accent-coral/10 px-4 py-3 text-sm text-accent-coral">
              {guia.errorGuia}
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
            <p className="text-center text-xs text-earth-soft">
              También puedes usar los botones de arriba para un nuevo malestar o buscar otra planta.
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
            placeholder={
              guia.enFlujoGuia || guia.fase === "triaje" || guia.fase === "arbol"
                ? "Responde al especialista, o escribe otro malestar…"
                : guia.fase === "fin"
                  ? "Pregunta por una planta o escribe un nuevo malestar…"
                  : "Ej.: Me duele la nariz · ¿Para qué sirve el achiote?"
            }
            disabled={cargando || guia.fase === "recomendacion"}
            aria-label="Escribe tu consulta"
            className="flex-1 rounded-xl border-2 border-forest/15 bg-botanical px-4 py-3 text-sm outline-none transition focus-visible:border-sun-gold/50 focus-visible:ring-2 focus-visible:ring-sun-gold/20 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={cargando || !input.trim() || guia.fase === "recomendacion"}
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
