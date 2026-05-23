package com.iselaalmeida.appplantas

import android.content.Context

/**
 * Favoritos guardados en el teléfono (id de nombre_comun).
 * No requiere cuenta ni Supabase.
 */
object FavoritosStore {
    private const val PREFS = "farmacia_viva_favoritos"
    private const val KEY_IDS = "ids_nombre_comun"

    fun obtenerIds(context: Context): Set<Int> {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val raw = prefs.getStringSet(KEY_IDS, emptySet()).orEmpty()
        return raw.mapNotNull { it.toIntOrNull() }.toSet()
    }

    fun esFavorito(context: Context, idNombreComun: Int): Boolean =
        idNombreComun in obtenerIds(context)

    /** Devuelve el conjunto actualizado tras alternar. */
    fun alternar(context: Context, idNombreComun: Int): Set<Int> {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val actual = obtenerIds(context).toMutableSet()
        if (idNombreComun in actual) actual.remove(idNombreComun)
        else actual.add(idNombreComun)
        prefs.edit()
            .putStringSet(KEY_IDS, actual.map { it.toString() }.toSet())
            .apply()
        return actual
    }
}
