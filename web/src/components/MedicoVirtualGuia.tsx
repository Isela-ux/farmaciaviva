"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AssistantMessage } from "@/components/AssistantMessage";
import { MedicoVirtualPlantas } from "@/components/MedicoVirtualPlantas";
import {
  interpretarEntradaGuia,
  mensajeBienvenidaGuia,
  type PadecimientoSeleccionado,
} from "@/lib/arbol-padecimientos";
import type { PlantaMedicoVirtual } from "@/types/database";

type FaseGuia = "arbol" | "triaje" | "recomendacion" | "fin";

type MensajeGuia = {
  id: string;
  role: "user" | "assistant";
  content: string;
  agente?: "sistema" | "triaje" | "plantas";
  opciones?: { id: string; label: string }[];
};

const SUGERENCIAS_INICIO = ["Tengo dolor", "Me duele la cabeza", "Dolor de garganta"];

function uid(): string {
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function buscarPlantasRespuesta(
  consulta: string,
  respuesta: string
): Promise<PlantaMedicoVirtual[]> {
  const res = await fetch("/api/chat/plantas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: consulta }],
      consulta,
      respuestaAsistente: respuesta,
    }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { plantas?: PlantaMedicoVirtual[] };
  return data.plantas ?? [];
}

async function llamarTriaje(
  padecimiento: PadecimientoSeleccionado,
  mensajes: { role: string; content: string }[],
  notasTriaje: string
): Promise<{ texto: string; triajeCompleto: boolean; notasTriaje: string }> {
  const res = await fetch("/api/chat/guia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fase: "triaje",
      padecimiento,
      messages: mensajes,
      notasTriaje,
    }),
  });
  if (!res.ok) throw new Error("No se pudo completar el triaje");
  return res.json();
}

async function llamarRecomendacion(
  padecimiento: PadecimientoSeleccionado,
  notasTriaje: string
): Promise<string> {
  const res = await fetch("/api/chat/guia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fase: "recomendacion",
      padecimiento,
      messages: [],
      notasTriaje,
    }),
  });
  if (!res.ok) throw new Error("No se pudo generar la recomendación");
  const data = (await res.json()) as { texto?: string };
  return data.texto ?? "";
}

function etiquetaAgente(agente?: MensajeGuia["agente"]): string | null {
  if (agente === "triaje") return "🩺 Especialista clínico (triaje)";
  if (agente === "plantas") return "🌿 Equipo de plantas y preparación";
  if (agente === "sistema") return "📋 Guía por síntomas";
  return null;
}

function etiquetaPaso(fase: FaseGuia, ruta: string[]): string | null {
  if (fase === "arbol") {
    if (ruta.length === 0) return "Paso 1 — ¿Qué sientes?";
    if (ruta.length === 1) return "Paso 2 — ¿Qué tipo de dolor?";
    return "Paso 2 — Precisando síntoma";
  }
  if (fase === "triaje") return "Paso 3 — Preguntas del especialista";
  if (fase === "recomendacion") return "Paso 4 — Buscando plantas en el catálogo";
  if (fase === "fin") return "Recomendación lista";
  return null;
}

