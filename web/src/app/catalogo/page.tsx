import { PlantCatalog } from "@/components/PlantCatalog";
import { SupabaseErrorBanner } from "@/components/SupabaseErrorBanner";
import { obtenerCatalogoPlantas, obtenerFamilias } from "@/lib/plants";

export const metadata = {
  title: "Catálogo",
};

export default async function CatalogoPage() {
  let plantas: Awaited<ReturnType<typeof obtenerCatalogoPlantas>> = [];
  let familias: Awaited<ReturnType<typeof obtenerFamilias>> = [];
  let error: unknown = null;

  try {
    [plantas, familias] = await Promise.all([
      obtenerCatalogoPlantas(),
      obtenerFamilias(),
    ]);
  } catch (e) {
    error = e;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest">Catálogo de plantas</h1>
        <p className="mt-1 text-earth-soft">
          Explora plantas medicinales por nombre, familia o región de uso.
        </p>
      </div>

      {error ? (
        <SupabaseErrorBanner error={error} />
      ) : (
        <PlantCatalog plantas={plantas} familias={familias} />
      )}
    </div>
  );
}
