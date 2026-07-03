import {
  buscarPlantasMencionadasEnTexto,
  normalizarTextoBusqueda,
} from "@/lib/plants";
import type { PlantaMedicoVirtual } from "@/types/database";

export type ResultadoValidacionSalida = {
  texto: string;
  mencionesValidas: string[];
  mencionesInvalidas: string[];
  sanitizado: boolean;
  plantasParaTarjetas: PlantaMedicoVirtual[];
};

function plantasAReferencia(
  plantas: PlantaMedicoVirtual[]
): { idEspecie: number; nombreComun: string; nombreCientifico: string | null }[] {
  return plantas.map((p) => ({
    idEspecie: p.idEspecie,
    nombreComun: p.nombreComun,
    nombreCientifico: p.nombreCientifico,
  }));
}

/** Detecta menciones de plantas en texto comparando contra un catálogo dado (síncrono, para pruebas). */
export function detectarMencionesPlantasSync(
  texto: string,
  catalogo: { idEspecie: number; nombreComun: string; nombreCientifico?: string | null }[]
): { idEspecie: number; nombreComun: string }[] {
  const textoNorm = normalizarTextoBusqueda(texto);
  if (!textoNorm.trim()) return [];

  const ordenadas = [...catalogo].sort((a, b) => b.nombreComun.length - a.nombreComun.length);
  const ids = new Set<number>();
  const resultados: { idEspecie: number; nombreComun: string }[] = [];

  for (const p of ordenadas) {
    const comun = normalizarTextoBusqueda(p.nombreComun);
    const cientifico = p.nombreCientifico ? normalizarTextoBusqueda(p.nombreCientifico) : "";
    const genero = cientifico.split(/\s+/)[0] ?? "";

    const coincideComun = comun.length >= 4 && textoNorm.includes(comun);
    const coincideCientifico =
      cientifico.length >= 5 &&
      (textoNorm.includes(cientifico) || (genero.length >= 5 && textoNorm.includes(genero)));

    if (!coincideComun && !coincideCientifico) continue;
    if (ids.has(p.idEspecie)) continue;
    ids.add(p.idEspecie);
    resultados.push({ idEspecie: p.idEspecie, nombreComun: p.nombreComun });
    if (resultados.length >= 8) break;
  }

  return resultados;
}

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function limpiarTextoTrasReemplazo(texto: string): string {
  return texto
    .replace(/-\s*$/gm, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function notaPlantasPermitidas(plantas: PlantaMedicoVirtual[]): string {
  const nombres = plantas.map((p) => p.nombreComun).filter(Boolean);
  if (!nombres.length) return "";
  return `\n\n> **Nota:** Las plantas del catálogo consideradas para esta consulta son: **${nombres.join(", ")}**.`;
}

/**
 * Elimina menciones de plantas fuera del contexto RAG y añade nota con las permitidas.
 */
export function sanitizarTextoPlantas(
  texto: string,
  plantasPermitidas: PlantaMedicoVirtual[],
  mencionesInvalidas: string[]
): string {
  if (!mencionesInvalidas.length) return texto;

  let out = texto;
  const invalidas = [...new Set(mencionesInvalidas)].sort((a, b) => b.length - a.length);

  for (const nombre of invalidas) {
    const re = new RegExp(`\\b${escaparRegex(nombre)}\\b`, "gi");
    out = out.replace(re, "");
  }

  out = limpiarTextoTrasReemplazo(out);
  const nota = notaPlantasPermitidas(plantasPermitidas);
  if (nota && !out.includes(nota.trim())) {
    out += nota;
  }
  return out;
}

/**
 * Plantas del contexto que el texto menciona (para tarjetas).
 * Evita mostrar especies recuperadas por RAG que el LLM no recomendó.
 */
export function plantasMencionadasEnTextoSync(
  texto: string,
  plantasContexto: PlantaMedicoVirtual[]
): PlantaMedicoVirtual[] {
  if (!texto.trim() || !plantasContexto.length) return [];

  const textoNorm = normalizarTextoBusqueda(texto);
  const idsOrden: number[] = [];
  const porId = new Map(plantasContexto.map((p) => [p.idEspecie, p]));

  const ordenadas = [...plantasContexto].sort((a, b) => b.nombreComun.length - a.nombreComun.length);

  for (const p of ordenadas) {
    const comun = normalizarTextoBusqueda(p.nombreComun);
    const cientifico = p.nombreCientifico ? normalizarTextoBusqueda(p.nombreCientifico) : "";
    const genero = cientifico.split(/\s+/)[0] ?? "";

    const coincideCompleto =
      (comun.length >= 4 && textoNorm.includes(comun)) ||
      (cientifico.length >= 5 &&
        (textoNorm.includes(cientifico) || (genero.length >= 5 && textoNorm.includes(genero))));

    if (coincideCompleto) {
      if (!idsOrden.includes(p.idEspecie)) idsOrden.push(p.idEspecie);
      continue;
    }

    // Fragmento inicial del nombre (ej. «Hoja de sapo» dentro de «Hoja de sapo hierba del topo»)
    const tokens = comun.split(/\s+/).filter((t) => t.length >= 3);
    for (let len = Math.min(tokens.length, 4); len >= 1; len--) {
      const fragmento = tokens.slice(0, len).join(" ");
      if (fragmento.length >= 4 && textoNorm.includes(fragmento)) {
        if (!idsOrden.includes(p.idEspecie)) idsOrden.push(p.idEspecie);
        break;
      }
    }
  }

  return idsOrden
    .map((id) => porId.get(id))
    .filter((p): p is PlantaMedicoVirtual => Boolean(p));
}

/** Versión async: busca en catálogo y restringe al contexto recuperado. */
export async function plantasMencionadasParaTarjetas(
  texto: string,
  plantasContexto: PlantaMedicoVirtual[]
): Promise<PlantaMedicoVirtual[]> {
  if (!texto.trim() || !plantasContexto.length) return [];

  const permitidasIds = new Set(plantasContexto.map((p) => p.idEspecie));
  const mencionesCatalogo = await buscarPlantasMencionadasEnTexto(texto, 6);
  const porId = new Map(plantasContexto.map((p) => [p.idEspecie, p]));
  const idsOrden: number[] = [];

  for (const m of mencionesCatalogo) {
    const id = m.nombreComun.id_especie;
    if (permitidasIds.has(id) && !idsOrden.includes(id)) idsOrden.push(id);
  }

  if (!idsOrden.length) {
    return plantasMencionadasEnTextoSync(texto, plantasContexto);
  }

  return idsOrden
    .map((id) => porId.get(id))
    .filter((p): p is PlantaMedicoVirtual => Boolean(p));
}

/** Valida y sanitiza la salida del LLM contra las plantas del contexto recuperado. */
export async function validarYSanitizarSalidaPlantas(
  texto: string,
  plantasPermitidas: PlantaMedicoVirtual[]
): Promise<ResultadoValidacionSalida> {
  if (!texto.trim() || !plantasPermitidas.length) {
    return {
      texto,
      mencionesValidas: [],
      mencionesInvalidas: [],
      sanitizado: false,
      plantasParaTarjetas: [],
    };
  }

  const permitidasIds = new Set(plantasPermitidas.map((p) => p.idEspecie));
  const mencionesCatalogo = await buscarPlantasMencionadasEnTexto(texto, 8);

  const mencionesValidas: string[] = [];
  const mencionesInvalidas: string[] = [];

  for (const m of mencionesCatalogo) {
    const nombre = m.nombreComun.nombre_comun;
    if (permitidasIds.has(m.nombreComun.id_especie)) {
      if (!mencionesValidas.includes(nombre)) mencionesValidas.push(nombre);
    } else if (!mencionesInvalidas.includes(nombre)) {
      mencionesInvalidas.push(nombre);
    }
  }

  if (!mencionesInvalidas.length) {
    const plantasParaTarjetas = await plantasMencionadasParaTarjetas(texto, plantasPermitidas);
    return {
      texto,
      mencionesValidas,
      mencionesInvalidas,
      sanitizado: false,
      plantasParaTarjetas,
    };
  }

  const textoSanitizado = sanitizarTextoPlantas(texto, plantasPermitidas, mencionesInvalidas);
  const plantasParaTarjetas = await plantasMencionadasParaTarjetas(
    textoSanitizado,
    plantasPermitidas
  );
  return {
    texto: textoSanitizado,
    mencionesValidas,
    mencionesInvalidas,
    sanitizado: true,
    plantasParaTarjetas,
  };
}

/** Versión síncrona para pruebas unitarias con catálogo acotado. */
export function validarSalidaPlantasSync(
  texto: string,
  plantasPermitidas: { idEspecie: number; nombreComun: string; nombreCientifico?: string | null }[],
  catalogoCompleto: { idEspecie: number; nombreComun: string; nombreCientifico?: string | null }[]
): ResultadoValidacionSalida {
  const permitidasIds = new Set(plantasPermitidas.map((p) => p.idEspecie));
  const menciones = detectarMencionesPlantasSync(texto, catalogoCompleto);

  const mencionesValidas: string[] = [];
  const mencionesInvalidas: string[] = [];

  for (const m of menciones) {
    if (permitidasIds.has(m.idEspecie)) {
      if (!mencionesValidas.includes(m.nombreComun)) mencionesValidas.push(m.nombreComun);
    } else if (!mencionesInvalidas.includes(m.nombreComun)) {
      mencionesInvalidas.push(m.nombreComun);
    }
  }

  const comoMedico: PlantaMedicoVirtual[] = plantasPermitidas.map((p) => ({
    idEspecie: p.idEspecie,
    nombreComun: p.nombreComun,
    nombreCientifico: p.nombreCientifico ?? null,
    imagenUrl: null,
  }));

  if (!mencionesInvalidas.length) {
    return {
      texto,
      mencionesValidas,
      mencionesInvalidas,
      sanitizado: false,
      plantasParaTarjetas: plantasMencionadasEnTextoSync(texto, comoMedico),
    };
  }

  const textoSanitizado = sanitizarTextoPlantas(texto, comoMedico, mencionesInvalidas);
  return {
    texto: textoSanitizado,
    mencionesValidas,
    mencionesInvalidas,
    sanitizado: true,
    plantasParaTarjetas: plantasMencionadasEnTextoSync(textoSanitizado, comoMedico),
  };
}

export { plantasAReferencia };
