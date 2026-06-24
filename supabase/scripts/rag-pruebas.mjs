/**
 * Valida la recuperación RAG (sin llamar al LLM) para el conjunto de pruebas.
 *
 * Uso:
 *   cd web
 *   npm run rag:pruebas
 */

import { createRequire } from "module";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, "../../web");
const require = createRequire(resolve(webRoot, "package.json"));
const { createClient } = require("@supabase/supabase-js");

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
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en web/.env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STOPWORDS = new Set([
  "donde", "puedo", "encontrar", "planta", "plantas", "del", "de", "la", "el", "los", "las",
  "un", "una", "que", "cual", "para", "con", "por", "en", "como", "hay", "sirve", "sobre",
  "medicinal", "medicinales", "nombre", "cientifico", "cuales", "sus", "y", "o", "a", "me",
  "muy", "mas", "más", "se", "usa", "usar", "son", "tiene", "tienen", "problemas",
]);

const SINONIMOS = {
  digest: ["digest", "estomago", "intestinal", "gastric", "flatul", "colico"],
  inflam: ["inflam", "dolor", "reuma", "artri"],
  respir: ["respir", "tos", "pulmon", "bronqu"],
  piel: ["piel", "dermat", "herida", "quemad"],
  nerv: ["nerv", "ansied", "insomn", "estres"],
  febr: ["febr", "fiebre", "grip"],
};

