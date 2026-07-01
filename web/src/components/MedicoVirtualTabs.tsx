"use client";

import { useState } from "react";
import { ChatAssistant } from "@/components/ChatAssistant";
import { MedicoVirtualGuia } from "@/components/MedicoVirtualGuia";
import type { PlantaMedicoVirtual } from "@/types/database";

type Modo = "libre" | "guia";

export function MedicoVirtualTabs({
  plantaId,
  nombrePlanta,
  plantaInicial,
}: {
  plantaId?: number;
  nombrePlanta?: string;
  plantaInicial?: PlantaMedicoVirtual | null;
}) {
  /** Sin planta concreta → abrir la guía por síntomas (árbol de decisiones). */
  const [modo, setModo] = useState<Modo>(plantaId ? "libre" : "guia");

  return (
    <div className="flex min-h-[calc(100dvh-3.25rem)] flex-1 flex-col">
      <div className="shrink-0 border-b border-forest/10 bg-botanical px-4 py-3 sm:px-6">
        <div
          className="mx-auto flex max-w-6xl flex-col gap-2"
          role="tablist"
          aria-label="Modo del Médico Virtual"
        >
          <p className="text-center text-xs text-earth">
            {modo === "guia"
              ? "Modo guía: te haremos preguntas antes de sugerir plantas."
              : "Modo consulta libre: pregunta directamente por una planta o síntoma."}
          </p>
          <div className="flex gap-1 rounded-xl border border-forest/10 bg-white p-1">
            <button
              type="button"
              role="tab"
              aria-selected={modo === "guia"}
              onClick={() => setModo("guia")}
              className={`relative flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-sun-gold/50 ${
                modo === "guia"
                  ? "bg-gradient-to-r from-forest to-leaf-bright text-white shadow-sm"
                  : "text-forest hover:bg-cream"
              }`}
            >
              Guía por síntomas
              {!plantaId && (
                <span className="ml-1.5 hidden rounded bg-sun-gold/90 px-1.5 py-0.5 text-[10px] font-bold uppercase text-forest sm:inline">
                  Empieza aquí
                </span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={modo === "libre"}
              onClick={() => setModo("libre")}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-sun-gold/50 ${
                modo === "libre"
                  ? "bg-gradient-to-r from-forest to-leaf-bright text-white shadow-sm"
                  : "text-forest hover:bg-cream"
              }`}
            >
              Consulta libre
            </button>
          </div>
        </div>
      </div>

      {modo === "libre" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {!plantaId && (
            <div className="shrink-0 border-b border-sun-gold/30 bg-cream/80 px-4 py-2.5 text-center text-xs text-forest sm:px-6">
              ¿Dices «Tengo dolor» o no sabes qué planta buscar?{" "}
              <button
                type="button"
                onClick={() => setModo("guia")}
                className="font-semibold text-leaf-bright underline hover:text-forest"
              >
                Usa la Guía por síntomas →
              </button>
            </div>
          )}
          <ChatAssistant
            plantaId={plantaId}
            nombrePlanta={nombrePlanta}
            plantaInicial={plantaInicial}
          />
        </div>
      ) : (
        <MedicoVirtualGuia />
      )}
    </div>
  );
}
