/**
 * Evals end-to-end del Médico Virtual (sin LLM).
 * Cubre guardrails, árbol de padecimientos, triaje, validación de salida y búsqueda de plantas.
 *
 * Uso:
 *   cd web
 *   npm run medico:pruebas
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { evaluarGuardrailClinico } from "@/lib/guardrails-clinicos";
import { interpretarEntradaGuia, esPedidoRecomendacionPlantas, esConsultaSeguimientoPlanta } from "@/lib/arbol-padecimientos";
import {
  evaluarTriajeCompleto,
  debeGenerarRecomendacion,
} from "@/lib/medico-agentes";
import { validarSalidaPlantasSync, plantasMencionadasEnTextoSync } from "@/lib/validar-salida-plantas";
import { normalizarTextoBusqueda } from "@/lib/plants";
import type { PadecimientoSeleccionado } from "@/lib/arbol-padecimientos";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, "..");
const require = createRequire(resolve(webRoot, "package.json"));
const { createClient } = require("@supabase/supabase-js");

type Escenario = {
  id: string;
  nombre: string;
  tipo: string;
  entrada?: string;
  texto?: string;
  nodoActualId?: string;
  ruta?: string[];
  tieneMarcador?: boolean;
  respuestasPaciente?: number;
  plantasPermitidas?: { idEspecie: number; nombreComun: string; nombreCientifico?: string | null }[];
  catalogoCompleto?: { idEspecie: number; nombreComun: string; nombreCientifico?: string | null }[];
  padecimiento?: PadecimientoSeleccionado;
  notasTriaje?: string;
  plantasContexto?: { idEspecie: number; nombreComun: string; nombreCientifico?: string | null }[];
  esperado: Record<string, unknown>;
};

function cargarEnv() {
  for (const ruta of [resolve(webRoot, ".env.local"), resolve(webRoot, ".env")]) {
    try {
      const contenido = readFileSync(ruta, "utf8");
      for (const linea of contenido.split("\n")) {
        const t = linea.trim();
        if (!t || t.startsWith("#")) continue;
        const i = t.indexOf("=");
        if (i === -1) continue;
        const k = t.slice(0, i).trim();
        const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[k]) process.env[k] = v;
      }
    } catch {
      // archivo opcional
    }
  }
}

cargarEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const TERMINOS_GENERICOS = new Set([
  "digest", "digestivo", "intestinal", "estomago", "gastric", "dolor", "inflam",
  "medicinal", "medicinales", "plantas", "planta", "para", "malestar", "sintoma",
]);

function extraerTerminos(texto: string): string[] {
  return normalizarTextoBusqueda(texto)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !TERMINOS_GENERICOS.has(t));
}

async function puntuarTerminos(
  supabase: ReturnType<typeof createClient>,
  terminos: string[],
  pesoBase: number,
  scores: Map<number, number>
) {
  for (let i = 0; i < terminos.length; i++) {
    const t = terminos[i];
    const peso = pesoBase + (terminos.length - i);

    const { data: usos } = await supabase
      .from("uso_planta")
      .select("id_especie")
      .or(
        `descripcion_uso.ilike.%${t}%,parte_utilizada.ilike.%${t}%,forma_preparacion.ilike.%${t}%,riesgos_contraindicaciones.ilike.%${t}%`
      )
      .limit(60);

    for (const row of usos ?? []) {
      scores.set(row.id_especie, (scores.get(row.id_especie) ?? 0) + peso);
    }

    const { data: props } = await supabase
      .from("propiedad")
      .select("id_propiedad")
      .ilike("nombre_propiedad", `%${t}%`)
      .limit(8);

    if (props?.length) {
      const { data: ep } = await supabase
        .from("especie_propiedad")
        .select("id_especie")
        .in(
          "id_propiedad",
          props.map((p: { id_propiedad: number }) => p.id_propiedad)
        )
        .limit(40);

      for (const row of ep ?? []) {
        scores.set(row.id_especie, (scores.get(row.id_especie) ?? 0) + peso);
      }
    }
  }
}

async function buscarPorNombreComun(
  supabase: ReturnType<typeof createClient>,
  consulta: string,
  limite: number
): Promise<number[]> {
  const terminos = extraerTerminos(consulta);
  const ids = new Set<number>();
  for (const t of terminos) {
    const { data } = await supabase
      .from("nombre_comun")
      .select("id_especie")
      .ilike("nombre_comun", `%${t}%`)
      .limit(10);
    for (const row of data ?? []) ids.add(row.id_especie);
    if (ids.size >= limite) break;
  }
  return [...ids].slice(0, limite);
}

async function buscarPlantasParaPadecimiento(
  supabase: ReturnType<typeof createClient>,
  pad: PadecimientoSeleccionado,
  notasTriaje: string,
  limite = 3
): Promise<string[]> {
  const scores = new Map<number, number>();

  const terminosPad = pad.terminosRAG.flatMap((t) => extraerTerminos(t));
  const terminosNotas = extraerTerminos(notasTriaje ?? "");
  const terminosPadecimiento = extraerTerminos(pad.padecimiento);
  const especificos = [...new Set([...terminosPad, ...terminosPadecimiento, ...terminosNotas])];

  await puntuarTerminos(supabase, especificos, 15, scores);

  let ids = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([id]) => id);

  if (!ids.length) {
    const frases = [
      ...pad.terminosRAG,
      pad.padecimiento,
      notasTriaje ?? "",
    ].filter(Boolean);
    for (const frase of frases) {
      const term = extraerTerminos(frase)[0];
      if (!term) continue;
      const { data } = await supabase
        .from("uso_planta")
        .select("id_especie")
        .or(`descripcion_uso.ilike.%${term}%,parte_utilizada.ilike.%${term}%`)
        .limit(limite);
      for (const row of data ?? []) {
        ids.push(row.id_especie);
        if (ids.length >= limite) break;
      }
      if (ids.length >= limite) break;
    }
    ids = [...new Set(ids)].slice(0, limite);
  }

  if (!ids.length) {
    ids = await buscarPorNombreComun(
      supabase,
      `${pad.padecimiento} ${pad.terminosRAG.join(" ")} ${notasTriaje}`,
      limite
    );
  }

  if (!ids.length) return [];

  const { data: nombres } = await supabase
    .from("nombre_comun")
    .select("id_especie, nombre_comun")
    .in("id_especie", ids);

  const mapa = new Map(
    (nombres ?? []).map((n: { id_especie: number; nombre_comun: string }) => [
      n.id_especie,
      n.nombre_comun,
    ])
  );
  return ids.map((id) => mapa.get(id) ?? `id:${id}`);
}

function ejecutarEscenario(
  esc: Escenario,
  supabase: ReturnType<typeof createClient> | null
): Promise<{ pasa: boolean; detalle: string }> {
  switch (esc.tipo) {
    case "guardrail": {
      const r = evaluarGuardrailClinico([{ role: "user", content: esc.entrada ?? "" }]);
      const exp = esc.esperado;
      if (exp.nivel && r.nivel !== exp.nivel) {
        return Promise.resolve({ pasa: false, detalle: `nivel=${r.nivel}, esperado=${exp.nivel}` });
      }
      if (exp.bloquearPlantas !== undefined && r.bloquearPlantas !== exp.bloquearPlantas) {
        return Promise.resolve({
          pasa: false,
          detalle: `bloquearPlantas=${r.bloquearPlantas}`,
        });
      }
      return Promise.resolve({ pasa: true, detalle: `nivel=${r.nivel}` });
    }

    case "arbol": {
      const r = interpretarEntradaGuia(esc.entrada ?? "", esc.nodoActualId ?? "raiz", esc.ruta ?? []);
      if (expTipo(esc, "tipo") && r.tipo !== esc.esperado.tipo) {
        return Promise.resolve({ pasa: false, detalle: `tipo=${r.tipo}` });
      }
      if (esc.esperado.padecimientoContiene && r.tipo === "hoja") {
        const contiene = r.padecimiento.padecimiento
          .toLowerCase()
          .includes(String(esc.esperado.padecimientoContiene).toLowerCase());
        if (!contiene) {
          return Promise.resolve({
            pasa: false,
            detalle: `padecimiento=${r.padecimiento.padecimiento}`,
          });
        }
      }
      return Promise.resolve({ pasa: true, detalle: `tipo=${r.tipo}` });
    }

    case "validacion_salida": {
      const r = validarSalidaPlantasSync(
        esc.texto ?? "",
        esc.plantasPermitidas ?? [],
        esc.catalogoCompleto ?? esc.plantasPermitidas ?? []
      );
      const invEsp = (esc.esperado.mencionesInvalidas as string[]) ?? [];
      const invOk =
        invEsp.length === r.mencionesInvalidas.length &&
        invEsp.every((n) => r.mencionesInvalidas.includes(n));
      if (!invOk) {
        return Promise.resolve({
          pasa: false,
          detalle: `invalidas=${r.mencionesInvalidas.join(",")}`,
        });
      }
      if (esc.esperado.sanitizado !== undefined && r.sanitizado !== esc.esperado.sanitizado) {
        return Promise.resolve({ pasa: false, detalle: `sanitizado=${r.sanitizado}` });
      }
      return Promise.resolve({
        pasa: true,
        detalle: r.sanitizado ? "sanitizado" : "sin cambios",
      });
    }

    case "triaje": {
      const completo = evaluarTriajeCompleto(
        esc.texto ?? "",
        esc.tieneMarcador ?? false,
        esc.respuestasPaciente ?? 0
      );
      if (esc.esperado.triajeCompleto !== completo) {
        return Promise.resolve({ pasa: false, detalle: `completo=${completo}` });
      }
      return Promise.resolve({ pasa: true, detalle: `completo=${completo}` });
    }

    case "triaje_promesa": {
      const debe = debeGenerarRecomendacion(esc.texto ?? "", 3);
      if (esc.esperado.debeGenerarRecomendacion !== debe) {
        return Promise.resolve({ pasa: false, detalle: `debe=${debe}` });
      }
      return Promise.resolve({ pasa: true, detalle: "debeGenerarRecomendacion=true" });
    }

    case "intencion": {
      const entrada = esc.entrada ?? "";
      if (esc.esperado.esPedidoRecomendacionPlantas !== undefined) {
        const v = esPedidoRecomendacionPlantas(entrada);
        if (v !== esc.esperado.esPedidoRecomendacionPlantas) {
          return Promise.resolve({ pasa: false, detalle: `pedidoPlantas=${v}` });
        }
      }
      if (esc.esperado.esConsultaSeguimientoPlanta !== undefined) {
        const v = esConsultaSeguimientoPlanta(entrada);
        if (v !== esc.esperado.esConsultaSeguimientoPlanta) {
          return Promise.resolve({ pasa: false, detalle: `seguimiento=${v}` });
        }
      }
      return Promise.resolve({ pasa: true, detalle: "intencion OK" });
    }

    case "plantas_recomendacion": {
      if (!supabase || !esc.padecimiento) {
        return Promise.resolve({ pasa: false, detalle: "sin Supabase o padecimiento" });
      }
      return buscarPlantasParaPadecimiento(supabase, esc.padecimiento, esc.notasTriaje ?? "", 3).then(
        (plantas) => {
          const min = (esc.esperado.minPlantas as number) ?? 1;
          if (plantas.length < min) {
            return { pasa: false, detalle: `plantas=${plantas.join(",") || "(vacío)"}` };
          }
          const noSiempre = (esc.esperado.noSiempre as string[]) ?? [];
          const soloGenericas =
            plantas.length > 0 &&
            plantas.every((p) =>
              noSiempre.some((g) => normalizarTextoBusqueda(p).includes(normalizarTextoBusqueda(g)))
            );
          if (noSiempre.length && soloGenericas) {
            return {
              pasa: false,
              detalle: `solo genéricas: ${plantas.join(", ")}`,
            };
          }
          return { pasa: true, detalle: plantas.join(", ") };
        }
      );
    }

    case "tarjetas_texto": {
      const ctx = (esc.plantasContexto ?? []).map((p) => ({
        idEspecie: p.idEspecie,
        nombreComun: p.nombreComun,
        nombreCientifico: p.nombreCientifico ?? null,
        imagenUrl: null,
      }));
      const tarjetas = plantasMencionadasEnTextoSync(esc.texto ?? "", ctx);
      const nombres = tarjetas.map((p) => p.nombreComun);
      const esperadas = (esc.esperado.tarjetas as string[]) ?? [];
      const excluir = (esc.esperado.excluir as string[]) ?? [];

      const faltan = esperadas.filter((n) => !nombres.includes(n));
      const sobran = excluir.filter((n) => nombres.includes(n));

      if (faltan.length || sobran.length) {
        return Promise.resolve({
          pasa: false,
          detalle: `tarjetas=${nombres.join(", ")} faltan=${faltan.join(",")} sobran=${sobran.join(",")}`,
        });
      }
      return Promise.resolve({ pasa: true, detalle: nombres.join(", ") });
    }

    default:
      return Promise.resolve({ pasa: false, detalle: `tipo desconocido: ${esc.tipo}` });
  }
}

function expTipo(esc: Escenario, key: string): boolean {
  return esc.esperado[key] !== undefined;
}

async function main() {
  const escenariosPath = resolve(webRoot, "../docs/medico-conversacion-escenarios.json");
  const escenarios: Escenario[] = JSON.parse(readFileSync(escenariosPath, "utf8"));

  const necesitaSupabase = escenarios.some((e) => e.tipo === "plantas_recomendacion");
  let supabase: ReturnType<typeof createClient> | null = null;

  if (necesitaSupabase) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("Faltan variables Supabase para pruebas de plantas (web/.env.local)");
      process.exit(1);
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  console.log(`\nMédico Virtual — evals conversación (${escenarios.length} escenarios)\n`);

  let ok = 0;
  let fail = 0;
  const resultados: Record<string, unknown>[] = [];

  for (const esc of escenarios) {
    const { pasa, detalle } = await ejecutarEscenario(esc, supabase);
    if (pasa) ok++;
    else fail++;

    resultados.push({
      id: esc.id,
      nombre: esc.nombre,
      tipo: esc.tipo,
      estado: pasa ? "OK" : "FALLO",
      detalle,
    });

    console.log(`${pasa ? "✅" : "❌"} ${esc.id}: ${esc.nombre}`);
    console.log(`   → ${detalle}\n`);
  }

  console.log(`Resumen: ${ok}/${escenarios.length} OK, ${fail} fallos\n`);

  const salida = {
    fecha: new Date().toISOString(),
    total: escenarios.length,
    ok,
    fallos: fail,
    resultados,
  };

  const outPath = resolve(webRoot, "../docs/medico-conversacion-resultado.json");
  writeFileSync(outPath, JSON.stringify(salida, null, 2), "utf8");
  console.log("Resultado guardado en docs/medico-conversacion-resultado.json");

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
