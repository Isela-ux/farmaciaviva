import Image from "next/image";
import Link from "next/link";
import type { PlantaCatalogo } from "@/types/database";

export function PlantCard({ planta }: { planta: PlantaCatalogo }) {
  const { nombreComun, imagenUrl, nombreCientifico } = planta;

  return (
    <Link
      href={`/planta/${nombreComun.id_especie}?nombre=${encodeURIComponent(nombreComun.nombre_comun)}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-forest/10 bg-card-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-mint-light">
        {imagenUrl ? (
          <Image
            src={imagenUrl}
            alt={nombreComun.nombre_comun}
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
        <h3 className="font-semibold text-forest group-hover:text-hero-green">
          {nombreComun.nombre_comun}
        </h3>
        {nombreCientifico && (
          <p className="text-sm italic text-earth-soft">{nombreCientifico}</p>
        )}
        <p className="mt-auto text-xs text-earth-soft">
          {nombreComun.idioma} · {nombreComun.region_uso}
        </p>
      </div>
    </Link>
  );
}
