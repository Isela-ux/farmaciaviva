import type { ReactNode } from "react";
import { presentacionAgente } from "@/lib/medico-virtual-presentacion";
import type { MensajeGuia } from "@/hooks/useMedicoGuia";

export function MedicoVirtualBubbleUsuario({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[82%] rounded-2xl rounded-br-sm bg-gradient-to-br from-forest via-forest to-leaf-bright px-4 py-3 text-sm leading-relaxed text-white shadow-lg shadow-forest/20 lg:max-w-[58%]">
      {children}
    </div>
  );
}

export function MedicoVirtualBubbleAsistente({
  agente,
  children,
  footer,
}: {
  agente?: MensajeGuia["agente"];
  children: ReactNode;
  footer?: ReactNode;
}) {
  const pres = presentacionAgente(agente);

  if (!pres) {
    return (
      <div className="w-full max-w-3xl space-y-3 rounded-2xl rounded-bl-sm border border-forest/10 bg-white p-4 text-sm text-forest shadow-sm">
        {children}
        {footer}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-3xl gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cream to-mint-light/50 text-xl shadow-sm ring-2 ring-white"
        aria-hidden
      >
        {pres.avatar}
      </div>
      <div className={`min-w-0 flex-1 space-y-2 rounded-2xl rounded-tl-sm border p-4 text-sm text-forest ${pres.bubbleClass}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pres.badgeClass}`}>
            {pres.nombre}
          </span>
          <span className="text-[11px] text-earth-soft">{pres.subtitulo}</span>
        </div>
        <div className="leading-relaxed">{children}</div>
        {footer}
      </div>
    </div>
  );
}
