"use client";

import { useMemo, useState } from "react";
import { PlantCard } from "@/components/PlantCard";
import type { Familia, PlantaCatalogo } from "@/types/database";

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function PlantCatalog({
  plantas,
  familias,
}: {
  plantas: PlantaCatalogo[];
  familias: Familia[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [familiaId, setFamiliaId] = useState<number | "">("");

  const familiasPorId = useMemo(
    () => new Map(familias.map((f) => [f.id_familia, f.nombre_familia])),
    [familias]
  );

  const filtradas = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return plantas.filter((p) => {
      const coincideTexto =
        !q ||
        normalizar(p.nombreComun.nombre_comun).includes(q) ||
        (p.nombreCientifico && normalizar(p.nombreCientifico).includes(q));
      const coincideFamilia =
        familiaId === "" || p.idFamilia === familiaId;
      return coincideTexto && coincideFamilia;
    });
  }, [plantas, busqueda, familiaId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre común o científico…"
          className="flex-1 rounded-xl border border-forest/15 bg-card-white px-4 py-2.5 text-forest outline-none ring-hero-green/30 focus:ring-2"
        />
        <select
          value={familiaId}
          onChange={(e) =>
            setFamiliaId(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="rounded-xl border border-forest/15 bg-card-white px-4 py-2.5 text-forest outline-none ring-hero-green/30 focus:ring-2 sm:min-w-[200px]"
        >
          <option value="">Todas las familias</option>
          {familias.map((f) => (
            <option key={f.id_familia} value={f.id_familia}>
              {f.nombre_familia}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-earth-soft">
        {filtradas.length} planta{filtradas.length !== 1 ? "s" : ""}
        {familiaId !== "" && familiasPorId.get(familiaId as number)
          ? ` en ${familiasPorId.get(familiaId as number)}`
          : ""}
      </p>

      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-forest/20 bg-card-white p-10 text-center text-earth-soft">
          No se encontraron plantas con esos filtros.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((planta) => (
            <PlantCard
              key={planta.nombreComun.id_nombre_comun}
              planta={planta}
            />
          ))}
        </div>
      )}
    </div>
  );
}