export function MedicoVirtualGuia() {
  const finRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fase, setFase] = useState<FaseGuia>("arbol");
  const [nodoActualId, setNodoActualId] = useState("raiz");
  const [ruta, setRuta] = useState<string[]>([]);
  const [padecimiento, setPadecimiento] = useState<PadecimientoSeleccionado | null>(null);
  const [notasTriaje, setNotasTriaje] = useState("");
  const [mensajesTriaje, setMensajesTriaje] = useState<{ role: string; content: string }[]>([]);
  const [mensajes, setMensajes] = useState<MensajeGuia[]>([
    {
      id: uid(),
      role: "assistant",
      content: mensajeBienvenidaGuia(),
      agente: "sistema",
    },
  ]);
  const [plantasRecomendacion, setPlantasRecomendacion] = useState<PlantaMedicoVirtual[]>([]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando, plantasRecomendacion]);

  const agregarMensaje = useCallback((msg: Omit<MensajeGuia, "id">) => {
    setMensajes((prev) => [...prev, { ...msg, id: uid() }]);
  }, []);

  const generarRecomendacion = useCallback(
    async (pad: PadecimientoSeleccionado, notas: string) => {
      setFase("recomendacion");
      setCargando(true);
      setError(null);

      agregarMensaje({
        role: "assistant",
        content:
          "Consultando el catálogo con el **Especialista en plantas** y el **Especialista en preparación**…",
        agente: "sistema",
      });

      try {
        const texto = await llamarRecomendacion(pad, notas);
        const plantas = await buscarPlantasRespuesta(pad.padecimiento, texto);
        setPlantasRecomendacion(plantas);
        setMensajes((prev) => {
          const sinEspera = prev.filter((m) => !m.content.includes("Consultando el catálogo"));
          return [
            ...sinEspera,
            {
              id: uid(),
              role: "assistant",
              content: texto,
              agente: "plantas",
            },
          ];
        });
        setFase("fin");
      } catch {
        setError("No se pudo generar la recomendación de plantas.");
      } finally {
        setCargando(false);
      }
    },
    [agregarMensaje]
  );

  const iniciarTriaje = useCallback(
    async (pad: PadecimientoSeleccionado) => {
      setFase("triaje");
      setPadecimiento(pad);
      setCargando(true);
      setError(null);

      const contextoInicial = [
        {
          role: "user",
          content: `Paciente reporta: ${pad.padecimiento}. Síntoma identificado en la guía: ${pad.ruta.join(" → ")}.`,
        },
      ];
      setMensajesTriaje(contextoInicial);

      try {
        const res = await llamarTriaje(pad, contextoInicial, "");
        setNotasTriaje(res.notasTriaje);
        setMensajesTriaje((prev) => [...prev, { role: "assistant", content: res.texto }]);
        agregarMensaje({
          role: "assistant",
          content: res.texto,
          agente: "triaje",
        });
        if (res.triajeCompleto) {
          await generarRecomendacion(pad, res.notasTriaje);
        }
      } catch {
        setError("No se pudo conectar con el especialista de triaje.");
      } finally {
        setCargando(false);
      }
    },
    [agregarMensaje, generarRecomendacion]
  );

  const procesarArbol = async (texto: string) => {
    const resultado = interpretarEntradaGuia(texto, nodoActualId, ruta);

    if (resultado.tipo === "avanzar") {
      setNodoActualId(resultado.nodo.id);
      setRuta(resultado.ruta);
      agregarMensaje({
        role: "assistant",
        content: resultado.mensajeAsistente,
        agente: "sistema",
        opciones: resultado.nodo.hijos?.map((h) => ({ id: h.id, label: h.label })),
      });
      return;
    }

    if (resultado.tipo === "hoja") {
      setNodoActualId(resultado.padecimiento.id);
      setRuta(resultado.padecimiento.ruta);
      agregarMensaje({
        role: "assistant",
        content: resultado.mensajeAsistente,
        agente: "triaje",
      });
      await iniciarTriaje(resultado.padecimiento);
      return;
    }

    agregarMensaje({
      role: "assistant",
      content: resultado.mensajeAsistente,
      agente: "sistema",
      opciones: resultado.opciones,
    });
  };

  const procesarTriaje = async (texto: string) => {
    if (!padecimiento) return;

    const historial = [...mensajesTriaje, { role: "user", content: texto }];
    setMensajesTriaje(historial);
    setCargando(true);
    setError(null);

    try {
      const res = await llamarTriaje(padecimiento, historial, notasTriaje);
      setNotasTriaje(res.notasTriaje);
      const historialCompleto = [...historial, { role: "assistant", content: res.texto }];
      setMensajesTriaje(historialCompleto);
      agregarMensaje({ role: "assistant", content: res.texto, agente: "triaje" });

      if (res.triajeCompleto) {
        await generarRecomendacion(padecimiento, res.notasTriaje);
      }
    } catch {
      setError("No se pudo continuar el triaje.");
    } finally {
      setCargando(false);
    }
  };

  async function enviar(texto: string) {
    const t = texto.trim();
    if (!t || cargando || fase === "recomendacion" || fase === "fin") return;

    setInput("");
    agregarMensaje({ role: "user", content: t });

    if (fase === "arbol") {
      await procesarArbol(t);
    } else if (fase === "triaje") {
      await procesarTriaje(t);
    }
  }

  function reiniciarGuia() {
    setFase("arbol");
    setNodoActualId("raiz");
    setRuta([]);
    setPadecimiento(null);
    setNotasTriaje("");
    setMensajesTriaje([]);
    setPlantasRecomendacion([]);
    setError(null);
    setMensajes([
      {
        id: uid(),
        role: "assistant",
        content: mensajeBienvenidaGuia(),
        agente: "sistema",
      },
    ]);
  }

  const pasoActual = etiquetaPaso(fase, ruta);
  const mostrarInicio = fase === "arbol" && mensajes.length === 1 && !cargando;

  return (
    <div className="flex min-h-[calc(100dvh-3.25rem)] flex-1 flex-col overflow-hidden bg-card-white">
      <div className="relative shrink-0 border-b border-sun-gold/30 bg-gradient-to-br from-academic-navy via-forest to-leaf-bright px-6 py-5 text-white lg:px-10">
        <div className="mx-auto flex max-w-6xl items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sun-gold/20 text-xl ring-2 ring-sun-gold/40">
            🗺️
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sun-gold">
              Farmacia Viva · Guía por síntomas
            </p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">
              Árbol de decisiones
            </h1>
            <p className="mt-1 text-sm text-mint/90">
              Cuéntame qué sientes — te preguntaré paso a paso y canalizaré con especialistas.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-4 h-1 w-20 max-w-6xl rounded-full bg-gradient-to-r from-sun-gold to-sun-amber" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden px-4 sm:px-6 lg:px-10">
        {pasoActual && (
          <p className="shrink-0 border-b border-forest/8 bg-gradient-to-r from-cream to-white py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-leaf-bright">
            {pasoActual}
            {ruta.length > 0 && (
              <span className="mt-0.5 block font-normal normal-case tracking-normal text-earth">
                {ruta.join(" → ")}
              </span>
            )}
          </p>
        )}

        <div
          className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-botanical to-page-bg/40 py-4"
          role="log"
          aria-live="polite"
        >
          {mostrarInicio && (
            <div className="rounded-2xl border-2 border-sun-gold/50 bg-gradient-to-br from-cream via-white to-mint-light/30 p-6 text-center shadow-sm">
              <p className="text-sm font-medium text-forest">
                Empieza describiendo tu malestar
              </p>
              <p className="mt-1 text-xs text-earth-soft">
                Primero preguntas · plantas al final
              </p>
              <button
                type="button"
                onClick={() => void enviar("Tengo dolor")}
                className="mt-4 w-full max-w-xs rounded-xl bg-gradient-to-r from-forest to-leaf-bright px-8 py-4 text-base font-bold uppercase tracking-wide text-white shadow-lg outline-none transition hover:from-leaf-bright hover:to-hero-green focus-visible:ring-2 focus-visible:ring-sun-gold/50 sm:w-auto"
              >
                Tengo dolor
              </button>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {SUGERENCIAS_INICIO.filter((s) => s !== "Tengo dolor").map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void enviar(s)}
                    className="rounded-lg border border-forest/15 bg-white px-3 py-1.5 text-xs text-forest hover:bg-cream"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mensajes.map((m, idx) => {
            const agente = etiquetaAgente(m.agente);
            const esUltimoAsistente =
              m.role === "assistant" && idx === mensajes.length - 1;
            const opcionesDeEste =
              esUltimoAsistente &&
              fase === "arbol" &&
              !cargando &&
              m.opciones?.length
                ? m.opciones
                : undefined;

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
                    {m.agente === "plantas" && fase === "fin" && plantasRecomendacion.length > 0 && (
                      <div className="flex justify-center pb-2">
                        <MedicoVirtualPlantas plantas={plantasRecomendacion.slice(0, 3)} />
                      </div>
                    )}
                    <AssistantMessage texto={m.content} />
                    {opcionesDeEste && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-sun-amber">
                          Elige una opción o escríbela abajo:
                        </p>
                        {opcionesDeEste.map((op) => (
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

          {cargando && (
            <div className="flex justify-start" role="status" aria-live="polite">
              <div className="flex items-center gap-2 rounded-2xl border border-forest/10 bg-white px-4 py-2.5 text-sm text-earth-soft shadow-sm">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sun-gold" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sun-gold [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sun-gold [animation-delay:300ms]" />
                </span>
                Consultando especialistas…
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-accent-coral/30 bg-accent-coral/10 px-4 py-3 text-sm text-accent-coral">
              {error}
            </div>
          )}

          {fase === "fin" && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={reiniciarGuia}
                className="rounded-xl border-2 border-forest/20 bg-white px-5 py-2.5 text-sm font-medium text-forest outline-none hover:bg-cream focus-visible:ring-2 focus-visible:ring-sun-gold/50"
              >
                Nueva consulta por síntomas
              </button>
            </div>
          )}

          <div ref={finRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void enviar(input);
          }}
          className="flex shrink-0 gap-2 border-t-2 border-sun-gold/20 bg-white py-4"
        >
          <label className="sr-only" htmlFor="guia-sintomas-input">
            Describe tu malestar
          </label>
          <input
            id="guia-sintomas-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              fase === "triaje"
                ? "Responde a la pregunta del especialista…"
                : "Ej.: Tengo dolor, me duele la cabeza…"
            }
            disabled={cargando || fase === "fin" || fase === "recomendacion"}
            className="flex-1 rounded-xl border-2 border-forest/15 bg-botanical px-4 py-3 text-sm outline-none focus-visible:border-sun-gold/50 focus-visible:ring-2 focus-visible:ring-sun-gold/20 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={cargando || !input.trim() || fase === "fin" || fase === "recomendacion"}
            className="rounded-xl bg-gradient-to-r from-forest to-leaf-bright px-6 py-3 text-sm font-semibold text-white shadow-md outline-none transition hover:from-leaf-bright hover:to-hero-green focus-visible:ring-2 focus-visible:ring-sun-gold/50 disabled:opacity-50"
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
