"use client";

import { useCallback, useState } from "react";
import {
  esConsultaPlantaDirecta,
  esPedidoRecomendacionPlantas,
  interpretarEntradaGuia,
  type PadecimientoSeleccionado,
} from "@/lib/arbol-padecimientos";
import {
  contarRespuestasPacienteTriaje,
  evaluarTriajeCompleto,
} from "@/lib/medico-agentes";
import type { PlantaMedicoVirtual } from "@/types/database";

export type FaseGuia = "arbol" | "triaje" | "recomendacion" | "fin";

export type MensajeGuia = {
  id: string;
  role: "user" | "assistant";
  content: string;
  agente?: "sistema" | "triaje" | "plantas";
  opciones?: { id: string; label: string }[];
  plantas?: PlantaMedicoVirtual[];
};

function uid(): string {
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function buscarPlantasRespuesta(
  consulta: string,
  respuesta: string,
  historial: { role: string; content: string }[] = []
): Promise<PlantaMedicoVirtual[]> {
  const res = await fetch("/api/chat/plantas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: historial.length ? historial : [{ role: "user", content: consulta }],
      consulta,
      respuestaAsistente: respuesta,
    }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { plantas?: PlantaMedicoVirtual[] };
  return data.plantas ?? [];
}

async function llamarConsultaPlanta(mensajes: { role: string; content: string }[]): Promise<string> {
  const res = await fetch("/api/chat/guia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fase: "consulta_planta", messages: mensajes }),
  });
  if (!res.ok) throw new Error("consulta_planta");
  const data = (await res.json()) as { texto?: string };
  return data.texto ?? "";
}

async function llamarTriaje(
  padecimiento: PadecimientoSeleccionado,
  mensajes: { role: string; content: string }[],
  notasTriaje: string
) {
  const res = await fetch("/api/chat/guia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fase: "triaje", padecimiento, messages: mensajes, notasTriaje }),
  });
  if (!res.ok) throw new Error("triaje");
  return res.json() as Promise<{
    texto: string;
    triajeCompleto: boolean;
    notasTriaje: string;
  }>;
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
  if (!res.ok) throw new Error("recomendacion");
  const data = (await res.json()) as { texto?: string };
  return data.texto ?? "";
}

export function etiquetaAgenteGuia(agente?: MensajeGuia["agente"]): string | null {
  if (agente === "triaje") return "🩺 Especialista clínico (triaje)";
  if (agente === "plantas") return "🌿 Especialista en plantas y preparación";
  if (agente === "sistema") return "📋 Árbol de decisiones";
  return null;
}