function norm(s) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function terminos(termino) {
  return norm(termino).split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function expandirMedicinales(ts) {
  const out = new Set(ts);
  for (const t of ts) {
    for (const [clave, variantes] of Object.entries(SINONIMOS)) {
      if (t.includes(clave) || variantes.some((v) => t.includes(v))) {
        out.add(clave);
        variantes.forEach((v) => out.add(v));
      }
    }
  }
  return [...out];
}

function esSeguimiento(consulta) {
  const q = consulta.trim().toLowerCase();
  return (
    terminos(consulta).length === 0 ||
    /^(y\s+)?(cuales|cuáles|que|qué|cual|cuál|dime)\b/.test(q) ||
    /\b(sus|su|esta|este|esa|ese)\b/.test(q)
  );
}

let catalogoCache = null;

async function obtenerCatalogo() {
  if (catalogoCache) return catalogoCache;

  const [{ data: nombres }, { data: especies }] = await Promise.all([
    supabase.from("nombre_comun").select("*"),
    supabase.from("especie").select("id_especie, nombre_cientifico, epiteto_especifico"),
  ]);

  const especiePorId = new Map((especies ?? []).map((e) => [e.id_especie, e]));

  catalogoCache = (nombres ?? []).map((nombreComun) => {
    const especie = especiePorId.get(nombreComun.id_especie);
    const cientifico = especie?.nombre_cientifico?.trim() || especie?.epiteto_especifico?.trim() || null;
    return {
      id: nombreComun.id_especie,
      nombreComun: nombreComun.nombre_comun,
      nombreCientifico: cientifico,
    };
  });

  return catalogoCache;
}

function coincidePalabra(palabra, termino) {
  if (palabra.length < 4 || termino.length < 4) return false;
  return palabra.startsWith(termino) || termino.startsWith(palabra);
}

async function buscarPorTexto(termino, limite = 8) {
  const catalogo = await obtenerCatalogo();
  const q = termino.trim();
  if (!q) return catalogo.slice(0, limite);

  const ts = terminos(q);
  const frase = norm(q);

  return catalogo
    .filter((p) => {
      const comun = norm(p.nombreComun);
      const cient = p.nombreCientifico ? norm(p.nombreCientifico) : "";
      if (comun.includes(frase) || cient.includes(frase)) return true;
      return ts.some(
        (t) =>
          comun.includes(t) ||
          cient.includes(t) ||
          comun.split(/\s+/).some((palabra) => coincidePalabra(palabra, t))
      );
    })
    .slice(0, limite);
}

async function buscarMencionadas(texto, limite = 6) {
  const catalogo = await obtenerCatalogo();
  const textoNorm = norm(texto);
  if (!textoNorm.trim()) return [];

  const ordenadas = [...catalogo].sort((a, b) => b.nombreComun.length - a.nombreComun.length);
  const ids = new Set();
  const out = [];

  for (const p of ordenadas) {
    const comun = norm(p.nombreComun);
    if (comun.length < 4) continue;
    if (!textoNorm.includes(comun)) continue;
    if (ids.has(p.id)) continue;
    ids.add(p.id);
    out.push(p);
    if (out.length >= limite) break;
  }
  return out;
}

async function buscarPorContenidoMedicinal(termino, limite = 8) {
  const porNombre = await buscarPorTexto(termino, limite);
  if (porNombre.length >= limite) return porNombre;

  const ts = expandirMedicinales(terminos(termino));
  if (!ts.length) return porNombre;

  const ids = new Set(porNombre.map((p) => p.id));
  const extras = [];

  for (const t of ts.slice(0, 6)) {
    const { data: usos } = await supabase
      .from("uso_planta")
      .select("id_especie")
      .ilike("descripcion_uso", `%${t}%`)
      .limit(limite * 3);

    for (const row of usos ?? []) {
      if (ids.has(row.id_especie)) continue;
      ids.add(row.id_especie);
      extras.push(row.id_especie);
      if (porNombre.length + extras.length >= limite) break;
    }
    if (porNombre.length + extras.length >= limite) break;

    const { data: props } = await supabase
      .from("propiedad")
      .select("id_propiedad")
      .ilike("nombre_propiedad", `%${t}%`)
      .limit(10);

    if (props?.length) {
      const { data: ep } = await supabase
        .from("especie_propiedad")
        .select("id_especie")
        .in("id_propiedad", props.map((p) => p.id_propiedad))
        .limit(limite * 3);

      for (const row of ep ?? []) {
        if (ids.has(row.id_especie)) continue;
        ids.add(row.id_especie);
        extras.push(row.id_especie);
        if (porNombre.length + extras.length >= limite) break;
      }
    }
  }

  if (!extras.length) return porNombre;

  const catalogo = await obtenerCatalogo();
  const mapa = new Map(catalogo.map((p) => [p.id, p]));
  return [...porNombre, ...extras.map((id) => mapa.get(id)).filter(Boolean)].slice(0, limite);
}

function unificar(...listas) {
  const ids = new Set();
  const out = [];
  for (const lista of listas) {
    for (const p of lista) {
      if (ids.has(p.id)) continue;
      ids.add(p.id);
      out.push(p);
    }
  }
  return out;
}

async function buscarContextoRAG(consulta, mensajes = [], limite = 3) {
  const consultaActual = consulta.trim();

  const mencionadasActual = await buscarMencionadas(consultaActual, limite);
  if (mencionadasActual.length) return mencionadasActual.slice(0, limite);

  if (!esSeguimiento(consultaActual)) {
    const porTextoActual = await buscarPorTexto(consultaActual, limite);
    if (porTextoActual.length) return porTextoActual.slice(0, limite);
  }

  const textoConversacion = mensajes.map((m) => m.content).join("\n");

  if (esSeguimiento(consultaActual)) {
    const delHistorial = await buscarMencionadas(textoConversacion, limite);
    if (delHistorial.length) return delHistorial.slice(0, limite);
  }

  const consultaExpandida = esSeguimiento(consultaActual)
    ? textoConversacion
    : `${textoConversacion}\n${consultaActual}`.trim();

  const [mencionadas, porMedicinal] = await Promise.all([
    buscarMencionadas(textoConversacion, limite),
    buscarPorContenidoMedicinal(consultaExpandida, limite),
  ]);

  const plantas = unificar(mencionadas, porMedicinal);
  return plantas.slice(0, limite);
}

const PRUEBAS = [
  {
    id: "P01",
    consulta: "¿Para qué sirve el achiote?",
    esperado: ["achiote", "bixa"],
    tipo: "planta_concreta",
  },
  {
    id: "P02",
    consulta: "Plantas para problemas digestivos",
    esperado: [],
    tipo: "sintoma",
    minResultados: 1,
  },
  {
    id: "P03",
    consulta: "¿Qué plantas tienen propiedades antiinflamatorias?",
    esperado: [],
    tipo: "propiedad",
    minResultados: 1,
  },
  {
    id: "P04",
    consulta: "¿Para qué se usa la ruda?",
    esperado: ["ruda", "ruta"],
    tipo: "planta_concreta",
  },
  {
    id: "P05",
    consulta: "¿Dónde crece el ajonjolí en Tabasco?",
    esperado: ["ajonjol", "sesam"],
    tipo: "planta_concreta",
  },
  {
    id: "P06",
    consulta: "¿Cuáles son los usos medicinales de la sábila?",
    esperado: ["sábila", "sabila", "aloe"],
    tipo: "planta_concreta",
  },
  {
    id: "P07",
    consulta: "plantas para la tos",
    esperado: [],
    tipo: "sintoma",
    minResultados: 1,
  },
  {
    id: "P08",
    consulta: "¿La ruda tiene contraindicaciones?",
    esperado: ["ruda", "ruta"],
    tipo: "planta_concreta",
  },
  {
    id: "P09",
    consulta: "¿Cómo se prepara el achiote en decocción?",
    esperado: ["achiote", "bixa"],
    tipo: "planta_concreta",
  },
  {
    id: "P10",
    consulta: "¿Qué es Bixa orellana?",
    esperado: ["achiote", "bixa"],
    tipo: "planta_concreta",
  },
  {
    id: "P11",
    consulta: "plantas para quemaduras de la piel",
    esperado: [],
    tipo: "sintoma",
    minResultados: 1,
  },
  {
    id: "P12",
    consulta: "¿Para qué sirve la margarita?",
    esperado: ["margarita", "bidens"],
    tipo: "planta_concreta",
  },
  {
    id: "P13",
    consulta: "¿Y sus contraindicaciones?",
    mensajes: [
      { role: "user", content: "¿Para qué sirve el achiote?" },
      { role: "assistant", content: "El achiote se usa en la región para usos medicinales tradicionales." },
    ],
    esperado: ["achiote", "bixa"],
    tipo: "seguimiento",
  },
  {
    id: "P14",
    consulta: "¿Qué compuestos activos tiene el achiote?",
    esperado: ["achiote", "bixa"],
    tipo: "planta_concreta",
  },
  {
    id: "P15",
    consulta: "plantas medicinales para el insomnio o nervios",
    esperado: [],
    tipo: "sintoma",
    minResultados: 1,
  },
];

function coincideEsperado(plantas, esperado) {
  if (!esperado.length) return true;
  const textos = plantas.flatMap((p) => [norm(p.nombreComun), norm(p.nombreCientifico ?? "")]);
  return esperado.some((e) => textos.some((t) => t.includes(norm(e))));
}

async function main() {
  console.log("Farmacia Viva — validación RAG (recuperación)\n");
  const resultados = [];
  let ok = 0;
  let fail = 0;

  for (const prueba of PRUEBAS) {
    const mensajes = prueba.mensajes ?? [];
    const plantas = await buscarContextoRAG(prueba.consulta, mensajes);
    const nombres = plantas.map((p) => p.nombreComun);
    const tieneMin = plantas.length >= (prueba.minResultados ?? 1);
    const coincide = coincideEsperado(plantas, prueba.esperado);
    const pasa = plantas.length > 0 && tieneMin && coincide;

    if (pasa) ok++;
    else fail++;

    const fila = {
      id: prueba.id,
      consulta: prueba.consulta,
      tipo: prueba.tipo,
      estado: pasa ? "OK" : "FALLO",
      plantasRecuperadas: nombres,
      ids: plantas.map((p) => p.id),
    };
    resultados.push(fila);

    const icono = pasa ? "✅" : "❌";
    console.log(`${icono} ${prueba.id}: ${prueba.consulta}`);
    console.log(`   → ${nombres.join(", ") || "(sin resultados)"}\n`);
  }

  console.log(`Resumen: ${ok}/${PRUEBAS.length} OK, ${fail} fallos\n`);

  const salida = {
    fecha: new Date().toISOString(),
    total: PRUEBAS.length,
    ok,
    fallos: fail,
    resultados,
  };

  const outPath = resolve(__dirname, "../../docs/rag-pruebas-resultado.json");
  writeFileSync(outPath, JSON.stringify(salida, null, 2), "utf8");
  console.log(`Resultado guardado en docs/rag-pruebas-resultado.json`);

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
