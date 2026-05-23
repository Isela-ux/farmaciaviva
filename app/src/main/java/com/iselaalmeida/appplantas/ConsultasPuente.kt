package com.iselaalmeida.appplantas

import io.github.jan.supabase.postgrest.postgrest

/**
 * Filas de tablas puente (especie_*) solo para la especie indicada.
 * Filtro en servidor + filtro en cliente para evitar mezclar plantas.
 */
internal suspend inline fun <reified T : Any> listarVinculosPorEspecie(
    tabla: String,
    idEspecie: Int,
    noinline leerIdEspecie: (T) -> Int
): List<T> {
    val filas = SupabaseClient.client.postgrest[tabla]
        .select {
            eq("id_especie", idEspecie)
        }
        .decodeList<T>()
    return filas.filter { leerIdEspecie(it) == idEspecie }
}

/** Solo aplica el resultado si la ficha abierta sigue siendo la misma especie. */
internal fun <T> T.aplicarSiEspecieActiva(especieSolicitada: Int, idEspecieActual: Int): T? =
    if (especieSolicitada == idEspecieActual) this else null
