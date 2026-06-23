/**
 * Genera embeddings para todas las especies y los guarda en plant_embeddings.
 *
 * Uso:
 *   cd web
 * Requiere GOOGLE_GENERATIVE_AI_API_KEY (embeddings 768 dims para pgvector).
 * El chat del asistente usa DeepSeek (DEEPSEEK_API_KEY) — ver web/src/lib/ai-config.ts
 *   node ../supabase/scripts/generate-embeddings.mjs
 *
 * Opciones:
 *   --limit=N   Procesar solo N especies (pruebas)
 *   --force     Regenerar aunque ya existan chunks
 */

import { createRequire } from "module";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, "../../web");
const require = createRequire(resolve(webRoot, "package.json"));

const { createClient } = require("@supabase/supabase-js");
const { google } = require("@ai-sdk/google");
const { embed } = require("ai");

function cargarEnv() {
  const rutas = [
    resolve(__dirname, "../../web/.env.local"),
    resolve(__dirname, "../../web/.env"),
  ];
  for (const ruta of rutas) {
    if (!existsSync(ruta)) continue;
    const lineas = readFileSync(ruta, "utf8").split("\n");
    for (const linea of lineas) {
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
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !GOOGLE_KEY) {
  console.error(
    "Faltan variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_GENERATIVE_AI_API_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const EMBEDDING_MODEL = "gemini-embedding-001";
const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : null;
const force = args.includes("--force");

async function generarEmbedding(texto) {
  const { embedding } = await embed({
    model: google.textEmbeddingModel(EMBEDDING_MODEL),
    value: texto,
    providerOptions: {
      google: { outputDimensionality: 768 },
    },
  });
  return embedding;
}

function chunk(texto, tipo, metadata = {}) {
  const t = texto?.trim();
  if (!t || t.length < 10) return null;
  return { chunk_type: tipo, content: t, metadata };
}

async function construirChunks(idEspecie) {
  const chunks = [];

  const { data: especie } = await supabase
    .from("especie")
    .select("*")
    .eq("id_especie", idEspecie)
    .maybeSingle();

  if (!especie) return chunks;

  const nombre =
    especie.nombre_cientifico?.trim() ||
    especie.epiteto_especifico?.trim() ||
    `Especie #${idEspecie}`;

  const partes = [
    especie.descripcion_botanica,
    especie.tipo_planta && `Tipo: ${especie.tipo_planta}`,
    especie.ciclo_vida && `Ciclo: ${especie.ciclo_vida}`,
    especie.origen_geografico && `Origen: ${especie.origen_geografico}`,
    especie.observaciones,
  ].filter(Boolean);

  const cBotanica = chunk(
    `Planta: ${nombre}\n${partes.join("\n")}`,
    "botanica",
    { nombre_cientifico: nombre }
  );
  if (cBotanica) chunks.push(cBotanica);

  const { data: nombres } = await supabase
    .from("nombre_comun")
    .select("*")
    .eq("id_especie", idEspecie);

  for (const n of nombres ?? []) {
    const c = chunk(
      `${nombre} — nombre común: ${n.nombre_comun} (${n.idioma}, ${n.region_uso})`,
      "nombre_comun",
      { nombre_comun: n.nombre_comun }
    );
    if (c) chunks.push(c);
  }

  const { data: usos } = await supabase
    .from("uso_planta")
    .select("*")
    .eq("id_especie", idEspecie);

  for (const u of usos ?? []) {
    const partesUso = [
      u.descripcion_uso,
      u.parte_utilizada && `Parte: ${u.parte_utilizada}`,
      u.forma_preparacion && `Preparación: ${u.forma_preparacion}`,
      u.via_administracion && `Vía: ${u.via_administracion}`,
      u.riesgos_contraindicaciones && `Riesgos: ${u.riesgos_contraindicaciones}`,
    ].filter(Boolean);
    const c = chunk(
      `${nombre} — uso medicinal:\n${partesUso.join("\n")}`,
      "uso",
      { id_uso: u.id_uso }
    );
    if (c) chunks.push(c);
  }

  const { data: props } = await supabase
    .from("especie_propiedad")
    .select("*, propiedad(*)")
    .eq("id_especie", idEspecie);

  for (const ep of props ?? []) {
    const p = ep.propiedad;
    if (!p) continue;
    const c = chunk(
      `${nombre} — propiedad: ${p.nombre_propiedad}. ${p.descripcion ?? ""} ${ep.observaciones ?? ""}`.trim(),
      "propiedad",
      { id_propiedad: ep.id_propiedad }
    );
    if (c) chunks.push(c);
  }

  return chunks;
}

async function main() {
  const { data: especies, error } = await supabase
    .from("especie")
    .select("id_especie")
    .order("id_especie");

  if (error) throw error;

  let lista = especies ?? [];
  if (limit) lista = lista.slice(0, limit);

  console.log(`Procesando ${lista.length} especies…`);

  let totalChunks = 0;

  for (const { id_especie } of lista) {
    const chunks = await construirChunks(id_especie);
    if (!chunks.length) continue;

    for (const c of chunks) {
      if (!force) {
        const { data: existente } = await supabase
          .from("plant_embeddings")
          .select("id")
          .eq("id_especie", id_especie)
          .eq("chunk_type", c.chunk_type)
          .eq("content", c.content)
          .maybeSingle();
        if (existente) continue;
      }

      try {
        const embedding = await generarEmbedding(c.content);
        const { error: upsertError } = await supabase.from("plant_embeddings").upsert(
          {
            id_especie,
            chunk_type: c.chunk_type,
            content: c.content,
            metadata: c.metadata,
            embedding,
          },
          { onConflict: "id_especie,chunk_type,content" }
        );
        if (upsertError) {
          console.warn(`  ⚠ Especie ${id_especie}: ${upsertError.message}`);
        } else {
          totalChunks++;
        }
        // Pausa breve para respetar rate limits gratuitos
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        console.warn(`  ⚠ Embedding falló para especie ${id_especie}:`, e.message);
      }
    }

    process.stdout.write(`\r  Especie ${id_especie} — ${totalChunks} chunks totales`);
  }

  console.log(`\n✓ Listo. ${totalChunks} chunks indexados.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
