import { notFound } from "next/navigation";
import { PlantDetailView } from "@/components/PlantDetailView";
import { obtenerFichaPlanta } from "@/lib/plants";
import { etiquetaEspecie } from "@/lib/images";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nombre?: string }>;
}) {
  const { id } = await params;
  const { nombre } = await searchParams;
  const idEspecie = Number(id);

  if (!Number.isFinite(idEspecie)) return { title: "Planta no encontrada" };

  try {
    const ficha = await obtenerFichaPlanta(idEspecie);
    if (!ficha) return { title: "Planta no encontrada" };
    const titulo =
      nombre || ficha.nombresComunes[0]?.nombre_comun || etiquetaEspecie(ficha.especie);
    return {
      title: titulo,
      description: ficha.especie.descripcion_botanica?.slice(0, 160),
    };
  } catch {
    return { title: "Planta" };
  }
}

export default async function PlantaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nombre?: string }>;
}) {
  const { id } = await params;
  const { nombre } = await searchParams;
  const idEspecie = Number(id);

  if (!Number.isFinite(idEspecie)) notFound();

  let ficha;
  try {
    ficha = await obtenerFichaPlanta(idEspecie);
  } catch {
    notFound();
  }

  if (!ficha) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PlantDetailView ficha={ficha} nombreDestacado={nombre} />
    </div>
  );
}
