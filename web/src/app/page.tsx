import Link from "next/link";
import { PlantCard } from "@/components/PlantCard";
import { SupabaseErrorBanner } from "@/components/SupabaseErrorBanner";
import { contarEspecies, obtenerCatalogoPlantas } from "@/lib/plants";

export default async function HomePage() {
  let totalEspecies = 0;
  let destacadas: Awaited<ReturnType<typeof obtenerCatalogoPlantas>> = [];
  let errorConexion: unknown = null;

  try {
    [totalEspecies, destacadas] = await Promise.all([
      contarEspecies(),
      obtenerCatalogoPlantas(),
    ]);
    destacadas = destacadas.slice(0, 6);
  } catch (e) {
    errorConexion = e;
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-forest via-hero-green to-sage px-4 py-16 text-white sm:px-6 sm:py-24">
        <div className="relative mx-auto max-w-6xl">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-mint-light/90">
            VIC 2026
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Farmacia Viva
          </h1>
          <p className="mt-4 max-w-xl text-lg text-mint-light/95">
            Consulta el catálogo de plantas medicinales, explora fichas completas y
            realiza consultas asistidas por nuestro módulo de inteligencia artificial.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/catalogo"
              className="rounded-full bg-sun-gold px-6 py-2.5 text-sm font-semibold text-forest transition hover:bg-sun-amber"
            >
              Explorar catálogo
            </Link>
            <Link
              href="/asistente"
              className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Asistente RAG
            </Link>
          </div>
          {!errorConexion && totalEspecies > 0 && (
            <p className="mt-8 text-sm text-mint-light/80">
              {totalEspecies} especies en el catálogo
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {errorConexion ? (
          <SupabaseErrorBanner error={errorConexion} />
        ) : (
          <>
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-forest">Plantas destacadas</h2>
                <p className="text-sm text-earth-soft">
                  Una muestra del catálogo completo
                </p>
              </div>
              <Link
                href="/catalogo"
                className="text-sm font-medium text-hero-green hover:underline"
              >
                Ver todas →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {destacadas.map((planta) => (
                <PlantCard key={planta.nombreComun.id_nombre_comun} planta={planta} />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="border-t border-forest/10 bg-botanical px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
          {[
            {
              icon: "📚",
              title: "Catálogo completo",
              text: "Más de 500 plantas con nombres comunes, datos botánicos y taxonomía.",
            },
            {
              icon: "📋",
              title: "Fichas detalladas",
              text: "Usos, propiedades, compuestos, hábitat, ubicación y bibliografía.",
            },
            {
              icon: "🤖",
              title: "Asistente RAG",
              text: "Consultas en lenguaje natural con recuperación de contexto desde pgvector.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-forest/10 bg-card-white p-6 shadow-sm"
            >
              <span className="text-2xl">{item.icon}</span>
              <h3 className="mt-3 font-semibold text-forest">{item.title}</h3>
              <p className="mt-1 text-sm text-earth-soft">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
