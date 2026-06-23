import { ChatAssistant } from "@/components/ChatAssistant";
import { obtenerPlantasPorIds } from "@/lib/plants";

export const metadata = {
  title: "Médico Virtual",
  description:
    "Consultas sobre plantas medicinales con información del catálogo de Farmacia Viva.",
};

export default async function MedicoVirtualPage({
  searchParams,
}: {
  searchParams: Promise<{ planta?: string; nombre?: string }>;
}) {
  const { planta, nombre } = await searchParams;
  const plantaId = planta ? Number(planta) : undefined;
  const idValido = plantaId != null && Number.isFinite(plantaId) ? plantaId : undefined;

  let plantaInicial = null;
  if (idValido) {
    const plantas = await obtenerPlantasPorIds([idValido]);
    plantaInicial = plantas[0] ?? null;
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.25rem)] flex-1 flex-col">
      <ChatAssistant
        plantaId={idValido}
        nombrePlanta={nombre?.trim() || plantaInicial?.nombreComun}
        plantaInicial={plantaInicial}
      />
    </div>
  );
}
