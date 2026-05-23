package com.iselaalmeida.appplantas

import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.Serializable

/** Catálogo de tipos de hábitat (compartido entre especies). */
@Serializable
data class Habitat(
    val id_habitat: Int,
    val nombre_habitat: String,
    val descripcion: String? = null,
    val clima: String? = null,
    val tipo_suelo: String? = null,
    val altitud_min: Long? = null,
    val altitud_max: Long? = null
)

/** Qué se reporta de hábitat en ESTA planta. */
@Serializable
data class EspecieHabitat(
    val id_especie_habitat: Int,
    val id_especie: Int,
    val id_habitat: Int,
    val frecuencia_presencia: String? = null,
    val observaciones: String? = null
)

data class RegistroHabitatPlanta(
    val vinculo: EspecieHabitat,
    val catalogo: Habitat?
) {
    fun tituloHabitat(): String =
        catalogo?.nombre_habitat?.trim()?.takeIf { it.isNotEmpty() }
            ?: "Hábitat #${vinculo.id_habitat}"
}

data class GrupoHabitatEnPlanta(
    val idHabitat: Int,
    val titulo: String,
    val catalogo: Habitat?,
    val reportes: List<RegistroHabitatPlanta>
)

data class HabitatsPorEspecie(
    val idEspecie: Int,
    val grupos: List<GrupoHabitatEnPlanta>
) {
    val totalReportes: Int get() = grupos.sumOf { it.reportes.size }
}

fun Habitat.tieneFichaCatalogo(): Boolean =
    listOf(descripcion, clima, tipo_suelo, altitud_min, altitud_max).any { it != null && it.toString().isNotBlank() }

fun Habitat.lineaAltitud(): String? = when {
    altitud_min != null && altitud_max != null ->
        "${altitud_min}–${altitud_max} m s. n. m."
    altitud_min != null -> "Desde ${altitud_min} m s. n. m."
    altitud_max != null -> "Hasta ${altitud_max} m s. n. m."
    else -> null
}

private fun EspecieHabitat.claveContenido(): String =
    listOf(
        frecuencia_presencia?.trim().orEmpty(),
        observaciones?.trim().orEmpty()
    ).joinToString("|")

suspend fun obtenerHabitatsPorEspecie(idEspecie: Int): HabitatsPorEspecie {
    val client = SupabaseClient.client.postgrest
    val vinculos = listarVinculosPorEspecie(
        tabla = "especie_habitat",
        idEspecie = idEspecie,
        leerIdEspecie = EspecieHabitat::id_especie
    )

    if (vinculos.isEmpty()) {
        return HabitatsPorEspecie(idEspecie, emptyList())
    }

    val vinculosUnicos = vinculos
        .distinctBy { it.id_especie_habitat }
        .distinctBy { "${it.id_habitat}|${it.claveContenido()}" }
        .sortedBy { it.id_especie_habitat }

    val catalogoPorId = cargarHabitatsPorIds(vinculosUnicos.map { it.id_habitat }.distinct())

    val registros = vinculosUnicos.map { v ->
        RegistroHabitatPlanta(
            vinculo = v,
            catalogo = catalogoPorId[v.id_habitat]
        )
    }

    val grupos = registros
        .groupBy { it.vinculo.id_habitat }
        .map { (idHabitat, filas) ->
            GrupoHabitatEnPlanta(
                idHabitat = idHabitat,
                titulo = filas.first().tituloHabitat(),
                catalogo = catalogoPorId[idHabitat],
                reportes = filas.sortedBy { it.vinculo.id_especie_habitat }
            )
        }
        .sortedBy { it.titulo.lowercase() }

    return HabitatsPorEspecie(idEspecie, grupos)
}

private suspend fun cargarHabitatsPorIds(ids: List<Int>): Map<Int, Habitat> {
    if (ids.isEmpty()) return emptyMap()
    val client = SupabaseClient.client.postgrest
    val mapa = mutableMapOf<Int, Habitat>()
    for (id in ids.distinct()) {
        if (id in mapa) continue
        runCatching {
            client["habitat"]
                .select {
                    eq("id_habitat", id)
                }
                .decodeList<Habitat>()
                .firstOrNull()
        }.getOrNull()?.let { mapa[id] = it }
    }
    return mapa
}
