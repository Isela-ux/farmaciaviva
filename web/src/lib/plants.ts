import { createClient } from "@/lib/supabase/server";
import { etiquetaEspecie, etiquetaUbicacion, ordenarImagenes, urlImagenParaLista } from "@/lib/images";
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
  PlantaMedicoVirtual,
  Propiedad,
  UbicacionAgrupada,
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

  const familias = await obtenerFamilias();
  const familiaPorId = new Map(familias.map((f) => [f.id_familia, f.nombre_familia]));

  return nombres
    .map((nombreComun) => {
      const especie = especiePorId.get(nombreComun.id_especie);
      const idFamilia = familiaPorEspecie.get(nombreComun.id_especie) ?? null;
      return {
        nombreComun,
        imagenUrl: urlImagenParaLista(nombreComun, imagenes, cantidadNombres),
        nombreCientifico: especie ? etiquetaEspecie(especie) : null,
        idFamilia,
        nombreFamilia: idFamilia ? familiaPorId.get(idFamilia) ?? null : null,
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

function claveContenidoUbicacion(eu: EspecieUbicacion): string {
  return [
    eu.es_nativa?.toString() ?? "",
    eu.es_cultivada?.toString() ?? "",
    eu.abundancia?.trim() ?? "",
    eu.observaciones?.trim() ?? "",
  ].join("|");
}

/** Misma lógica que Ubicacion.kt (Android): quita vínculos repetidos y lugares que se ven iguales. */
function deduplicarUbicacionesPorEspecie(
  vinculos: EspecieUbicacion[],
  catalogo: Map<number, UbicacionGeografica>
): EspecieUbicacion[] {
  const porId = new Map<number, EspecieUbicacion>();
  for (const v of vinculos) {
    porId.set(v.id_especie_ubicacion, v);
  }

  const vistosVinculo = new Set<string>();
  const sinDuplicarVinculo: EspecieUbicacion[] = [];
  for (const v of [...porId.values()].sort((a, b) => a.id_especie_ubicacion - b.id_especie_ubicacion)) {
    const clave = `${v.id_ubicacion}|${claveContenidoUbicacion(v)}`;
    if (vistosVinculo.has(clave)) continue;
    vistosVinculo.add(clave);
    sinDuplicarVinculo.push(v);
  }

  const vistosEtiqueta = new Set<string>();
  const resultado: EspecieUbicacion[] = [];
  for (const v of sinDuplicarVinculo) {
    const ubi = catalogo.get(v.id_ubicacion);
    const etiqueta = ubi ? etiquetaUbicacion(ubi) : `Ubicación #${v.id_ubicacion}`;
    const clave = `${etiqueta}|${claveContenidoUbicacion(v)}`;
    if (vistosEtiqueta.has(clave)) continue;
    vistosEtiqueta.add(clave);
    resultado.push(v);
  }

  return resultado.sort((a, b) => {
    const ubiA = catalogo.get(a.id_ubicacion);
    const ubiB = catalogo.get(b.id_ubicacion);
    const ta = (ubiA ? etiquetaUbicacion(ubiA) : `Ubicación #${a.id_ubicacion}`).toLowerCase();
    const tb = (ubiB ? etiquetaUbicacion(ubiB) : `Ubicación #${b.id_ubicacion}`).toLowerCase();
    if (ta !== tb) return ta.localeCompare(tb, "es");
    return a.id_especie_ubicacion - b.id_especie_ubicacion;
  });
}

function tituloZonaUbicacion(ubi: UbicacionGeografica): string {
  const partes = [ubi.pais, ubi.estado, ubi.municipio]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p));
  return partes.join(" · ") || etiquetaUbicacion(ubi);
}

/** Agrupa micro-localidades bajo la misma zona (país · estado · municipio) y mismo reporte. */
function agruparUbicacionesPorEspecie(
  vinculos: EspecieUbicacion[],
  catalogo: Map<number, UbicacionGeografica>
): UbicacionAgrupada[] {
  const grupos = new Map<string, UbicacionAgrupada>();

  for (const v of vinculos) {
    const ubi = catalogo.get(v.id_ubicacion);
    if (!ubi) continue;

    const tituloZona = tituloZonaUbicacion(ubi);
    const clave = `${tituloZona}|${claveContenidoUbicacion(v)}`;
    const localidad = ubi.localidad?.trim();

    const existente = grupos.get(clave);
    if (!existente) {
      grupos.set(clave, {
        tituloZona,
        localidades: localidad ? [localidad] : [],
        es_nativa: v.es_nativa,
        es_cultivada: v.es_cultivada,
        abundancia: v.abundancia,
        observaciones: v.observaciones,
      });
      continue;
    }

    if (localidad && !existente.localidades.includes(localidad)) {
      existente.localidades.push(localidad);
    }
  }

  return [...grupos.values()]
    .map((grupo) => ({
      ...grupo,
      localidades: [...grupo.localidades].sort((a, b) => a.localeCompare(b, "es")),
    }))
    .sort((a, b) => a.tituloZona.localeCompare(b.tituloZona, "es"));
}

export function etiquetaMetadatosUbicacion(grupo: UbicacionAgrupada): string {
  return [
    grupo.es_nativa != null && (grupo.es_nativa ? "Nativa" : "No nativa"),
    grupo.es_cultivada != null && (grupo.es_cultivada ? "Cultivada" : ""),
    grupo.abundancia,
    grupo.observaciones,
  ]
    .filter(Boolean)
    .join(" · ");
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

  const ubicacionesUnicas = deduplicarUbicacionesPorEspecie(ubiList, catalogoUbicaciones);
  const ubicacionesAgrupadas = agruparUbicacionesPorEspecie(ubicacionesUnicas, catalogoUbicaciones);

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
    ubicaciones: ubicacionesUnicas,
    ubicacionesAgrupadas,
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

function coincidePalabraConTermino(palabra: string, termino: string): boolean {
  if (palabra.length < 4 || termino.length < 4) return false;
  return palabra.startsWith(termino) || termino.startsWith(palabra);
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
        comun.split(/\s+/).some((palabra) => coincidePalabraConTermino(palabra, t))
    );
  };

  return catalogo.filter(coincide).slice(0, limite);
}

