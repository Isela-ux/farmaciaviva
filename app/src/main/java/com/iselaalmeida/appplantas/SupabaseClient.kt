package com.iselaalmeida.appplantas

import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import kotlin.time.Duration.Companion.seconds

object SupabaseClient {
    val client by lazy {
        createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL.trim(),
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY.trim()
        ) {
            requestTimeout = 120.seconds
            install(Postgrest)
        }
    }
}
