"use client";

import { useCallback, useState } from "react";
import {
  esConsultaPlantaDirecta,
  esConsultaSeguimientoPlanta,
  esIntentoManipulacionAgente,
  esPedidoRecomendacionPlantas,
  esRespuestaTriaje,
  interpretarEntradaGuia,
  type PadecimientoSeleccionado,
} from "@/lib/arbol-padecimientos";
import {
  contarRespuestasPacienteTriaje,
  debeGenerarRecomendacion,
  prometeRecomendacion,
} from "@/lib/medico-agentes";
import {
  aplicarPrecaucionATexto,
  evaluarGuardrailClinico,
  type ResultadoGuardrail,
} from "@/lib/guardrails-clinicos";
import { evaluarGuardrailArbol } from "@/lib/guardrails-arbol";
import { evaluarFiltroEntrada, esOpcionArbolId } from "@/lib/filtro-entrada-agente";
import {
  debeEscalarPorFallos,
  MAX_REINTENTOS_AGENTE,
  mensajeEscalamientoPorFallos,
  MENSAJE_ERROR_CONSULTA_PLANTA,
  MENSAJE_ERROR_RECOMENDACION,
  MENSAJE_ERROR_TRIAJE,
} from "@/lib/agente-errores";
import { registrarEventoAgente } from "@/lib/agente-observabilidad";
import type { PlantaMedicoVirtual } from "@/types/database";

export type FaseGuia = "arbol" | "triaje" | "recomendacion" | "fin";

