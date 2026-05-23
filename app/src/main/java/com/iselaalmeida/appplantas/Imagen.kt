package com.iselaalmeida.appplantas

import kotlinx.serialization.Serializable
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns


@Serializable
data class NombreComun(
    val id_nombre_comun: Int,
    val nombre_comun: String,
    val idioma: String,
    val region_uso: String,
    val id_especie: Int
)

suspend fun obtenerNombresComunes(): List<NombreComun> {
    return SupabaseClient.client
        .postgrest["nombre_comun"]
        .select()
        .decodeList<NombreComun>()
}

@Serializable
data class ImagenEspecie(
    val id_imagen: Int,
    val url_imagen: String,
    val es_principal: Boolean,
    val id_especie: Int,
    /** Si existe: foto solo para esa fila de nombre_comun (recomendado al subir por planta). */
    val id_nombre_comun: Int? = null,
    /** Si existe en la BD: true = mostrar; false = ocultar siempre. */
    val mostrar_en_app: Boolean? = null
)

/**
 * URL para la tarjeta de la lista: nunca “presta” la foto de otra planta.
 * - Con [id_nombre_comun] en la fila de imagen → solo esa tarjeta.
 * - Varios nombres comunes para la misma especie → vacío hasta enlazar por [id_nombre_comun].
 * - Un solo nombre común y foto a nivel especie → se muestra.
 */
fun urlImagenParaLista(
    nombreComun: NombreComun,
    imagenes: List<ImagenEspecie>,
    cantidadNombresPorEspecie: Map<Int, Int>
): String? {
    val deEspecie = imagenes.filter { it.id_especie == nombreComun.id_especie }
    val dedicada = deEspecie.filter { it.id_nombre_comun == nombreComun.id_nombre_comun }
    if (dedicada.isNotEmpty()) {
        return dedicada.ordenadasParaMostrar().firstOrNull()?.url_imagen
    }
    if (deEspecie.any { it.id_nombre_comun != null }) return null
    if ((cantidadNombresPorEspecie[nombreComun.id_especie] ?: 0) > 1) return null
    return deEspecie.ordenadasParaMostrar().firstOrNull()?.url_imagen
}

/** Host del proyecto actual (evita URLs viejas de otro Supabase). */
private fun hostProyectoActivo(): String? =
    runCatching {
        val raw = BuildConfig.SUPABASE_URL.trim().removeSuffix("/")
        java.net.URI(raw).host?.lowercase()
    }.getOrNull()

fun urlImagenDelProyectoActivo(url: String): Boolean {
    val hostActivo = hostProyectoActivo() ?: return true
    val hostUrl = runCatching {
        java.net.URI(normalizarUrlImagen(url)).host?.lowercase()
    }.getOrNull() ?: return false
    return hostUrl == hostActivo
}

/** Oculta solo URLs de otro proyecto o filas marcadas mostrar_en_app = false. */
fun ImagenEspecie.visibleEnApp(): Boolean {
    if (mostrar_en_app == false) return false
    return urlImagenDelProyectoActivo(url_imagen)
}

fun List<ImagenEspecie>.soloVisiblesEnApp(): List<ImagenEspecie> =
    filter { it.visibleEnApp() }

/** Corrige URLs mal pegadas en la BD para que Coil pueda cargarlas. */
fun normalizarUrlImagen(raw: String): String {
    var url = raw.trim()
    if (url.isEmpty()) return url
    val fixes = listOf("httphttps://", "https://https://", "hhttps://", "http://http://")
    for (mal in fixes) {
        while (url.contains(mal)) {
            url = url.replace(mal, "https://")
        }
    }
    if (url.startsWith("//")) url = "https:$url"
    if (!url.startsWith("http://", ignoreCase = true) && !url.startsWith("https://", ignoreCase = true)) {
        url = "https://$url"
    }
    return url
}

