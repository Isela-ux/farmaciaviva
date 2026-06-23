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
      <section className="relative overflow-hidden border-b-2 border-sun-gold/30 bg-gradient-to-br from-academic-navy via-forest to-leaf-bright px-4 py-16 text-white sm:px-6 sm:py-24">
        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-start gap-4">
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-sun-gold/20 text-2xl ring-2 ring-sun-gold/40 sm:flex">
              🌿
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sun-gold">
                Farmacia Viva · VIC 2026
              </p>
              <h1 className="mt-1 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
                Plantas medicinales de México
              </h1>
              <p className="mt-4 max-w-xl text-lg text-mint/95">
                Consulta el catálogo, explora fichas completas y realiza consultas con
                nuestro Médico Virtual sobre usos y propiedades botánicas.
              </p>
            </div>
          </div>
          <div className="mt-6 h-1 w-20 rounded-full bg-gradient-to-r from-sun-gold to-sun-amber" />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/catalogo"
              className="rounded-xl bg-gradient-to-r from-sun-gold to-sun-amber px-6 py-2.5 text-sm font-semibold text-forest shadow-md transition hover:brightness-105"
            >
              Explorar catálogo
            </Link>
            <Link
              href="/asistente"
              className="rounded-xl border-2 border-sun-gold/50 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Médico Virtual
            </Link>
          </div>
          {!errorConexion && totalEspecies > 0 && (
            <p className="mt-8 inline-block rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-mint-light">
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
            <div className="mb-8 flex items-end justify-between gap-4 border-b border-sun-gold/25 pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-sun-amber">
                  Catálogo
                </p>
                <h2 className="mt-1 text-2xl font-bold text-forest">Plantas destacadas</h2>
                <p className="text-sm text-earth-soft">Una muestra del catálogo completo</p>
              </div>
              <Link
                href="/catalogo"
                className="text-sm font-semibold text-leaf-bright hover:text-sun-amber hover:underline"
              >
                Ver todas →
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destacadas.map((planta) => (
                <PlantCard key={planta.nombreComun.id_nombre_comun} planta={planta} />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="border-t-2 border-sun-gold/20 bg-gradient-to-b from-botanical to-page-bg/50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sun-amber">
              Plataforma
            </p>
            <h2 className="mt-1 text-2xl font-bold text-forest">¿Qué puedes hacer?</h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-sun-gold to-sun-amber" />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: "📚",
                title: "Catálogo completo",
                text: "Cientos de plantas con nombres comunes, datos botánicos y taxonomía.",
              },
              {
                icon: "📋",
                title: "Fichas detalladas",
                text: "Usos, propiedades, compuestos, hábitat, ubicación y bibliografía.",
              },
              {
                icon: "🩺",
                title: "Médico Virtual",
                text: "Consultas en lenguaje natural con imágenes e información del catálogo.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="overflow-hidden rounded-xl border-2 border-sun-gold/25 bg-white shadow-sm ring-1 ring-forest/5 transition hover:border-sun-gold/45 hover:shadow-md"
              >
                <div className="border-b border-sun-gold/20 bg-gradient-to-r from-forest/5 to-cream/50 px-5 py-3">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-forest">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-earth-soft">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
