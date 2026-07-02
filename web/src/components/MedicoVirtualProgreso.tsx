import { PASOS_PROGRESO, type ProgresoVisual } from "@/lib/medico-virtual-presentacion";

export function MedicoVirtualProgreso({ progreso }: { progreso: ProgresoVisual }) {
  return (
    <div className="shrink-0 border-b border-forest/6 bg-gradient-to-r from-white via-cream/40 to-mint-light/20 px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-1">
        {PASOS_PROGRESO.map((paso) => {
          const activo = paso.id === progreso.pasoActual;
          const completado = paso.id < progreso.pasoActual;
          return (
            <div key={paso.id} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition-all duration-300 ${
                  activo
                    ? "scale-110 bg-gradient-to-br from-forest to-leaf-bright text-white shadow-md shadow-forest/25 ring-2 ring-sun-gold/40"
                    : completado
                      ? "bg-leaf-bright/15 text-leaf-bright ring-1 ring-leaf-bright/30"
                      : "bg-white text-earth-soft ring-1 ring-forest/10"
                }`}
                aria-hidden
              >
                {completado ? "✓" : paso.icono}
              </div>
              <span
                className={`text-[10px] font-medium sm:text-xs ${
                  activo ? "text-forest" : completado ? "text-leaf-bright" : "text-earth-soft"
                }`}
              >
                {paso.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-sm font-semibold text-forest">{progreso.titulo}</p>
      {progreso.detalle && (
        <p className="mt-0.5 text-center text-xs text-earth-soft">{progreso.detalle}</p>
      )}
    </div>
  );
}
