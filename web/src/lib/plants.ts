import { createClient } from "@/lib/supabase/server";
import { etiquetaEspecie, ordenarImagenes, urlImagenParaLista } from "@/lib/images";
import type {
  CategoriaUso,
  CompuestoActivo,
  DetalleFuenteEspecie,
  EspecieCompuesto,
  EspecieDetalle,
  EspecieHabitat,
  EspeciePropiedad,
  EspecieUbicacion,
  Familia,
  FichaPlanta,
  Fuente,
  GeneroInfo,
  Habitat,
  ImagenEspecie,
  NombreComun,
  PlantaCatalogo,
  Propiedad,
  UbicacionGeografica,
  UsoPlanta,
} from "@/types/database";

async function selectFromTable<T>(tabla: string): Promise<T[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from(tabla).select("*");
  if (error) throw error;
  return (data ?? []) as T[];
}

async function selectFirstTable<T>(tablas: string[]): Promise<T[]> {
  let lastError: Error | null = null;
  for (const tabla of tablas) {
    try {
      return await selectFromTable<T>(tabla);
    } catch (e) {
      lastError = e as Error;
    }
  }
  throw lastError ?? new Error(`No se pudo leer: ${tablas.join(", ")}`);
}

export async function obtenerNombresComunes(): Promise<NombreComun[]> {
  return selectFromTable<NombreComun>("nombre_comun");
}

export async function obtenerImagenesEspecie(): Promise<ImagenEspecie[]> {
  const filas = await selectFromTable<ImagenEspecie>("imagen_especie");
  return ordenarImagenes(filas);
}

export async function obtenerFamilias(): Promise<Familia[]> {
  return selectFirstTable<Familia>(["familia", "familias"]);
}

export async function obtenerMapaFamiliaPorEspecie(): Promise<Map<number, number>> {
  const supabase = await createClient();

  const { data: especies } = await supabase
    .from("especie")
    .select("id_especie, id_genero");

  if (!especies?.length) return new Map();

  let generos: { id_genero: number; id_familia: number | null }[] = [];
  for (const tabla of ["genero", "generos"]) {
    const { data, error } = await supabase.from(tabla).select("id_genero, id_familia");
    if (!error && data) {
      generos = data;
      break;
    }
  }

  const generoAFamilia = new Map(
    generos.filter((g) => g.id_familia != null).map((g) => [g.id_genero, g.id_familia!])
  );

  const mapa = new Map<number, number>();
  for (const e of especies) {
    if (e.id_genero && generoAFamilia.has(e.id_genero)) {
      mapa.set(e.id_especie, generoAFamilia.get(e.id_genero)!);
    }
  }
  return mapa;
}

export async function obtenerCatalogoPlantas(): Promise<PlantaCatalogo[]> {
  const [nombres, imagenes, familiaPorEspecie] = await Promise.all([
    obtenerNombresComunes(),
    obtenerImagenesEspecie(),
    obtenerMapaFamiliaPorEspecie(),
  ]);

  const supabase = await createClient();
  const { data: especies } = await supabase
    .from("especie")
    .select("id_especie, nombre_cientifico, epiteto_especifico");

  const especiePorId = new Map((especies ?? []).map((e) => [e.id_especie, e]));

  const cantidadNombres = new Map<number, number>();
  for (const n of nombres) {
    cantidadNombres.set(n.id_especie, (cantidadNombres.get(n.id_especie) ?? 0) + 1);
  }

  return nombres
    .map((nombreComun) => {
      const especie = especiePorId.get(nombreComun.id_especie);
      return {
        nombreComun,
        imagenUrl: urlImagenParaLista(nombreComun, imagenes, cantidadNombres),
        nombreCientifico: especie ? etiquetaEspecie(especie) : null,
        idFamilia: familiaPorEspecie.get(nombreComun.id_especie) ?? null,
      };
    })
    .sort((a, b) => a.nombreComun.nombre_comun.localeCompare(b.nombreComun.nombre_comun, "es"));
}

