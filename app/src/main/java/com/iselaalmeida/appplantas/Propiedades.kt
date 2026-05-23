package com.iselaalmeida.appplantas

import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.Serializable

/** Catálogo de propiedades (compartido entre especies). */
@Serializable
data class Propiedad(
    val id_propiedad: Int,
    val nombre_propiedad: String,
    val descripcion: String? = null
)

/** Qué se reporta de propiedades en ESTA planta. */
@Serializable
data class EspeciePropiedad(
    val id_especie_propiedad: Int,
    val id_especie: Int,
    val id_propiedad: Int,
    val nivel_evidencia: String? = null,
    val observaciones: String? = null
)

data class RegistroPropiedadPlanta(
    val vinculo: EspeciePropiedad,
    val catalogo: Propiedad?
) {
    fun tituloPropiedad(): String =
        catalogo?.nombre_propiedad?.trim()?.takeIf { it.isNotEmpty() }
            ?: "Propiedad #${vinculo.id_propiedad}"
}

data class GrupoPropiedadEnPlanta(
    val idPropiedad: Int,
    val titulo: String,
    val catalogo: Propiedad?,
    val reportes: List<RegistroPropiedadPlanta>
)

data class PropiedadesPorEspecie(
    val idEspecie: Int,
    val grupos: List<GrupoPropiedadEnPlanta>
) {
    val totalReportes: Int get() = grupos.sumOf { it.reportes.size }
}

fun Propiedad.tieneFichaCatalogo(): Boolean =
    !descripcion.isNullOrBlank()

private fun EspeciePropiedad.claveContenido(): String =
    listOf(
        nivel_evidencia?.trim().orEmpty(),
        observaciones?.trim().orEmpty()
    ).joinToString("|")

suspend fun obtenerPropiedadesPorEspecie(idEspecie: Int): PropiedadesPorEspecie {
    val client = SupabaseClient.client.postgrest
    val vinculos = listarVinculosPorEspecie(
        tabla = "especie_propiedad",
        idEspecie = idEspecie,
        leerIdEspecie = EspeciePropiedad::id_especie
    )

    if (vinculos.isEmpty()) {
        return PropiedadesPorEspecie(idEspecie, emptyList())
    }

    val vinculosUnicos = vinculos
        .distinctBy { it.id_especie_propiedad }
        .distinctBy { "${it.id_propiedad}|${it.claveContenido()}" }
        .sortedBy { it.id_especie_propiedad }

    val catalogoPorId = cargarPropiedadesPorIds(vinculosUnicos.map { it.id_propiedad }.distinct())

    val registros = vinculosUnicos.map { v ->
        RegistroPropiedadPlanta(
            vinculo = v,
            catalogo = catalogoPorId[v.id_propiedad]
        )
    }

    val grupos = registros
        .groupBy { it.vinculo.id_propiedad }
        .map { (idPropiedad, filas) ->
            GrupoPropiedadEnPlanta(
                idPropiedad = idPropiedad,
                titulo = filas.first().tituloPropiedad(),
                catalogo = catalogoPorId[idPropiedad],
                reportes = filas.sortedBy { it.vinculo.id_especie_propiedad }
            )
        }
        .sortedBy { it.titulo.lowercase() }

    return PropiedadesPorEspecie(idEspecie, grupos)
}

private suspend fun cargarPropiedadesPorIds(ids: List<Int>): Map<Int, Propiedad> {
    if (ids.isEmpty()) return emptyMap()
    val client = SupabaseClient.client.postgrest
    val mapa = mutableMapOf<Int, Propiedad>()
    for (id in ids.distinct()) {
        if (id in mapa) continue
        runCatching {
            client["propiedad"]
                .select {
                    eq("id_propiedad", id)
                }
                .decodeList<Propiedad>()
                .firstOrNull()
        }.getOrNull()?.let { mapa[id] = it }
    }
    return mapa
}
