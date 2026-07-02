/**
 * Valida rutas públicas y APIs en el despliegue de Vercel (producción).
 *
 * Uso:
 *   cd web
 *   npm run prod:validar
 *
 * Opcional:
 *   PROD_URL=https://tu-app.vercel.app npm run prod:validar
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, "../../web");
const PROD_URL = (process.env.PROD_URL ?? "https://project-gzlfs.vercel.app").replace(/\/$/, "");
const TIMEOUT_MS = 90_000;

const resultados = [];

function ok(nombre, detalle) {
  resultados.push({ nombre, ok: true, detalle });
  console.log(`✅ ${nombre}${detalle ? ` — ${detalle}` : ""}`);
}

function fail(nombre, detalle) {
  resultados.push({ nombre, ok: false, detalle });
  console.error(`❌ ${nombre}${detalle ? ` — ${detalle}` : ""}`);
}

async function fetchConTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function validarPagina(ruta, debeContener) {
  const url = `${PROD_URL}${ruta}`;
  try {
    const res = await fetchConTimeout(url, { method: "GET" });
    const html = await res.text();
    if (res.status !== 200) {
      fail(`GET ${ruta}`, `HTTP ${res.status}`);
      return;
    }
    const faltantes = debeContener.filter((t) => !html.includes(t));
    if (faltantes.length) {
      fail(`GET ${ruta}`, `Falta en HTML: ${faltantes.join(", ")}`);
      return;
    }
    ok(`GET ${ruta}`, `HTTP 200 (${html.length} bytes)`);
  } catch (e) {
    fail(`GET ${ruta}`, e instanceof Error ? e.message : String(e));
  }
}

async function validarImagenEnFicha() {
  const url = `${PROD_URL}/planta/283`;
  try {
    const res = await fetchConTimeout(url);
    const html = await res.text();
    const match = html.match(/https?:\/\/[^"'\s]+supabase[^"'\s]+\.(jpg|jpeg|png|webp)/i);
    if (match) {
      const imgRes = await fetchConTimeout(match[0], { method: "HEAD" });
      if (imgRes.ok) ok("Imagen ficha planta", `HEAD ${imgRes.status} — ${match[0].slice(0, 80)}…`);
      else fail("Imagen ficha planta", `HEAD ${imgRes.status}`);
    } else if (html.includes("supabase") && (html.includes("<img") || html.includes("next/image"))) {
      ok("Imagen ficha planta", "Marcador de imagen presente en HTML");
    } else {
      fail("Imagen ficha planta", "No se detectó URL de imagen en la ficha");
    }
  } catch (e) {
    fail("Imagen ficha planta", e instanceof Error ? e.message : String(e));
  }
}

async function validarApiChatVacio() {
  const url = `${PROD_URL}/api/chat`;
  try {
    const res = await fetchConTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", parts: [{ type: "text", text: "   " }] }] }),
    });
    if (res.status === 400) ok("POST /api/chat (vacío)", "HTTP 400 — validación correcta");
    else fail("POST /api/chat (vacío)", `HTTP ${res.status}`);
  } catch (e) {
    fail("POST /api/chat (vacío)", e instanceof Error ? e.message : String(e));
  }
}

async function validarApiChatRAG() {
  const url = `${PROD_URL}/api/chat`;
  const body = {
    messages: [
      {
        role: "user",
        parts: [{ type: "text", text: "¿Para qué sirve el ajonjolí medicinal?" }],
      },
    ],
  };
  try {
    const res = await fetchConTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 503) {
      fail("POST /api/chat (RAG)", "HTTP 503 — falta DEEPSEEK_API_KEY en Vercel");
      return;
    }
    if (res.status !== 200) {
      fail("POST /api/chat (RAG)", `HTTP ${res.status}`);
      return;
    }
    const text = await res.text();
    if (text.includes("text-delta") || text.includes("ajonjol") || text.includes("Ajonjol")) {
      ok("POST /api/chat (RAG)", "Stream 200 con respuesta");
    } else {
      fail("POST /api/chat (RAG)", "Stream 200 pero sin contenido esperado");
    }
  } catch (e) {
    fail("POST /api/chat (RAG)", e instanceof Error ? e.message : String(e));
  }
}

async function validarApiGuiaTriaje() {
  const url = `${PROD_URL}/api/chat/guia`;
  const body = {
    fase: "triaje",
    padecimiento: {
      id: "congestion-nasal",
      label: "Congestión nasal",
      padecimiento: "Congestión y molestias nasales",
      terminosRAG: ["congestión nasal", "nariz", "resfriado"],
      especialista: "Especialista clínico",
      ruta: ["Malestar reportado", "Congestión nasal"],
    },
    messages: [{ role: "user", content: "ME DUELE MUCHO LA NARIZ" }],
    notasTriaje: "",
  };
  try {
    const res = await fetchConTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 503) {
      fail("POST /api/chat/guia (triaje)", "HTTP 503 — falta DEEPSEEK_API_KEY");
      return;
    }
    if (res.status !== 200) {
      fail("POST /api/chat/guia (triaje)", `HTTP ${res.status}`);
      return;
    }
    const json = await res.json();
    if (json.texto?.length > 20) {
      ok("POST /api/chat/guia (triaje)", `Respuesta ${json.texto.length} caracteres`);
    } else {
      fail("POST /api/chat/guia (triaje)", "JSON sin campo texto útil");
    }
  } catch (e) {
    fail("POST /api/chat/guia (triaje)", e instanceof Error ? e.message : String(e));
  }
}

async function validarSupabaseDesdeEnv() {
  const envPath = resolve(webRoot, ".env.local");
  if (!existsSync(envPath)) {
    fail("Supabase (local .env.local)", "No hay .env.local — omitir o crear para validar BD");
    return;
  }
  const env = {};
  for (const linea of readFileSync(envPath, "utf8").split("\n")) {
    const t = linea.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    fail("Supabase (conexión)", "Faltan variables en .env.local");
    return;
  }
  try {
    const res = await fetchConTimeout(`${url}/rest/v1/especie?select=id_especie&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      fail("Supabase (conexión)", `REST HTTP ${res.status}`);
      return;
    }
    const data = await res.json();
    if (Array.isArray(data) && data.length >= 1) {
      ok("Supabase (conexión)", `REST OK — proyecto ${new URL(url).hostname.split(".")[0]}`);
    } else {
      fail("Supabase (conexión)", "Sin filas en especie");
    }
  } catch (e) {
    fail("Supabase (conexión)", e instanceof Error ? e.message : String(e));
  }
}

console.log(`\n🔍 Validación producción — ${PROD_URL}\n`);

await validarPagina("/", ["Farmacia Viva"]);
await validarPagina("/catalogo", ["Catálogo", "especies"]);
await validarPagina("/planta/283", ["Ajonjolí"]);
await validarPagina("/asistente", ["Médico Virtual"]);
await validarImagenEnFicha();
await validarApiChatVacio();
await validarApiChatRAG();
await validarApiGuiaTriaje();
await validarSupabaseDesdeEnv();

const pasaron = resultados.filter((r) => r.ok).length;
const total = resultados.length;
const informe = {
  fecha: new Date().toISOString(),
  url: PROD_URL,
  resumen: `${pasaron}/${total} pruebas OK`,
  pruebas: resultados,
};

const outPath = resolve(__dirname, "../../evidencia/semana7/prod-validacion-resultado.json");
writeFileSync(outPath, JSON.stringify(informe, null, 2), "utf8");

console.log(`\n📄 Informe: evidencia/semana7/prod-validacion-resultado.json`);
console.log(`\n${pasaron}/${total} pruebas OK\n`);

process.exit(pasaron === total ? 0 : 1);