fun ImagenEspecie.conUrlNormalizada(): ImagenEspecie =
    copy(url_imagen = normalizarUrlImagen(url_imagen))

fun List<ImagenEspecie>.ordenadasParaMostrar(): List<ImagenEspecie> =
    soloVisiblesEnApp()
        .distinctBy { it.id_imagen }
        .map { it.conUrlNormalizada() }
        .filter { it.url_imagen.isNotBlank() }
        .sortedWith(
            compareByDescending<ImagenEspecie> { it.es_principal }
                .thenBy { it.id_imagen }
        )

/** URL principal solo si hay fila enlazada a esta especie (nunca una foto “global”). */
fun List<ImagenEspecie>.urlPrincipal(idEspecie: Int): String? =
    filter { it.id_especie == idEspecie }
        .ordenadasParaMostrar()
        .firstOrNull()
        ?.url_imagen

suspend fun obtenerImagenesEspecie(): List<ImagenEspecie> {
    return SupabaseClient.client
        .postgrest["imagen_especie"]
        .select()
        .decodeList<ImagenEspecie>()
        .ordenadasParaMostrar()
}

suspend fun obtenerImagenesPorEspecie(idEspecie: Int): List<ImagenEspecie> {
    val filas = listarVinculosPorEspecie<ImagenEspecie>(
        tabla = "imagen_especie",
        idEspecie = idEspecie,
        leerIdEspecie = ImagenEspecie::id_especie
    )
    return filas.ordenadasParaMostrar()
}

@Serializable
data class Familia(
    val id_familia: Int,
    val nombre_familia: String,
    val descripcion: String? = null
)

suspend fun obtenerFamilias(): List<Familia> {
    val client = SupabaseClient.client.postgrest
    var last: Throwable? = null
    for (tabla in listOf("familia", "familias")) {
        val r = runCatching { client[tabla].select().decodeList<Familia>() }
        if (r.isSuccess) return r.getOrThrow()
        last = r.exceptionOrNull()
    }
    throw last ?: IllegalStateException("familia")
}

@Serializable
data class EspecieGenero(
    val id_especie: Int,
    val id_genero: Int? = null
)

@Serializable
data class GeneroFamilia(
    val id_genero: Int,
    val id_familia: Int? = null
)

data class MapasFiltroPlantas(
    val familiaPorEspecieId: Map<Int, Int>,
    val errorResumen: String?,
    val avisoDatos: String?
)

private fun familiaPorEspecieDesdeGenero(
    especies: List<EspecieGenero>,
    generos: List<GeneroFamilia>
): Map<Int, Int> {
    val generoAFamilia = generos.mapNotNull { g ->
        val fam = g.id_familia ?: return@mapNotNull null
        g.id_genero to fam
    }.toMap()
    return especies.mapNotNull { e ->
        val gid = e.id_genero ?: return@mapNotNull null
        val fam = generoAFamilia[gid] ?: return@mapNotNull null
        e.id_especie to fam
    }.toMap()
}

