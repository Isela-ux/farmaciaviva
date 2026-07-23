import { FormularioComentarios } from "@/components/FormularioComentarios";
import { PlantCatalog } from "@/components/PlantCatalog";
import { SupabaseErrorBanner } from "@/components/SupabaseErrorBanner";
import { contarEspecies, obtenerCatalogoPlantas, obtenerFamilias } from "@/lib/plants";

export const metadata = {
  title: "Catálogo",
};

export default async function CatalogoPage() {
  let plantas: Awaited<ReturnType<typeof obtenerCatalogoPlantas>> = [];
  let familias: Awaited<ReturnType<typeof obtenerFamilias>> = [];
  let totalEspecies = 0;
  let error: unknown = null;

  try {
    [plantas, familias, totalEspecies] = await Promise.all([
      obtenerCatalogoPlantas(),
      obtenerFamilias(),
      contarEspecies(),
    ]);
  } catch (e) {
    error = e;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest">Catálogo de plantas</h1>
        <p className="mt-1 text-earth-soft">
          {totalEspecies > 0
            ? `${totalEspecies} especies medicinales con búsqueda, filtros por familia y región.`
            : "Explora plantas medicinales por nombre, familia o región de uso."}
        </p>
      </div>

      {error ? (
        <SupabaseErrorBanner error={error} />
      ) : (
        <PlantCatalog plantas={plantas} familias={familias} totalEspecies={totalEspecies} />
      )}

      <div className="mt-12 border-t border-forest/8 pt-10">
        <FormularioComentarios pagina="/catalogo" />
      </div>
    </div>
  );
}
