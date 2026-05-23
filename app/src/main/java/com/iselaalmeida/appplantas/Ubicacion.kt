package com.iselaalmeida.appplantas

import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.Serializable

/** Catálogo de ubicaciones (compartido entre especies). */
@Serializable
data class UbicacionGeografica(
    val id_ubicacion: Int,
    val pais: String? = null,
    val estado: String? = null,
    val municipio: String? = null,
    val localidad: String? = null,
    val latitud: String? = null,
    val longitud: String? = null,
    val region_biogeografica: String? = null
)

/** Qué se reporta de ubicación en ESTA planta. */
@Serializable
data class EspecieUbicacion(
    val id_especie_ubicacion: Int,
    val id_especie: Int,
    val id_ubicacion: Int,
    val es_nativa: Boolean? = null,
    val es_cultivada: Boolean? = null,
    val abundancia: String? = null,
    val observaciones: String? = null
)

data class RegistroUbicacionPlanta(
    val vinculo: EspecieUbicacion,
    val catalogo: UbicacionGeografica?
) {
    fun tituloUbicacion(): String =
        catalogo?.etiquetaLugar() ?: "Ubicación #${vinculo.id_ubicacion}"
}

data class GrupoUbicacionEnPlanta(
    val idUbicacion: Int,
    val titulo: String,
    val catalogo: UbicacionGeografica?,
    val reportes: List<RegistroUbicacionPlanta>
)

data class UbicacionesPorEspecie(
    val idEspecie: Int,
    val grupos: List<GrupoUbicacionEnPlanta>
) {
    val totalReportes: Int get() = grupos.sumOf { it.reportes.size }
}

fun UbicacionGeografica.etiquetaLugar(): String {
    val partes = listOf(pais, estado, municipio, localidad)
        .mapNotNull { it?.trim()?.takeIf { s -> s.isNotEmpty() } }
    return partes.joinToString(" · ").ifEmpty { "Ubicación sin nombre" }
}

fun UbicacionGeografica.tieneFichaCatalogo(): Boolean =
    listOf(latitud, longitud, region_biogeografica).any { !it.isNullOrBlank() }

private fun EspecieUbicacion.claveContenido(): String =
    listOf(
        es_nativa?.toString().orEmpty(),
        es_cultivada?.toString().orEmpty(),
        abundancia?.trim().orEmpty(),
        observaciones?.trim().orEmpty()
    ).joinToString("|")

suspend fun obtenerUbicacionesPorEspecie(idEspecie: Int): UbicacionesPorEspecie {
    val vinculos = listarVinculosPorEspecie(
        tabla = "especie_ubicacion",
        idEspecie = idEspecie,
        leerIdEspecie = EspecieUbicacion::id_especie
    )

    if (vinculos.isEmpty()) {
        return UbicacionesPorEspecie(idEspecie, emptyList())
    }

    val vinculosUnicos = vinculos
        .distinctBy { it.id_especie_ubicacion }
        .distinctBy { "${it.id_ubicacion}|${it.claveContenido()}" }
        .sortedBy { it.id_especie_ubicacion }

    val catalogoPorId = cargarUbicacionesPorIds(vinculosUnicos.map { it.id_ubicacion }.distinct())

    val registros = vinculosUnicos.map { v ->
        RegistroUbicacionPlanta(
            vinculo = v,
            catalogo = catalogoPorId[v.id_ubicacion]
        )
    }

    val grupos = registros
        .groupBy { it.vinculo.id_ubicacion }
        .map { (idUbicacion, filas) ->
            GrupoUbicacionEnPlanta(
                idUbicacion = idUbicacion,
                titulo = filas.first().tituloUbicacion(),
                catalogo = catalogoPorId[idUbicacion],
                reportes = filas.sortedBy { it.vinculo.id_especie_ubicacion }
            )
        }
        .sortedBy { it.titulo.lowercase() }

    return UbicacionesPorEspecie(idEspecie, grupos)
}

private suspend fun cargarUbicacionesPorIds(ids: List<Int>): Map<Int, UbicacionGeografica> {
    if (ids.isEmpty()) return emptyMap()
    val client = SupabaseClient.client.postgrest
    val mapa = mutableMapOf<Int, UbicacionGeografica>()
    for (id in ids.distinct()) {
        if (id in mapa) continue
        runCatching {
            client["ubicacion_geografica"]
                .select {
                    eq("id_ubicacion", id)
                }
                .decodeList<UbicacionGeografica>()
                .firstOrNull()
        }.getOrNull()?.let { mapa[id] = it }
    }
    return mapa
}