export async function obtenerEspecieDetalle(idEspecie: number): Promise<EspecieDetalle | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("especie")
    .select(
      "id_especie, nombre_cientifico, autor_taxonomico, epiteto_especifico, descripcion_botanica, ciclo_vida, tipo_planta, estatus_conservacion, origen_geografico, es_endemica, observaciones, id_genero"
    )
    .eq("id_especie", idEspecie)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function obtenerGeneroInfo(idGenero: number): Promise<GeneroInfo | null> {
  const supabase = await createClient();
  for (const tabla of ["genero", "generos"]) {
    const { data, error } = await supabase
      .from(tabla)
      .select("id_genero, nombre_genero, id_familia")
      .eq("id_genero", idGenero)
      .maybeSingle();
    if (!error && data) return data;
  }
  return null;
}

async function cargarPorIds<T>(
  tabla: string,
  idCol: string,
  ids: number[]
): Promise<Map<number, T>> {
  const mapa = new Map<number, T>();
  if (!ids.length) return mapa;

  const supabase = await createClient();
  const unicos = [...new Set(ids)];

  for (const id of unicos) {
    const { data } = await supabase.from(tabla).select("*").eq(idCol, id).maybeSingle();
    if (data) mapa.set(id, data as T);
  }
  return mapa;
}

export async function obtenerFichaPlanta(idEspecie: number): Promise<FichaPlanta | null> {
  const especie = await obtenerEspecieDetalle(idEspecie);
  if (!especie) return null;

  const supabase = await createClient();

  const [
    nombresComunes,
    imagenesRaw,
    usos,
    propiedades,
    compuestos,
    habitats,
    ubicaciones,
    fuentes,
  ] = await Promise.all([
    supabase.from("nombre_comun").select("*").eq("id_especie", idEspecie),
    supabase.from("imagen_especie").select("*").eq("id_especie", idEspecie),
    supabase.from("uso_planta").select("*").eq("id_especie", idEspecie),
    supabase.from("especie_propiedad").select("*").eq("id_especie", idEspecie),
    supabase.from("especie_compuesto").select("*").eq("id_especie", idEspecie),
    supabase.from("especie_habitat").select("*").eq("id_especie", idEspecie),
    supabase.from("especie_ubicacion").select("*").eq("id_especie", idEspecie),
    supabase.from("detalle_fuente_especie").select("*").eq("id_especie", idEspecie),
  ]);

  const genero = especie.id_genero ? await obtenerGeneroInfo(especie.id_genero) : null;
  let familia: Familia | null = null;
  if (genero?.id_familia) {
    const familias = await obtenerFamilias();
    familia = familias.find((f) => f.id_familia === genero.id_familia) ?? null;
  }

  const usosList = (usos.data ?? []) as UsoPlanta[];
  const propList = (propiedades.data ?? []) as EspeciePropiedad[];
  const compList = (compuestos.data ?? []) as EspecieCompuesto[];
  const habList = (habitats.data ?? []) as EspecieHabitat[];
  const ubiList = (ubicaciones.data ?? []) as EspecieUbicacion[];
  const fuentesList = (fuentes.data ?? []) as DetalleFuenteEspecie[];

  const [categoriasUso, catalogoPropiedades, catalogoCompuestos, catalogoHabitats, catalogoUbicaciones, catalogoFuentes] =
    await Promise.all([
      cargarPorIds<CategoriaUso>("categoria_uso", "id_categoria_uso", usosList.map((u) => u.id_categoria_uso).filter(Boolean) as number[]),
      cargarPorIds<Propiedad>("propiedad", "id_propiedad", propList.map((p) => p.id_propiedad)),
      cargarPorIds<CompuestoActivo>("compuesto_activo", "id_compuesto", compList.map((c) => c.id_compuesto)),
      cargarPorIds<Habitat>("habitat", "id_habitat", habList.map((h) => h.id_habitat)),
      cargarPorIds<UbicacionGeografica>("ubicacion_geografica", "id_ubicacion", ubiList.map((u) => u.id_ubicacion)),
      cargarPorIds<Fuente>("fuente", "id_fuente", fuentesList.map((f) => f.id_fuente)),
    ]);

  // Fallback tabla fuentes
  if (catalogoFuentes.size === 0 && fuentesList.length > 0) {
    const alt = await cargarPorIds<Fuente>("fuentes", "id_fuente", fuentesList.map((f) => f.id_fuente));
    alt.forEach((v, k) => catalogoFuentes.set(k, v));
  }

  return {
    especie,
    nombresComunes: (nombresComunes.data ?? []) as NombreComun[],
    imagenes: ordenarImagenes((imagenesRaw.data ?? []) as ImagenEspecie[]),
    genero,
    familia,
    usos: usosList,
    categoriasUso,
    propiedades: propList,
    catalogoPropiedades,
    compuestos: compList,
    catalogoCompuestos,
    habitats: habList,
    catalogoHabitats,
    ubicaciones: ubiList,
    catalogoUbicaciones,
    fuentes: fuentesList,
    catalogoFuentes,
  };
}

