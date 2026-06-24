import Image from "next/image";
import Link from "next/link";
import { SectionCard } from "@/components/SectionCard";
import { etiquetaEspecie } from "@/lib/images";
import { etiquetaMetadatosUbicacion } from "@/lib/plants";
import type { FichaPlanta } from "@/types/database";

export function PlantDetailView({
  ficha,
  nombreDestacado,
}: {
  ficha: FichaPlanta;
  nombreDestacado?: string;
}) {
  const { especie, imagenes, nombresComunes, genero, familia } = ficha;
  const titulo =
    nombreDestacado ||
    nombresComunes[0]?.nombre_comun ||
    etiquetaEspecie(especie);

  return (
    <article className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/catalogo"
            className="text-sm text-hero-green outline-none hover:underline focus-visible:ring-2 focus-visible:ring-sun-gold/50 focus-visible:ring-offset-2"
          >
            ← Volver al catálogo
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-forest">{titulo}</h1>
          <p className="text-lg italic text-earth-soft">
            {etiquetaEspecie(especie)}
          </p>
          {(genero || familia) && (
            <p className="mt-1 text-sm text-earth-soft">
              {[familia?.nombre_familia, genero?.nombre_genero]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
        <Link
          href={`/asistente?planta=${especie.id_especie}&nombre=${encodeURIComponent(titulo)}`}
          className="inline-flex items-center justify-center rounded-full bg-sun-gold px-4 py-2 text-sm font-medium text-forest outline-none transition hover:bg-sun-amber focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
        >
          Consultar al Médico Virtual
        </Link>
      </div>

      {imagenes.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {imagenes.slice(0, 3).map((img, index) => (
            <div
              key={img.id_imagen}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-mint-light"
            >
              <Image
                src={img.url_imagen}
                alt={
                  index === 0
                    ? `Fotografía de ${titulo}`
                    : `${titulo} — imagen ${index + 1}`
                }
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                unoptimized
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex aspect-[21/9] items-center justify-center rounded-2xl border border-dashed border-forest/15 bg-mint-light/50 text-5xl">
          🌱
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {especie.descripcion_botanica && (
          <SectionCard title="Descripción botánica">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-earth">
              {especie.descripcion_botanica}
            </p>
          </SectionCard>
        )}

        <SectionCard title="Datos generales">
          <dl className="grid gap-2 text-sm">
            {especie.tipo_planta && (
              <>
                <dt className="font-medium text-forest">Tipo</dt>
                <dd className="text-earth-soft">{especie.tipo_planta}</dd>
              </>
            )}
            {especie.ciclo_vida && (
              <>
                <dt className="font-medium text-forest">Ciclo de vida</dt>
                <dd className="text-earth-soft">{especie.ciclo_vida}</dd>
              </>
            )}
            {especie.origen_geografico && (
              <>
                <dt className="font-medium text-forest">Origen</dt>
                <dd className="text-earth-soft">{especie.origen_geografico}</dd>
              </>
            )}
            {especie.estatus_conservacion && (
              <>
                <dt className="font-medium text-forest">Conservación</dt>
                <dd className="text-earth-soft">{especie.estatus_conservacion}</dd>
              </>
            )}
            {especie.es_endemica != null && (
              <>
                <dt className="font-medium text-forest">Endémica</dt>
                <dd className="text-earth-soft">{especie.es_endemica ? "Sí" : "No"}</dd>
              </>
            )}
          </dl>
        </SectionCard>
      </div>

      {nombresComunes.length > 0 && (
        <SectionCard title="Nombres comunes">
          <ul className="flex flex-wrap gap-2">
            {nombresComunes.map((n) => (
              <li
                key={n.id_nombre_comun}
                className="rounded-full bg-mint-light px-3 py-1 text-sm text-forest"
              >
                {n.nombre_comun}{" "}
                <span className="text-earth-soft">
                  ({n.idioma}, {n.region_uso})
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {ficha.usos.length > 0 && (
        <SectionCard title="Usos medicinales">
          <ul className="space-y-4">
            {ficha.usos.map((uso) => {
              const cat = uso.id_categoria_uso
                ? ficha.categoriasUso.get(uso.id_categoria_uso)
                : null;
              return (
                <li
                  key={uso.id_uso}
                  className="rounded-xl border border-forest/5 bg-botanical p-4"
                >
                  {cat && (
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-hero-green">
                      {cat.nombre_categoria}
                    </p>
                  )}
                  {uso.descripcion_uso && (
                    <p className="text-sm text-earth">{uso.descripcion_uso}</p>
                  )}
                  <dl className="mt-2 grid gap-1 text-xs text-earth-soft sm:grid-cols-2">
                    {uso.parte_utilizada && (
                      <>
                        <dt>Parte utilizada</dt>
                        <dd>{uso.parte_utilizada}</dd>
                      </>
                    )}
                    {uso.forma_preparacion && (
                      <>
                        <dt>Preparación</dt>
                        <dd>{uso.forma_preparacion}</dd>
                      </>
                    )}
                    {uso.via_administracion && (
                      <>
                        <dt>Vía</dt>
                        <dd>{uso.via_administracion}</dd>
                      </>
                    )}
                    {uso.riesgos_contraindicaciones && (
                      <>
                        <dt className="text-accent-coral">Riesgos</dt>
                        <dd className="text-accent-coral">{uso.riesgos_contraindicaciones}</dd>
                      </>
                    )}
                  </dl>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}

      {ficha.propiedades.length > 0 && (
        <SectionCard title="Propiedades">
          <ul className="space-y-3">
            {ficha.propiedades.map((ep) => {
              const prop = ficha.catalogoPropiedades.get(ep.id_propiedad);
              return (
                <li key={ep.id_especie_propiedad} className="text-sm">
                  <span className="font-medium text-forest">
                    {prop?.nombre_propiedad ?? `Propiedad #${ep.id_propiedad}`}
                  </span>
                  {prop?.descripcion && (
                    <p className="text-earth-soft">{prop.descripcion}</p>
                  )}
                  {ep.nivel_evidencia && (
                    <p className="text-xs text-earth-soft">
                      Evidencia: {ep.nivel_evidencia}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}

      {ficha.compuestos.length > 0 && (
        <SectionCard title="Compuestos activos">
          <ul className="space-y-2 text-sm">
            {ficha.compuestos.map((ec) => {
              const comp = ficha.catalogoCompuestos.get(ec.id_compuesto);
              return (
                <li key={ec.id_especie_compuesto}>
                  <span className="font-medium text-forest">
                    {comp?.nombre_compuesto ?? `Compuesto #${ec.id_compuesto}`}
                  </span>
                  {ec.concentracion && (
                    <span className="text-earth-soft"> — {ec.concentracion}</span>
                  )}
                  {comp?.descripcion && (
                    <p className="text-earth-soft">{comp.descripcion}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}

      {ficha.habitats.length > 0 && (
        <SectionCard title="Hábitat">
          <ul className="space-y-2 text-sm">
            {ficha.habitats.map((eh) => {
              const hab = ficha.catalogoHabitats.get(eh.id_habitat);
              return (
                <li key={eh.id_especie_habitat}>
                  <span className="font-medium text-forest">
                    {hab?.nombre_habitat ?? `Hábitat #${eh.id_habitat}`}
                  </span>
                  {hab?.descripcion && (
                    <p className="text-earth-soft">{hab.descripcion}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}

      {ficha.ubicacionesAgrupadas.length > 0 && (
        <SectionCard title="Ubicación geográfica">
          <ul className="space-y-3 text-sm">
            {ficha.ubicacionesAgrupadas.map((grupo) => {
              const metadatos = etiquetaMetadatosUbicacion(grupo);
              return (
                <li key={`${grupo.tituloZona}|${metadatos}`}>
                  <span className="font-medium text-forest">{grupo.tituloZona}</span>
                  {grupo.localidades.length > 0 && (
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-earth">
                      {grupo.localidades.map((localidad) => (
                        <li key={localidad}>{localidad}</li>
                      ))}
                    </ul>
                  )}
                  {metadatos && (
                    <p className="mt-0.5 text-xs text-earth-soft">{metadatos}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}

      {ficha.fuentes.length > 0 && (
        <SectionCard title="Bibliografía">
          <ul className="space-y-3 text-sm">
            {ficha.fuentes.map((df) => {
              const fuente = ficha.catalogoFuentes.get(df.id_fuente);
              return (
                <li key={df.id_detalle_fuente} className="border-l-2 border-sage pl-3">
                  <p className="font-medium text-forest">
                    {fuente?.titulo ?? `Fuente #${df.id_fuente}`}
                  </p>
                  {fuente?.autores && (
                    <p className="text-earth-soft">{fuente.autores}</p>
                  )}
                  {df.cita_textual_resumida && (
                    <p className="mt-1 italic text-earth">{df.cita_textual_resumida}</p>
                  )}
                  {fuente?.url && (
                    <a
                      href={fuente.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-hero-green hover:underline"
                    >
                      Ver fuente
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}
    </article>
  );
}
