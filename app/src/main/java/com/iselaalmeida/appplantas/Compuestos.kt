package com.iselaalmeida.appplantas

import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.Serializable

/** Catálogo general (compartido entre especies). */
@Serializable
data class CompuestoActivo(
    val id_compuesto: Int,
    val nombre_compuesto: String,
    val tipo_compuesto: String? = null,
    val descripcion: String? = null,
    val formula_quimica: String? = null
)

/** Qué se reporta en ESTA planta (parte, concentración, notas). */
@Serializable
data class EspecieCompuesto(
    val id_especie_compuesto: Int,
    val id_especie: Int,
    val id_compuesto: Int,
    val parte_planta: String? = null,
    val concentracion_reportada: String? = null,
    val observaciones: String? = null
)

/** Un registro de la tabla puente + datos del catálogo (si existen). */
data class RegistroCompuestoPlanta(
    val vinculo: EspecieCompuesto,
    val catalogo: CompuestoActivo?
) {
    fun tituloCompuesto(): String =
        catalogo?.nombre_compuesto?.trim()?.takeIf { it.isNotEmpty() }
            ?: "Compuesto #${vinculo.id_compuesto}"
}

/** Agrupa varios reportes del mismo compuesto sin repetir el catálogo. */
data class GrupoCompuestoEnPlanta(
    val idCompuesto: Int,
    val titulo: String,
    val catalogo: CompuestoActivo?,
    val reportes: List<RegistroCompuestoPlanta>
)

data class CompuestosPorEspecie(
    val idEspecie: Int,
    val grupos: List<GrupoCompuestoEnPlanta>
) {
    val totalReportes: Int get() = grupos.sumOf { it.reportes.size }
}

fun CompuestoActivo.tieneFichaQuimica(): Boolean =
    listOf(tipo_compuesto, descripcion, formula_quimica).any { !it.isNullOrBlank() }

fun CompuestoActivo.etiquetaPrincipal(): String =
    nombre_compuesto.trim().ifEmpty { "Compuesto sin nombre" }

private fun EspecieCompuesto.claveContenido(): String =
    listOf(
        parte_planta?.trim().orEmpty(),
        concentracion_reportada?.trim().orEmpty(),
        observaciones?.trim().orEmpty()
    ).joinToString("|")

suspend fun obtenerCompuestosPorEspecie(idEspecie: Int): CompuestosPorEspecie {
    val client = SupabaseClient.client.postgrest
    val vinculos = listarVinculosPorEspecie(
        tabla = "especie_compuesto",
        idEspecie = idEspecie,
        leerIdEspecie = EspecieCompuesto::id_especie
    )

    if (vinculos.isEmpty()) {
        return CompuestosPorEspecie(idEspecie, emptyList())
    }

    val vinculosUnicos = vinculos
        .distinctBy { it.id_especie_compuesto }
        .distinctBy { "${it.id_compuesto}|${it.claveContenido()}" }
        .sortedBy { it.id_especie_compuesto }

    val catalogoPorId = cargarCompuestosPorIds(vinculosUnicos.map { it.id_compuesto }.distinct())

    val registros = vinculosUnicos.map { v ->
        RegistroCompuestoPlanta(
            vinculo = v,
            catalogo = catalogoPorId[v.id_compuesto]
        )
    }

    val grupos = registros
        .groupBy { it.vinculo.id_compuesto }
        .map { (idCompuesto, filas) ->
            val cat = catalogoPorId[idCompuesto]
            GrupoCompuestoEnPlanta(
                idCompuesto = idCompuesto,
                titulo = filas.first().tituloCompuesto(),
                catalogo = cat,
                reportes = filas.sortedBy { it.vinculo.id_especie_compuesto }
            )
        }
        .sortedBy { it.titulo.lowercase() }

    return CompuestosPorEspecie(idEspecie, grupos)
}

private suspend fun cargarCompuestosPorIds(ids: List<Int>): Map<Int, CompuestoActivo> {
    if (ids.isEmpty()) return emptyMap()
    val client = SupabaseClient.client.postgrest
    val mapa = mutableMapOf<Int, CompuestoActivo>()
    for (id in ids.distinct()) {
        if (id in mapa) continue
        runCatching {
            client["compuesto_activo"]
                .select {
                    eq("id_compuesto", id)
                }
                .decodeList<CompuestoActivo>()
                .firstOrNull()
        }.getOrNull()?.let { mapa[id] = it }
    }
    return mapa
}