export async function contarEspecies(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("especie")
    .select("id_especie", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function buscarPlantasPorTexto(termino: string, limite = 8): Promise<PlantaCatalogo[]> {
  const catalogo = await obtenerCatalogoPlantas();
  const q = termino.trim();
  if (!q) return catalogo.slice(0, limite);

  const terminos = extraerTerminosBusqueda(q);
  const normalizar = normalizarTextoBusqueda;

  const coincide = (p: PlantaCatalogo) => {
    const comun = normalizar(p.nombreComun.nombre_comun);
    const cientifico = p.nombreCientifico ? normalizar(p.nombreCientifico) : "";
    const frase = normalizar(q);

    if (comun.includes(frase) || cientifico.includes(frase)) return true;
    if (terminos.length === 0) return false;

    return terminos.some(
      (t) =>
        comun.includes(t) ||
        cientifico.includes(t) ||
        comun.split(/\s+/).some((palabra) => palabra.startsWith(t) || t.startsWith(palabra))
    );
  };

  return catalogo.filter(coincide).slice(0, limite);
}

/** Normaliza texto para comparar nombres de plantas. */
export function normalizarTextoBusqueda(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

const STOPWORDS_BUSQUEDA = new Set([
  "donde", "puedo", "encontrar", "encontratr", "planta", "plantas", "del", "de", "la", "el",
  "los", "las", "un", "una", "unos", "unas", "es", "son", "que", "cual", "ubicacion",
  "ubicación", "saber", "quiero", "osea", "esta", "este", "se", "para", "con", "por", "en",
  "al", "como", "hay", "tiene", "tienen", "sirve", "usar", "sobre", "medicinal",
  "medicinales", "nombre", "cientifico", "region", "cuales", "cuáles", "sus", "ese", "esa",
  "esto", "estos", "y", "o", "a", "mi", "me", "te", "le", "lo", "muy", "mas", "más",
]);

export function extraerTerminosBusqueda(termino: string): string[] {
  return normalizarTextoBusqueda(termino)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS_BUSQUEDA.has(t));
}

/** Detecta nombres de plantas mencionados literalmente en un texto. */
export async function buscarPlantasMencionadasEnTexto(
  texto: string,
  limite = 6
): Promise<PlantaCatalogo[]> {
  const catalogo = await obtenerCatalogoPlantas();
  const textoNorm = normalizarTextoBusqueda(texto);
  if (!textoNorm.trim()) return [];

  const ordenadas = [...catalogo].sort(
    (a, b) => b.nombreComun.nombre_comun.length - a.nombreComun.nombre_comun.length
  );

  const ids = new Set<number>();
  const resultados: PlantaCatalogo[] = [];

  for (const p of ordenadas) {
    const comun = normalizarTextoBusqueda(p.nombreComun.nombre_comun);
    if (comun.length < 4) continue;
    if (!textoNorm.includes(comun)) continue;
    if (ids.has(p.nombreComun.id_especie)) continue;
    ids.add(p.nombreComun.id_especie);
    resultados.push(p);
    if (resultados.length >= limite) break;
  }

  return resultados;
}

export function esConsultaDeSeguimiento(consulta: string): boolean {
  const q = consulta.trim().toLowerCase();
  return (
    extraerTerminosBusqueda(consulta).length === 0 ||
    /^(y\s+)?(cuales|cuáles|que|qué|cual|cuál|dime|cuéntame|cuentame|hablame|háblame)\b/.test(q) ||
    /\b(sus|su|esta|este|esa|ese|ello|alli|allí|ahi|ahí)\b/.test(q)
  );
}
