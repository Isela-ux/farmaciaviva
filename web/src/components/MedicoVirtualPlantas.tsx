import Image from "next/image";
import Link from "next/link";
import type { PlantaMedicoVirtual } from "@/types/database";

const CARD_CLASS =
  "group flex w-full max-w-[220px] flex-col overflow-hidden rounded-xl border-2 border-sun-gold/30 bg-white shadow-md ring-1 ring-forest/5 transition hover:border-sun-gold/55 hover:shadow-lg";

export function MedicoVirtualPlantas({ plantas }: { plantas: PlantaMedicoVirtual[] }) {
  if (!plantas.length) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {plantas.map((planta) => (
        <Link
          key={planta.idEspecie}
          href={`/planta/${planta.idEspecie}?nombre=${encodeURIComponent(planta.nombreComun)}`}
          className={CARD_CLASS}
        >
          <div className="border-b border-sun-gold/20 bg-gradient-to-r from-forest-deep/5 to-sun-gold/5 px-3 py-1.5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-leaf-bright">
              Del catálogo
            </p>
          </div>
          <div className="relative aspect-[4/3] w-full bg-gradient-to-b from-mint-light/40 to-white">
            {planta.imagenUrl ? (
              <Image
                src={planta.imagenUrl}
                alt={planta.nombreComun}
                fill
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
                sizes="220px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl text-sage">🌱</div>
            )}
          </div>
          <div className="border-t border-forest/8 bg-gradient-to-r from-white to-cream/30 px-3 py-2.5 text-center">
            <p className="text-sm font-semibold leading-tight text-forest group-hover:text-leaf-bright">
              {planta.nombreComun}
            </p>
            {planta.nombreCientifico && (
              <p className="mt-0.5 line-clamp-1 text-[11px] italic text-earth-soft">
                {planta.nombreCientifico}
              </p>
            )}
            <p className="mt-1.5 text-[10px] font-medium text-sun-amber group-hover:underline">
              Ver ficha completa →
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
