package com.iselaalmeida.appplantas

import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.Serializable

/** Catálogo de categorías de uso. */
@Serializable
data class CategoriaUso(
    val id_categoria_uso: Int,
    val nombre_categoria: String,
    val descripcion: String? = null
)

/** Uso reportado para una especie (tabla uso_planta). */
@Serializable
data class UsoPlanta(
    val id_uso: Int,
    val id_especie: Int,
    val id_categoria_uso: Int? = null,
    val descripcion_uso: String? = null,
    val parte_utilizada: String? = null,
    val forma_preparacion: String? = null,
    val via_administracion: String? = null,
    val frecuencia_uso: String? = null,
    val riesgos_contraindicaciones: String? = null
)

data class GrupoUsoEnPlanta(
    val idCategoria: Int,
    val titulo: String,
    val categoria: CategoriaUso?,
    val usos: List<UsoPlanta>
)

data class UsosPorEspecie(
    val idEspecie: Int,
    val grupos: List<GrupoUsoEnPlanta>
) {
    val totalUsos: Int get() = grupos.sumOf { it.usos.size }
}

fun CategoriaUso.tieneFichaCatalogo(): Boolean =
    !descripcion.isNullOrBlank()

private fun UsoPlanta.claveContenido(): String =
    listOf(
        descripcion_uso?.trim().orEmpty(),
        parte_utilizada?.trim().orEmpty(),
        forma_preparacion?.trim().orEmpty(),
        via_administracion?.trim().orEmpty(),
        frecuencia_uso?.trim().orEmpty(),
        riesgos_contraindicaciones?.trim().orEmpty()
    ).joinToString("|")

suspend fun obtenerUsosPorEspecie(idEspecie: Int): UsosPorEspecie {
    val filas = listarVinculosPorEspecie(
        tabla = "uso_planta",
        idEspecie = idEspecie,
        leerIdEspecie = UsoPlanta::id_especie
    )

    if (filas.isEmpty()) {
        return UsosPorEspecie(idEspecie, emptyList())
    }

    val usosUnicos = filas
        .distinctBy { it.id_uso }
        .distinctBy { "${it.id_categoria_uso}|${it.claveContenido()}" }
        .sortedBy { it.id_uso }

    val catalogoPorId = cargarCategoriasPorIds(
        usosUnicos.mapNotNull { it.id_categoria_uso }.distinct()
    )

    val grupos = usosUnicos
        .groupBy { it.id_categoria_uso ?: -it.id_uso }
        .map { (clave, lista) ->
            val idCat = lista.first().id_categoria_uso
            val cat = idCat?.let { catalogoPorId[it] }
            GrupoUsoEnPlanta(
                idCategoria = idCat ?: -lista.first().id_uso,
                titulo = cat?.nombre_categoria?.trim()?.takeIf { it.isNotEmpty() }
                    ?: lista.first().descripcion_uso?.trim()?.takeIf { it.isNotEmpty() }
                    ?: "Uso #${lista.first().id_uso}",
                categoria = cat,
                usos = lista.sortedBy { it.id_uso }
            )
        }
        .sortedBy { it.titulo.lowercase() }

    return UsosPorEspecie(idEspecie, grupos)
}

private suspend fun cargarCategoriasPorIds(ids: List<Int>): Map<Int, CategoriaUso> {
    if (ids.isEmpty()) return emptyMap()
    val client = SupabaseClient.client.postgrest
    val mapa = mutableMapOf<Int, CategoriaUso>()
    for (id in ids.distinct()) {
        if (id in mapa) continue
        runCatching {
            client["categoria_uso"]
                .select {
                    eq("id_categoria_uso", id)
                }
                .decodeList<CategoriaUso>()
                .firstOrNull()
        }.getOrNull()?.let { mapa[id] = it }
    }
    return mapa
}