suspend fun obtenerMapasFiltroPlantas(): MapasFiltroPlantas {
    val client = SupabaseClient.client.postgrest
    val especies = runCatching {
        client["especie"]
            .select(columns = Columns.list("id_especie", "id_genero"))
            .decodeList<EspecieGenero>()
    }
    if (especies.isFailure) {
        return MapasFiltroPlantas(
            familiaPorEspecieId = emptyMap(),
            errorResumen = especies.exceptionOrNull()?.message,
            avisoDatos = null
        )
    }
    val listaEspecies = especies.getOrThrow()
    val generos = runCatching {
        var last: Throwable? = null
        for (tabla in listOf("genero", "generos")) {
            val r = runCatching {
                client[tabla]
                    .select(columns = Columns.list("id_genero", "id_familia"))
                    .decodeList<GeneroFamilia>()
            }
            if (r.isSuccess) return@runCatching r.getOrThrow()
            last = r.exceptionOrNull()
        }
        throw last ?: IllegalStateException("genero")
    }
    val listaGeneros = if (generos.isSuccess) generos.getOrThrow() else emptyList()
    val famMap = if (generos.isSuccess) {
        familiaPorEspecieDesdeGenero(listaEspecies, listaGeneros)
    } else {
        emptyMap()
    }
    val err = when {
        generos.isFailure ->
            "especie OK; no se pudo leer género: " + (generos.exceptionOrNull()?.message ?: "")
        else -> null
    }
    val aviso = when {
        err != null -> null
        listaGeneros.isEmpty() ->
            "La tabla género está vacía o sin permisos RLS. Sin géneros con id_familia no se puede filtrar por familia."
        famMap.isEmpty() && listaEspecies.any { it.id_genero != null } ->
            "Hay especies con id_genero, pero ningún género enlaza id_familia."
        else -> null
    }
    return MapasFiltroPlantas(
        familiaPorEspecieId = famMap,
        errorResumen = err,
        avisoDatos = aviso
    )
}

@Serializable
data class EspecieDetalle(
    val id_especie: Int,
    val nombre_cientifico: String? = null,
    val autor_taxonomico: String? = null,
    val epiteto_especifico: String? = null,
    val descripcion_botanica: String? = null,
    val ciclo_vida: String? = null,
    val tipo_planta: String? = null,
    val estatus_conservacion: String? = null,
    val origen_geografico: String? = null,
    val es_endemica: Boolean? = null,
    val observaciones: String? = null,
    val id_genero: Int? = null
)

@Serializable
data class GeneroInfo(
    val id_genero: Int,
    val nombre_genero: String? = null,
    val id_familia: Int? = null
)

private val columnasEspecieDetalle = Columns.list(
    "id_especie",
    "nombre_cientifico",
    "autor_taxonomico",
    "epiteto_especifico",
    "descripcion_botanica",
    "ciclo_vida",
    "tipo_planta",
    "estatus_conservacion",
    "origen_geografico",
    "es_endemica",
    "observaciones",
    "id_genero"
)

suspend fun obtenerEspecieDetalle(idEspecie: Int): EspecieDetalle? {
    return runCatching {
        SupabaseClient.client.postgrest["especie"]
            .select(columns = columnasEspecieDetalle) {
                eq("id_especie", idEspecie)
            }
            .decodeList<EspecieDetalle>()
            .firstOrNull()
    }.getOrNull()
}

@Serializable
data class EspecieCatalogo(
    val id_especie: Int,
    val nombre_cientifico: String? = null,
    val epiteto_especifico: String? = null
)

fun EspecieCatalogo.etiquetaLista(): String {
    val cientifico = nombre_cientifico?.trim().orEmpty()
    if (cientifico.isNotEmpty()) return cientifico
    val epiteto = epiteto_especifico?.trim().orEmpty()
    if (epiteto.isNotEmpty()) return epiteto
    return "Especie #$id_especie"
}

suspend fun obtenerCatalogoEspecies(): List<EspecieCatalogo> {
    return runCatching {
        SupabaseClient.client.postgrest["especie"]
            .select(columns = Columns.list("id_especie", "nombre_cientifico", "epiteto_especifico"))
            .decodeList<EspecieCatalogo>()
            .sortedBy { it.etiquetaLista().lowercase() }
    }.getOrElse { emptyList() }
}

suspend fun obtenerGeneroInfo(idGenero: Int): GeneroInfo? {
    val client = SupabaseClient.client.postgrest
    val cols = Columns.list("id_genero", "nombre_genero", "id_familia")
    for (tabla in listOf("genero", "generos")) {
        val r = runCatching {
            client[tabla]
                .select(columns = cols) {
                    eq("id_genero", idGenero)
                }
                .decodeList<GeneroInfo>()
                .firstOrNull()
        }
        if (r.isSuccess && r.getOrNull() != null) return r.getOrNull()
    }
    return null
}
