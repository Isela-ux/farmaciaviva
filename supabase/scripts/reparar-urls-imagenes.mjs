/**
 * Repara URLs de imagen_especie que no coinciden con archivos reales en Storage.
 * Uso (desde web/, con .env.local):
 *   node ../supabase/scripts/reparar-urls-imagenes.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../web/.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

function norm(s) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const listRes = await fetch(`${base}/storage/v1/object/list/plantas`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prefix: "", limit: 2000 }),
});
const list = await listRes.json();
if (!Array.isArray(list)) {
  console.error("No se pudo listar Storage:", list);
  process.exit(1);
}

const byNorm = new Map();
const byLower = new Map();
for (const o of list) {
  byLower.set(o.name.toLowerCase(), o.name);
  byNorm.set(norm(o.name.replace(/\.[^.]+$/, "")), o.name);
}

const imgRes = await fetch(
  `${base}/rest/v1/imagen_especie?select=id_imagen,id_especie,id_nombre_comun,url_imagen`,
  { headers: { apikey: anon, Authorization: `Bearer ${anon}` } }
);
const imgs = await imgRes.json();
const nomRes = await fetch(
  `${base}/rest/v1/nombre_comun?select=id_nombre_comun,id_especie,nombre_comun`,
  { headers: { apikey: anon, Authorization: `Bearer ${anon}` } }
);
const noms = await nomRes.json();
const nomById = new Map(noms.map((n) => [n.id_nombre_comun, n]));
const nomByEsp = new Map();
for (const n of noms) {
  if (!nomByEsp.has(n.id_especie)) nomByEsp.set(n.id_especie, []);
  nomByEsp.get(n.id_especie).push(n);
}

const prefix = `${base}/storage/v1/object/public/plantas/`;
const updates = [];

for (const img of imgs) {
  const raw = (img.url_imagen || "").replace(/[\r\n\t]+/g, "").trim();
  if (!raw.includes("/plantas/")) continue;
  let file = decodeURIComponent(raw.split("/").pop() || "").trim();
  file = file.replace(/[\r\n]+/g, "").trim();

  let resolved = byLower.get(file.toLowerCase()) || null;
  if (!resolved) {
    const candidates = [];
    const n = img.id_nombre_comun ? nomById.get(img.id_nombre_comun) : null;
    if (n) candidates.push(n.nombre_comun);
    for (const nn of nomByEsp.get(img.id_especie) || []) candidates.push(nn.nombre_comun);
    candidates.push(file.replace(/\.[^.]+$/, ""));
    for (const c of candidates) {
      const hit = byNorm.get(norm(c));
      if (hit) {
        resolved = hit;
        break;
      }
    }
  }
  if (!resolved) continue;

  const next = prefix + resolved.split("/").map(encodeURIComponent).join("/");
  if (next !== img.url_imagen) {
    updates.push({ id_imagen: img.id_imagen, url_imagen: next, from: file, to: resolved });
  }
}

console.log(`Reparaciones: ${updates.length}`);
for (const u of updates) {
  const res = await fetch(`${base}/rest/v1/imagen_especie?id_imagen=eq.${u.id_imagen}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ url_imagen: u.url_imagen }),
  });
  console.log(`${res.status}  ${u.from}  →  ${u.to}`);
}