export function etiquetaPasoGuia(fase: FaseGuia | null, ruta: string[]): string | null {
  if (!fase) return null;
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

export function useMedicoGuia() {
  const [activa, setActiva] = useState(false);
  const [cargandoGuia, setCargandoGuia] = useState(false);
  const [errorGuia, setErrorGuia] = useState<string | null>(null);
  const [fase, setFase] = useState<FaseGuia | null>(null);
  const [nodoActualId, setNodoActualId] = useState("raiz");
  const [ruta, setRuta] = useState<string[]>([]);
  const [padecimiento, setPadecimiento] = useState<PadecimientoSeleccionado | null>(null);
  const [notasTriaje, setNotasTriaje] = useState("");
  const [mensajesTriaje, setMensajesTriaje] = useState<{ role: string; content: string }[]>([]);
  const [mensajes, setMensajes] = useState<MensajeGuia[]>([]);

  const agregarMensaje = useCallback((msg: Omit<MensajeGuia, "id">) => {
    setMensajes((prev) => [...prev, { ...msg, id: uid() }]);
  }, []);

  const agregarRespuestaAsistente = useCallback(
    async (
      msg: Omit<MensajeGuia, "id">,
      consultaUsuario: string,
      historial: { role: string; content: string }[] = []
    ) => {
      const id = uid();
      setMensajes((prev) => [...prev, { ...msg, id }]);

      if (msg.agente !== "plantas") return id;

      const consulta = consultaUsuario.trim();
      if (!consulta) return id;

      try {
        const plantas = await buscarPlantasRespuesta(consulta, msg.content, historial);
        if (plantas.length > 0) {
          setMensajes((prev) => prev.map((m) => (m.id === id ? { ...m, plantas } : m)));
        }
      } catch {
        /* tarjetas opcionales */
      }
      return id;
    },
    []
  );

  const generarRecomendacion = useCallback(
    async (pad: PadecimientoSeleccionado, notas: string) => {
      setFase("recomendacion");
      setCargandoGuia(true);
      setErrorGuia(null);

      agregarMensaje({
        role: "assistant",
        content:
          "Perfecto. Estoy preparando tu **orientación** y las **plantas del catálogo** que podrían ayudarte…",
        agente: "sistema",
      });

      try {
        const texto = await llamarRecomendacion(pad, notas);
        const historial = [{ role: "user", content: pad.padecimiento }];
        const plantas = await buscarPlantasRespuesta(pad.padecimiento, texto, historial);
        setMensajes((prev) => {
          const sinEspera = prev.filter(
            (m) => !(m.agente === "sistema" && /preparando tu/i.test(m.content))
          );
          return [
            ...sinEspera,
            { id: uid(), role: "assistant", content: texto, agente: "plantas", plantas },
          ];
        });
        setFase("fin");
      } catch {
        setErrorGuia("No se pudo generar la recomendación de plantas.");
      } finally {
        setCargandoGuia(false);
      }
    },
    [agregarMensaje]
  );

  const iniciarTriaje = useCallback(
    async (pad: PadecimientoSeleccionado, mensajeOriginal?: string) => {
      setFase("triaje");
      setPadecimiento(pad);
      setCargandoGuia(true);
      setErrorGuia(null);

      const mensajePaciente = mensajeOriginal?.trim() || pad.padecimiento;
      const contextoInicial = [
        {
          role: "user",
          content: `Mensaje exacto del paciente: «${mensajePaciente}». Padecimiento interpretado: ${pad.padecimiento}. Área: ${pad.label}.`,
        },
      ];
      setMensajesTriaje(contextoInicial);

      try {
        const res = await llamarTriaje(pad, contextoInicial, "");
        setNotasTriaje(res.notasTriaje);
        setMensajesTriaje((prev) => [...prev, { role: "assistant", content: res.texto }]);
        agregarMensaje({ role: "assistant", content: res.texto, agente: "triaje" });
        if (res.triajeCompleto) await generarRecomendacion(pad, res.notasTriaje);
      } catch {
        setErrorGuia("No se pudo conectar con el especialista de triaje.");
      } finally {
        setCargandoGuia(false);
      }
    },
    [agregarMensaje, generarRecomendacion]
  );

  const procesarArbol = useCallback(
    async (texto: string) => {
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
        await iniciarTriaje(resultado.padecimiento, texto);
        return;
      }

      agregarMensaje({
        role: "assistant",
        content: resultado.mensajeAsistente,
        agente: "sistema",
        opciones: resultado.opciones,
      });
    },
    [nodoActualId, ruta, agregarMensaje, iniciarTriaje]
  );

  const procesarConsultaPlanta = useCallback(
    async (texto: string) => {
      setCargandoGuia(true);
      setErrorGuia(null);

      const historialBase = mensajes.map((m) => ({ role: m.role, content: m.content }));
      const ultimo = historialBase.at(-1);
      const historial =
        ultimo?.role === "user" && ultimo.content === texto
          ? historialBase
          : [...historialBase, { role: "user", content: texto }];

      try {
        const textoRespuesta = await llamarConsultaPlanta(historial);
        await agregarRespuestaAsistente(
          { role: "assistant", content: textoRespuesta, agente: "plantas" },
          texto,
          historial
        );
      } catch {
        setErrorGuia("No se pudo consultar la planta en el catálogo.");
      } finally {
        setCargandoGuia(false);
      }
    },
    [mensajes, agregarRespuestaAsistente]
  );

  const procesarTriaje = useCallback(
    async (texto: string) => {
      if (!padecimiento) return;

      const historial = [...mensajesTriaje, { role: "user", content: texto }];
      setMensajesTriaje(historial);
      setCargandoGuia(true);
      setErrorGuia(null);

      try {
        const res = await llamarTriaje(padecimiento, historial, notasTriaje);
        setNotasTriaje(res.notasTriaje);
        setMensajesTriaje((prev) => [...prev, { role: "assistant", content: res.texto }]);
        agregarMensaje({ role: "assistant", content: res.texto, agente: "triaje" });
        const respuestas = contarRespuestasPacienteTriaje(historial);
        const debeRecomendar =
          res.triajeCompleto ||
          evaluarTriajeCompleto(
            res.texto,
            res.texto.includes("[TRIAJE_COMPLETO]"),
            respuestas
          );
        if (debeRecomendar) await generarRecomendacion(padecimiento, res.notasTriaje);
      } catch {
        setErrorGuia("No se pudo continuar el triaje.");
      } finally {
        setCargandoGuia(false);
      }
    },
    [
      padecimiento,
      mensajesTriaje,
      notasTriaje,
      agregarRespuestaAsistente,
      generarRecomendacion,
      procesarConsultaPlanta,
      agregarMensaje,
    ]
  );

  const iniciarGuia = useCallback(
    async (textoUsuario: string) => {
      setActiva(true);
      setFase("arbol");
      setNodoActualId("raiz");
      setRuta([]);
      setPadecimiento(null);
      setNotasTriaje("");
      setMensajesTriaje([]);
      setErrorGuia(null);
      setMensajes([{ id: uid(), role: "user", content: textoUsuario }]);
      await procesarArbol(textoUsuario);
    },
    [procesarArbol]
  );

  const enviarGuia = useCallback(
    async (texto: string) => {
      const t = texto.trim();
      if (!t || cargandoGuia || fase === "recomendacion") return false;

      agregarMensaje({ role: "user", content: t });

      if (
        (fase === "triaje" || fase === "fin") &&
        esPedidoRecomendacionPlantas(t) &&
        padecimiento
      ) {
        const notas = [notasTriaje, `Paciente solicita recomendación de plantas: ${t}`]
          .filter(Boolean)
          .join("\n");
        await generarRecomendacion(padecimiento, notas);
        return true;
      }

      if (fase === "triaje" && esConsultaPlantaDirecta(t)) {
        await procesarConsultaPlanta(t);
        return true;
      }

      if (fase === "arbol") await procesarArbol(t);
      else if (fase === "triaje") await procesarTriaje(t);
      else if (fase === "fin") await procesarConsultaPlanta(t);
      return true;
    },
    [
      cargandoGuia,
      fase,
      padecimiento,
      notasTriaje,
      agregarMensaje,
      procesarArbol,
      procesarTriaje,
      procesarConsultaPlanta,
      generarRecomendacion,
    ]
  );

  const reiniciarGuia = useCallback(() => {
    setActiva(false);
    setFase(null);
    setNodoActualId("raiz");
    setRuta([]);
    setPadecimiento(null);
    setNotasTriaje("");
    setMensajesTriaje([]);
    setErrorGuia(null);
    setMensajes([]);
  }, []);

  const salirAChatLibre = useCallback(() => {
    reiniciarGuia();
  }, [reiniciarGuia]);

  const enFlujoGuia = activa && fase !== null && fase !== "fin";

  return {
    activa,
    enFlujoGuia,
    fase,
    ruta,
    padecimiento,
    mensajes,
    cargandoGuia,
    errorGuia,
    iniciarGuia,
    enviarGuia,
    reiniciarGuia,
    salirAChatLibre,
  };
}