const SINONIMOS_MEDICINALES: Record<string, string[]> = {
  digest: ["digest", "estomago", "intestinal", "gastric", "flatul", "colico"],
  inflam: ["inflam", "dolor", "reuma", "artri"],
  respir: ["respir", "tos", "pulmon", "bronqu"],
  piel: ["piel", "dermat", "herida", "quemad"],
  nerv: ["nerv", "ansied", "insomn", "estres"],
  febr: ["febr", "fiebre", "grip"],
};

function expandirTerminosMedicinales(terminos: string[]): string[] {
  const out = new Set(terminos);
  for (const t of terminos) {
    for (const [clave, variantes] of Object.entries(SINONIMOS_MEDICINALES)) {
      if (t.includes(clave) || variantes.some((v) => t.includes(v))) {
        out.add(clave);
        variantes.forEach((v) => out.add(v));
      }
    }
  }
  return [...out];
}

/** Búsqueda por nombre + usos medicinales (sin depender solo de embeddings). */
export async function buscarPlantasPorContenidoMedicinal(
  termino: string,
  limite = 8
): Promise<PlantaCatalogo[]> {
  const porNombre = await buscarPlantasPorTexto(termino, limite);
  if (porNombre.length >= limite) return porNombre;

  const terminos = expandirTerminosMedicinales(extraerTerminosBusqueda(termino));
  if (terminos.length === 0) return porNombre;

  const supabase = await createClient();
  const ids = new Set(porNombre.map((p) => p.nombreComun.id_especie));
  const idsExtra: number[] = [];

  for (const t of terminos.slice(0, 6)) {
    const { data: usos } = await supabase
      .from("uso_planta")
      .select("id_especie")
      .ilike("descripcion_uso", `%${t}%`)
      .limit(limite * 3);

    for (const row of usos ?? []) {
      if (ids.has(row.id_especie)) continue;
      ids.add(row.id_especie);
      idsExtra.push(row.id_especie);
      if (porNombre.length + idsExtra.length >= limite) break;
    }

    if (porNombre.length + idsExtra.length >= limite) break;

    const { data: props } = await supabase
      .from("propiedad")
      .select("id_propiedad, nombre_propiedad")
      .ilike("nombre_propiedad", `%${t}%`)
      .limit(10);

    if (props?.length) {
      const idsProp = props.map((p) => p.id_propiedad);
      const { data: ep } = await supabase
        .from("especie_propiedad")
        .select("id_especie")
        .in("id_propiedad", idsProp)
        .limit(limite * 3);

      for (const row of ep ?? []) {
        if (ids.has(row.id_especie)) continue;
        ids.add(row.id_especie);
        idsExtra.push(row.id_especie);
        if (porNombre.length + idsExtra.length >= limite) break;
      }
    }
  }

  if (idsExtra.length === 0) return porNombre;

  const catalogo = await obtenerCatalogoPlantas();
  const mapa = new Map(catalogo.map((p) => [p.nombreComun.id_especie, p]));
  const extras = idsExtra
    .map((id) => mapa.get(id))
    .filter((p): p is PlantaCatalogo => Boolean(p));

  return [...porNombre, ...extras].slice(0, limite);
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
    const cientifico = p.nombreCientifico ? normalizarTextoBusqueda(p.nombreCientifico) : "";
    const genero = cientifico.split(/\s+/)[0] ?? "";

    const coincideComun = comun.length >= 4 && textoNorm.includes(comun);
    const coincideCientifico =
      cientifico.length >= 5 &&
      (textoNorm.includes(cientifico) || (genero.length >= 5 && textoNorm.includes(genero)));

    if (!coincideComun && !coincideCientifico) continue;
    if (ids.has(p.nombreComun.id_especie)) continue;
    ids.add(p.nombreComun.id_especie);
    resultados.push(p);
    if (resultados.length >= limite) break;
  }

  return resultados;
}

