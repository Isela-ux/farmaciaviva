import Image from "next/image";
import Link from "next/link";
import type { PlantaCatalogo } from "@/types/database";

export function PlantCard({ planta }: { planta: PlantaCatalogo }) {
  const { nombreComun, imagenUrl, nombreCientifico } = planta;

  return (
    <Link
      href={`/planta/${nombreComun.id_especie}?nombre=${encodeURIComponent(nombreComun.nombre_comun)}`}
      className="group flex flex-col overflow-hidden rounded-xl border-2 border-sun-gold/20 bg-card-white shadow-sm ring-1 ring-forest/5 outline-none transition hover:-translate-y-0.5 hover:border-sun-gold/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-sun-gold/50 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] bg-gradient-to-b from-mint-light/50 to-white">
        {imagenUrl ? (
          <Image
            src={imagenUrl}
            alt={
              nombreCientifico
                ? `${nombreComun.nombre_comun} (${nombreCientifico})`
                : nombreComun.nombre_comun
            }
            fill
            className="object-cover transition group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-sage">🌱</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-semibold text-forest group-hover:text-leaf-bright">
          {nombreComun.nombre_comun}
        </h3>
        {nombreCientifico && (
          <p className="text-sm italic text-earth-soft">{nombreCientifico}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-1.5">
          {planta.nombreFamilia && (
            <span className="rounded-md border border-sun-gold/25 bg-cream/80 px-2 py-0.5 text-xs font-medium text-forest">
              {planta.nombreFamilia}
            </span>
          )}
          <span className="rounded-md border border-forest/10 bg-botanical px-2 py-0.5 text-xs text-earth-soft">
            {nombreComun.region_uso}
          </span>
        </div>
      </div>
    </Link>
  );
}