export type MensajeGuia = {
  id: string;
  role: "user" | "assistant";
  content: string;
  agente?: "sistema" | "triaje" | "plantas" | "alarma";
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

function idsPlantasRecientes(mensajes: MensajeGuia[]): number[] {
  for (let i = mensajes.length - 1; i >= 0; i--) {
    const m = mensajes[i];
    if (m.role === "assistant" && m.plantas?.length) {
      return m.plantas.map((p) => p.idEspecie);
    }
  }
  return [];
}

async function llamarConsultaPlanta(
  mensajes: { role: string; content: string }[],
  plantasContextoIds: number[] = []
): Promise<{ texto: string; plantas: PlantaMedicoVirtual[] }> {
  const res = await fetch("/api/chat/guia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fase: "consulta_planta",
      messages: mensajes,
      plantasContextoIds,
    }),
  });
  if (!res.ok) throw new Error("consulta_planta");
  const data = (await res.json()) as { texto?: string; plantas?: PlantaMedicoVirtual[] };
  return { texto: data.texto ?? "", plantas: data.plantas ?? [] };
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
): Promise<{ texto: string; plantas: PlantaMedicoVirtual[]; alarma?: boolean }> {
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
  const data = (await res.json()) as {
    texto?: string;
    plantas?: PlantaMedicoVirtual[];
    alarma?: boolean;
  };
  return { texto: data.texto ?? "", plantas: data.plantas ?? [], alarma: data.alarma };
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
  const [guardrailPrecaucion, setGuardrailPrecaucion] = useState<string | null>(null);
  const [intentosFallidos, setIntentosFallidos] = useState(0);

  const agregarMensaje = useCallback((msg: Omit<MensajeGuia, "id">) => {
    setMensajes((prev) => [...prev, { ...msg, id: uid() }]);
  }, []);

  const reiniciarFallos = useCallback(() => setIntentosFallidos(0), []);

  const registrarFalloApi = useCallback((origen: string, mensaje: string) => {
    setIntentosFallidos((n) => {
      const next = n + 1;
      registrarEventoAgente("error_api", { origen, intento: next });
      if (debeEscalarPorFallos(next)) {
        registrarEventoAgente("reintento_agotado", { origen, max: MAX_REINTENTOS_AGENTE });
        setErrorGuia(mensajeEscalamientoPorFallos(next));
        setFase("fin");
      } else {
        setErrorGuia(mensaje);
      }
      return next;
    });
  }, []);

  const rechazarEntrada = useCallback(
    (filtro: { permitido: false; mensaje: string; razon: "off_topic" | "prompt_injection" }) => {
      registrarEventoAgente(
        filtro.razon === "prompt_injection" ? "filtro_injection" : "filtro_off_topic"
      );
      agregarMensaje({ role: "assistant", content: filtro.mensaje, agente: "sistema" });
      setFase("fin");
    },
    [agregarMensaje]
  );

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

  const mensajesParaGuardrail = useCallback(
    (): { role: string; content: string }[] => [
      ...mensajesTriaje,
      ...mensajes.map((m) => ({ role: m.role, content: m.content })),
    ],
    [mensajesTriaje, mensajes]
  );

  const activarEscalamientoUrgente = useCallback(
    (resultado: ResultadoGuardrail) => {
      registrarEventoAgente("guardrail_urgente", { motivos: resultado.motivos });
      setFase("fin");
      setCargandoGuia(false);
      setGuardrailPrecaucion(null);
      agregarMensaje({
        role: "assistant",
        content: resultado.mensajeEscalamiento,
        agente: "alarma",
      });
    },
    [agregarMensaje]
  );

  const revisarGuardrail = useCallback(
    (textoAdicional?: string): ResultadoGuardrail | null => {
      const resultado = evaluarGuardrailClinico(mensajesParaGuardrail(), textoAdicional);
      if (resultado.nivel === "urgente") {
        activarEscalamientoUrgente(resultado);
        return resultado;
      }
      if (resultado.nivel === "precaucion" && resultado.mensajePrecaucion) {
        registrarEventoAgente("guardrail_precaucion", { motivos: resultado.motivos });
        setGuardrailPrecaucion(resultado.mensajePrecaucion);
      }
      return resultado.nivel === "ninguno" ? null : resultado;
    },
    [mensajesParaGuardrail, activarEscalamientoUrgente]
  );

  const generarRecomendacion = useCallback(
    async (pad: PadecimientoSeleccionado, notas: string) => {
      const guardrail = evaluarGuardrailClinico(mensajesParaGuardrail(), notas);
      if (guardrail.nivel === "urgente") {
        activarEscalamientoUrgente(guardrail);
        return;
      }

      const avisoPrecaucion =
        guardrail.mensajePrecaucion ?? guardrailPrecaucion ?? undefined;

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
        const { texto, plantas, alarma } = await llamarRecomendacion(pad, notas);
        if (!texto.trim()) {
          throw new Error("Respuesta vacía del servidor");
        }
        if (alarma) {
          setMensajes((prev) => {
            const sinEspera = prev.filter(
              (m) => !(m.agente === "sistema" && /preparando tu/i.test(m.content))
            );
            return [
              ...sinEspera,
              { id: uid(), role: "assistant", content: texto, agente: "alarma" },
            ];
          });
          setFase("fin");
          setGuardrailPrecaucion(null);
          return;
        }
        const textoFinal = aplicarPrecaucionATexto(texto, avisoPrecaucion);
        setMensajes((prev) => {
          const sinEspera = prev.filter(
            (m) => !(m.agente === "sistema" && /preparando tu/i.test(m.content))
          );
          return [
            ...sinEspera,
            {
              id: uid(),
              role: "assistant",
              content: textoFinal,
              agente: "plantas",
              plantas,
            },
          ];
        });
        setFase("fin");
        setGuardrailPrecaucion(null);
        reiniciarFallos();
      } catch {
        registrarFalloApi("recomendacion", MENSAJE_ERROR_RECOMENDACION);
        setFase("triaje");
      } finally {
        setCargandoGuia(false);
      }
    },
    [
      agregarMensaje,
      mensajesParaGuardrail,
      activarEscalamientoUrgente,
      guardrailPrecaucion,
      registrarFalloApi,
      reiniciarFallos,
    ]
  );

  const iniciarTriaje = useCallback(
    async (pad: PadecimientoSeleccionado, mensajeOriginal?: string) => {
      const mensajePaciente = mensajeOriginal?.trim() || pad.padecimiento;
      if (revisarGuardrail(mensajePaciente)?.nivel === "urgente") return;

      setFase("triaje");
      setPadecimiento(pad);
      setCargandoGuia(true);
      setErrorGuia(null);

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
        const respuestas = contarRespuestasPacienteTriaje(contextoInicial);
        if (debeGenerarRecomendacion(res.texto, respuestas, res.triajeCompleto)) {
          await generarRecomendacion(pad, res.notasTriaje);
        }
      } catch {
        setErrorGuia("No se pudo conectar con el especialista de triaje.");
      } finally {
        setCargandoGuia(false);
      }
    },
    [agregarMensaje, generarRecomendacion, revisarGuardrail]
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

        const alarmaArbol = evaluarGuardrailArbol(texto, resultado.padecimiento);
        if (alarmaArbol?.nivel === "urgente") {
          activarEscalamientoUrgente(alarmaArbol);
          return;
        }
        if (alarmaArbol?.nivel === "precaucion" && alarmaArbol.mensajePrecaucion) {
          setGuardrailPrecaucion(alarmaArbol.mensajePrecaucion);
        }

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
    [nodoActualId, ruta, agregarMensaje, iniciarTriaje, activarEscalamientoUrgente]
  );

  const procesarConsultaPlanta = useCallback(
    async (texto: string) => {
      setCargandoGuia(true);
      setErrorGuia(null);

      try {
        const plantasContextoIds = esConsultaSeguimientoPlanta(texto)
          ? idsPlantasRecientes(mensajes)
          : [];
        const historialBase = mensajes.map((m) => ({ role: m.role, content: m.content }));
        const ultimo = historialBase.at(-1);
        const historial =
          ultimo?.role === "user" && ultimo.content === texto
            ? historialBase
            : [...historialBase, { role: "user", content: texto }];

        const { texto: textoRespuesta, plantas } = await llamarConsultaPlanta(
          historial,
          plantasContextoIds
        );

        const id = uid();
        setMensajes((prev) => [
          ...prev,
          {
            id,
            role: "assistant",
            content: textoRespuesta,
            agente: "plantas",
            plantas: plantas.length > 0 ? plantas : undefined,
          },
        ]);

        if (!plantas.length && textoRespuesta.trim()) {
          const plantasExtra = await buscarPlantasRespuesta(texto, textoRespuesta, historial);
          if (plantasExtra.length > 0) {
            setMensajes((prev) =>
              prev.map((m) => (m.id === id ? { ...m, plantas: plantasExtra } : m))
            );
          }
        }
      } catch {
        registrarFalloApi("consulta_planta", MENSAJE_ERROR_CONSULTA_PLANTA);
      } finally {
        setCargandoGuia(false);
      }
    },
    [mensajes, agregarRespuestaAsistente]
  );

  const procesarTriaje = useCallback(
    async (texto: string) => {
      if (!padecimiento) return;
      if (revisarGuardrail(texto)?.nivel === "urgente") return;

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
        if (debeGenerarRecomendacion(res.texto, respuestas, res.triajeCompleto)) {
          await generarRecomendacion(padecimiento, res.notasTriaje);
        }
        reiniciarFallos();
      } catch {
        registrarFalloApi("triaje", MENSAJE_ERROR_TRIAJE);
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
      revisarGuardrail,
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
      setGuardrailPrecaucion(null);
      setErrorGuia(null);
      setMensajes([{ id: uid(), role: "user", content: textoUsuario }]);

      const filtro = evaluarFiltroEntrada(textoUsuario, { inicioGuia: true });
      if (!filtro.permitido) {
        rechazarEntrada(filtro);
        return;
      }

      const alarma = evaluarGuardrailArbol(textoUsuario);
      if (alarma?.nivel === "urgente") {
        activarEscalamientoUrgente(alarma);
        return;
      }

      await procesarArbol(textoUsuario);
    },
    [procesarArbol, rechazarEntrada, activarEscalamientoUrgente]
  );

  const enviarGuia = useCallback(
    async (texto: string) => {
      const t = texto.trim();
      if (!t || cargandoGuia || fase === "recomendacion") return false;

      agregarMensaje({ role: "user", content: t });

      if (revisarGuardrail(t)?.nivel === "urgente") return true;

      const omitirFiltro =
        !esIntentoManipulacionAgente(t) &&
        (esOpcionArbolId(t) ||
          esConsultaPlantaDirecta(t) ||
          esPedidoRecomendacionPlantas(t) ||
          (fase === "triaje" && esRespuestaTriaje(t)));

      if (!omitirFiltro) {
        const filtro = evaluarFiltroEntrada(t, {
          enTriaje: fase === "triaje",
          inicioGuia: fase === "arbol" && nodoActualId === "raiz" && ruta.length === 0,
        });
        if (!filtro.permitido) {
          rechazarEntrada(filtro);
          return true;
        }
      }

      // Recuperación: resumen prometió plantas pero no llegaron
      if (fase === "triaje" && padecimiento) {
        const yaHayRecomendacion = mensajes.some((m) => m.agente === "plantas");
        const ultimoTriaje = [...mensajes].reverse().find((m) => m.agente === "triaje");
        if (!yaHayRecomendacion && ultimoTriaje && prometeRecomendacion(ultimoTriaje.content)) {
          await generarRecomendacion(padecimiento, notasTriaje);
          return true;
        }
      }

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
      nodoActualId,
      ruta,
      padecimiento,
      notasTriaje,
      mensajes,
      agregarMensaje,
      procesarArbol,
      procesarTriaje,
      procesarConsultaPlanta,
      generarRecomendacion,
      rechazarEntrada,
      revisarGuardrail,
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
    setGuardrailPrecaucion(null);
    setErrorGuia(null);
    setMensajes([]);
    reiniciarFallos();
  }, [reiniciarFallos]);

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
