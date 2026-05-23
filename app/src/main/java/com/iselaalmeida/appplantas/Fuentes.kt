package com.iselaalmeida.appplantas

import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.Serializable

/**
 * Bibliografía por especie:
 * - Tabla [fuente] = la obra (libro, artículo…)
 * - Tabla [detalle_fuente_especie] = qué dice esa obra sobre ESTA especie
 * La app agrupa por obra para no repetir la misma fuente muchas veces.
 */
@Serializable
data class Fuente(
    val id_fuente: Int,
    val tipo_fuente: String? = null,
    val titulo: String? = null,
    val autor: String? = null,
    val anio: Long? = null,
    val editorial_revista: String? = null,
    val doi: String? = null,
    val isbn: String? = null,
    val issn: String? = null,
    val url: String? = null,
    val institucion: String? = null,
    val pais: String? = null,
    val fecha_consulta: String? = null,
    val notas: String? = null
)

@Serializable
data class DetalleFuenteEspecie(
    val id_detalle_fuente_especie: Int,
    val id_especie: Int,
    val id_fuente: Int,
    val tipo_aporte: String? = null,
    val pagina_seccion: String? = null,
    val cita_textual_resumida: String? = null,
    val nivel_confiabilidad: String? = null,
    val observaciones: String? = null
)

/** Una obra bibliográfica y las citas/aportes que hace sobre la especie abierta. */
data class ObraBibliografica(
    val fuente: Fuente,
    val citas: List<DetalleFuenteEspecie>
)

/** Resultado listo para la UI: solo datos de una especie. */
data class BibliografiaPorEspecie(
    val idEspecie: Int,
    val obras: List<ObraBibliografica>
) {
    val totalObras: Int get() = obras.size
    val totalCitas: Int get() = obras.sumOf { it.citas.size }
}

fun Fuente.etiquetaPrincipal(): String {
    titulo?.trim()?.takeIf { it.isNotEmpty() }?.let { return it }
    return "Obra sin título"
}

fun Fuente.lineaBibliografia(): String {
    val partes = mutableListOf<String>()
    autor?.trim()?.takeIf { it.isNotEmpty() }?.let { partes.add(it) }
    anio?.let { partes.add("($it)") }
    editorial_revista?.trim()?.takeIf { it.isNotEmpty() }?.let { partes.add(it) }
    return partes.joinToString(" · ").ifEmpty { "" }
}

suspend fun obtenerBibliografiaPorEspecie(idEspecie: Int): BibliografiaPorEspecie {
    val client = SupabaseClient.client.postgrest
    val detalles = listarVinculosPorEspecie(
        tabla = "detalle_fuente_especie",
        idEspecie = idEspecie,
        leerIdEspecie = DetalleFuenteEspecie::id_especie
    )

    if (detalles.isEmpty()) {
        return BibliografiaPorEspecie(idEspecie, emptyList())
    }

    val detallesUnicos = detalles.distinctBy { it.id_detalle_fuente_especie }
    val porFuente = detallesUnicos.groupBy { it.id_fuente }
    val fuentesPorId = cargarFuentesPorIds(porFuente.keys.toList())

    val obras = porFuente.mapNotNull { (idFuente, citas) ->
        fuentesPorId[idFuente]?.let { fuente ->
            ObraBibliografica(
                fuente = fuente,
                citas = citas.sortedBy { it.id_detalle_fuente_especie }
            )
        }
    }.sortedBy { it.fuente.etiquetaPrincipal().lowercase() }

    return BibliografiaPorEspecie(idEspecie, obras)
}

private suspend fun cargarFuentesPorIds(ids: List<Int>): Map<Int, Fuente> {
    if (ids.isEmpty()) return emptyMap()
    val client = SupabaseClient.client.postgrest
    val mapa = mutableMapOf<Int, Fuente>()
    for (tabla in listOf("fuente", "fuentes")) {
        for (id in ids) {
            if (id in mapa) continue
            runCatching {
                client[tabla]
                    .select {
                        eq("id_fuente", id)
                    }
                    .decodeList<Fuente>()
                    .firstOrNull()
            }.getOrNull()?.let { mapa[id] = it }
        }
        if (mapa.isNotEmpty()) return mapa
    }
    return mapa
}
