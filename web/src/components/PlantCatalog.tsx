"use client";

import { useEffect, useMemo, useState } from "react";
import { PlantCard } from "@/components/PlantCard";
import type { Familia, PlantaCatalogo } from "@/types/database";

const POR_PAGINA = 24;

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function PlantCatalog({
  plantas,
  familias,
  totalEspecies,
}: {
  plantas: PlantaCatalogo[];
  familias: Familia[];
  totalEspecies?: number;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [familiaId, setFamiliaId] = useState<number | "">("");
  const [region, setRegion] = useState("");
  const [pagina, setPagina] = useState(1);

  const familiasPorId = useMemo(
    () => new Map(familias.map((f) => [f.id_familia, f.nombre_familia])),
    [familias]
  );

  const regiones = useMemo(() => {
    const set = new Set<string>();
    for (const p of plantas) {
      const r = p.nombreComun.region_uso?.trim();
      if (r) set.add(r);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }, [plantas]);

  const filtradas = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return plantas.filter((p) => {
      const coincideTexto =
        !q ||
        normalizar(p.nombreComun.nombre_comun).includes(q) ||
        (p.nombreCientifico && normalizar(p.nombreCientifico).includes(q)) ||
        normalizar(p.nombreComun.region_uso ?? "").includes(q);
      const coincideFamilia = familiaId === "" || p.idFamilia === familiaId;
      const coincideRegion = !region || p.nombreComun.region_uso === region;
      return coincideTexto && coincideFamilia && coincideRegion;
    });
  }, [plantas, busqueda, familiaId, region]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );

  const hayFiltros = busqueda.trim() !== "" || familiaId !== "" || region !== "";

  useEffect(() => {
    setPagina(1);
  }, [busqueda, familiaId, region]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-forest/10 bg-card-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-earth-soft">
          <span>
            <strong className="text-forest">{filtradas.length}</strong> resultados
          </span>
          {totalEspecies != null && (
            <span>
              de <strong className="text-forest">{totalEspecies}</strong> especies indexadas
            </span>
          )}
          {hayFiltros && (
            <button
              type="button"
              onClick={() => {
                setBusqueda("");
                setFamiliaId("");
                setRegion("");
              }}
              className="text-hero-green outline-none hover:underline focus-visible:ring-2 focus-visible:ring-sun-gold/50"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="sr-only" htmlFor="catalogo-busqueda">
          Buscar plantas
        </label>
        <input
          id="catalogo-busqueda"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre común o científico…"
          aria-label="Buscar por nombre común o científico"
          className="rounded-xl border border-forest/15 bg-card-white px-4 py-2.5 text-forest outline-none ring-hero-green/30 focus-visible:ring-2 sm:col-span-2 lg:col-span-1"
        />
        <label className="sr-only" htmlFor="catalogo-familia">
          Filtrar por familia botánica
        </label>
        <select
          id="catalogo-familia"
          value={familiaId}
          onChange={(e) =>
            setFamiliaId(e.target.value === "" ? "" : Number(e.target.value))
          }
          aria-label="Filtrar por familia botánica"
          className="rounded-xl border border-forest/15 bg-card-white px-4 py-2.5 text-forest outline-none ring-hero-green/30 focus-visible:ring-2"
        >
          <option value="">Todas las familias</option>
          {familias.map((f) => (
            <option key={f.id_familia} value={f.id_familia}>
              {f.nombre_familia}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="catalogo-region">
          Filtrar por región de uso
        </label>
        <select
          id="catalogo-region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label="Filtrar por región de uso"
          className="rounded-xl border border-forest/15 bg-card-white px-4 py-2.5 text-forest outline-none ring-hero-green/30 focus-visible:ring-2"
        >
          <option value="">Todas las regiones</option>
          {regiones.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {filtradas.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-forest/20 bg-card-white p-10 text-center text-earth"
          role="status"
        >
          No se encontraron plantas con esos filtros.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibles.map((planta) => (
              <PlantCard
                key={planta.nombreComun.id_nombre_comun}
                planta={planta}
              />
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={paginaActual <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                aria-label="Página anterior"
                className="rounded-lg border border-forest/15 px-3 py-1.5 text-sm text-forest outline-none focus-visible:ring-2 focus-visible:ring-sun-gold/50 disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-sm text-earth" aria-live="polite">
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                type="button"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                aria-label="Página siguiente"
                className="rounded-lg border border-forest/15 px-3 py-1.5 text-sm text-forest outline-none focus-visible:ring-2 focus-visible:ring-sun-gold/50 disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
