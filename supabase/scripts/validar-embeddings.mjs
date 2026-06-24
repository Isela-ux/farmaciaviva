/**
 * Valida el índice de embeddings en Supabase (pgvector, 768 dims).
 *
 * Uso:
 *   cd web
 *   npm run embeddings:validar
 */

import { createRequire } from "module";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, "../../web");
const require = createRequire(resolve(webRoot, "package.json"));
const { createClient } = require("@supabase/supabase-js");

const EMBEDDING_DIMENSIONS = 768;

function cargarEnv() {
  for (const ruta of [resolve(webRoot, ".env.local"), resolve(webRoot, ".env")]) {
    if (!existsSync(ruta)) continue;
    for (const linea of readFileSync(ruta, "utf8").split("\n")) {
      const t = linea.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

cargarEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o ANON_KEY) en web/.env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function contar(tabla, filtros = {}) {
  let q = supabase.from(tabla).select("*", { count: "exact", head: true });
  for (const [col, val] of Object.entries(filtros)) {
    q = q.eq(col, val);
  }
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function main() {
  console.log("Farmacia Viva — validación de embeddings pgvector\n");

  const [totalEspecies, totalEmbeddings] = await Promise.all([
    contar("especie"),
    contar("plant_embeddings"),
  ]);

  const { data: sinEmbedding, error: errSin } = await supabase
    .from("plant_embeddings")
    .select("id")
    .is("embedding", null)
    .limit(5);

  if (errSin) throw errSin;

  const { data: muestra, error: errMuestra } = await supabase
    .from("plant_embeddings")
    .select("id, id_especie, chunk_type, embedding")
    .not("embedding", "is", null)
    .limit(3);

  if (errMuestra) throw errMuestra;

  const dimensiones = (muestra ?? []).map((row) => {
    const emb = row.embedding;
    if (Array.isArray(emb)) return emb.length;
    if (typeof emb === "string") {
      const nums = emb.replace(/^\[|\]$/g, "").split(",").filter(Boolean);
      return nums.length;
    }
    return null;
  });

  const { data: porEspecie, error: errGrupo } = await supabase
    .from("plant_embeddings")
    .select("id_especie");

  if (errGrupo) throw errGrupo;

  const chunksPorEspecie = new Map();
  for (const row of porEspecie ?? []) {
    chunksPorEspecie.set(row.id_especie, (chunksPorEspecie.get(row.id_especie) ?? 0) + 1);
  }

  const especiesConEmbedding = chunksPorEspecie.size;
  const especiesSinEmbedding = totalEspecies - especiesConEmbedding;

  const { data: todasEspecies } = await supabase.from("especie").select("id_especie");
  const faltantes = (todasEspecies ?? [])
    .filter((e) => !chunksPorEspecie.has(e.id_especie))
    .map((e) => e.id_especie)
    .slice(0, 10);

  const nulos = sinEmbedding?.length ?? 0;
  const dimsOk = dimensiones.every((d) => d === EMBEDDING_DIMENSIONS);
  const coberturaOk = especiesSinEmbedding === 0;
  const indiceOk = totalEmbeddings > 0 && nulos === 0 && dimsOk && coberturaOk;

  console.log(`Especies en catálogo:     ${totalEspecies}`);
  console.log(`Chunks indexados:         ${totalEmbeddings}`);
  console.log(`Especies con embedding:   ${especiesConEmbedding}`);
  console.log(`Especies sin embedding: ${especiesSinEmbedding}`);
  console.log(`Embeddings nulos:       ${nulos}`);
  console.log(
    `Dimensiones (muestra):    ${dimensiones.join(", ") || "—"} (esperado: ${EMBEDDING_DIMENSIONS})`
  );

  if (faltantes.length > 0) {
    console.log(`\nPrimeras especies sin chunks (máx. 10): ${faltantes.join(", ")}`);
  }

  const resumen = {
    fecha: new Date().toISOString(),
    totalEspecies,
    totalEmbeddings,
    especiesConEmbedding,
    especiesSinEmbedding,
    embeddingsNulos: nulos,
    dimensionesMuestra: dimensiones,
    dimensionesEsperadas: EMBEDDING_DIMENSIONS,
    especiesSinChunksMuestra: faltantes,
    estado: indiceOk ? "OK" : "REVISAR",
  };

  const outPath = resolve(__dirname, "../../docs/embeddings-validacion.json");
  writeFileSync(outPath, JSON.stringify(resumen, null, 2), "utf8");
  console.log(`\nResultado guardado en docs/embeddings-validacion.json`);

  if (indiceOk) {
    console.log("\n✅ Índice de embeddings válido para producción.\n");
    process.exit(0);
  }

  console.log("\n⚠ Revisar índice antes de desplegar (ver detalles arriba).\n");
  process.exit(especiesSinEmbedding > 0 || nulos > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