export function respuestaRechazaTarjetasPlantas(respuesta: string): boolean {
  const t = normalizarTextoBusqueda(respuesta);
  return (
    /\b(no recomiendo|no recomendamos|sin consulta presencial|no sustituye|no automedicaci|sin coincidencias|ninguna planta|requiere atencion clinica|requiere consulta|consulta medica|consulta presencial|atencion clinica personal|atencion medica)\b/.test(
      t
    ) || /\bno recomiend\w*\s+(plantas|automedicaci)/.test(t)
  );
}

function esConsultaExplicitaPlanta(consulta: string): boolean {
  const t = normalizarTextoBusqueda(consulta);
  return (
    /\b(para que sirve|para qué sirve|como se prepara|cómo se prepara|mas informacion|más informacion|informacion del|información del|hablame del|háblame del|planta llamada|que es la planta|qué es la planta)\b/.test(
      t
    ) || /\bplantas?\b/.test(t)
  );
}

export function esConsultaDeSeguimiento(consulta: string): boolean {
  const q = consulta.trim().toLowerCase();
  return (
    extraerTerminosBusqueda(consulta).length === 0 ||
    /^(y\s+)?(cuales|cuáles|que|qué|cual|cuál|dime|cuéntame|cuentame|hablame|háblame)\b/.test(q) ||
    /\b(sus|su|esta|este|esa|ese|ello|alli|allí|ahi|ahí)\b/.test(q)
  );
}

/**
 * Plantas para tarjetas del Médico Virtual.
 * Más estricto que buscarContextoRAG: solo nombres explícitos o coincidencia directa,
 * sin búsqueda vectorial ni medicinal amplia (evita imágenes irrelevantes).
 *
 * Si hay `respuestaAsistente`, prioriza las especies que el modelo nombró en ese turno
 * (evita mostrar achiote del historial cuando la respuesta habla de guayaba).
 */
export async function buscarPlantasParaTarjetas(
  consulta: string,
  mensajes: { role: string; content: string }[] = [],
  respuestaAsistente?: string
): Promise<PlantaMedicoVirtual[]> {
  const consultaActual = consulta.trim();
  const respuesta = respuestaAsistente?.trim() ?? "";
  if (!consultaActual && !respuesta) return [];

  if (respuesta && respuestaRechazaTarjetasPlantas(respuesta)) return [];

  const idsDesde = (plantas: PlantaCatalogo[]) =>
    obtenerPlantasPorIds(plantas.map((p) => p.nombreComun.id_especie));

  if (respuesta) {
    const enRespuesta = await buscarPlantasMencionadasEnTexto(respuesta, 3);
    if (enRespuesta.length > 0) {
      return idsDesde(enRespuesta);
    }
  }

  const mencionadasActual = await buscarPlantasMencionadasEnTexto(consultaActual, 3);
  if (mencionadasActual.length > 0) {
    return idsDesde(mencionadasActual.slice(0, 3));
  }

  if (esConsultaExplicitaPlanta(consultaActual)) {
    const porTexto = await buscarPlantasPorTexto(consultaActual, 2);
    if (porTexto.length > 0) {
      return idsDesde(porTexto.slice(0, 2));
    }
  }

  if (!esConsultaDeSeguimiento(consultaActual)) {
    return [];
  }

  const textoConversacion = mensajes.map((m) => m.content).join("\n");
  const delHistorial = await buscarPlantasMencionadasEnTexto(textoConversacion, 3);
  if (delHistorial.length > 0) {
    return idsDesde(delHistorial);
  }

  return [];
}

/** Resumen con imagen para tarjetas del Médico Virtual. */
export async function obtenerPlantasPorIds(
  ids: number[]
): Promise<PlantaMedicoVirtual[]> {
  const unicos = [...new Set(ids.filter((id) => Number.isFinite(id)))];
  if (!unicos.length) return [];

  const catalogo = await obtenerCatalogoPlantas();
  const porEspecie = new Map<number, PlantaCatalogo>();
  for (const p of catalogo) {
    if (!porEspecie.has(p.nombreComun.id_especie)) {
      porEspecie.set(p.nombreComun.id_especie, p);
    }
  }

  return unicos
    .map((idEspecie) => {
      const p = porEspecie.get(idEspecie);
      if (!p) return null;
      return {
        idEspecie,
        nombreComun: p.nombreComun.nombre_comun,
        nombreCientifico: p.nombreCientifico,
        imagenUrl: p.imagenUrl,
      };
    })
    .filter((p): p is PlantaMedicoVirtual => p !== null);
}
