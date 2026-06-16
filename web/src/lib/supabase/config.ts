export type SupabaseConfigError =
  | { tipo: "faltan_variables"; faltan: string[] }
  | { tipo: "url_invalida"; url: string }
  | { tipo: "conexion"; mensaje: string }
  | null;

export function validarConfigSupabase(): SupabaseConfigError {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const faltan: string[] = [];

  if (!url) faltan.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!key) faltan.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (faltan.length > 0) {
    return { tipo: "faltan_variables", faltan };
  }

  try {
    const parsed = new URL(url!);
    if (!parsed.hostname.endsWith(".supabase.co")) {
      return { tipo: "url_invalida", url: url! };
    }
  } catch {
    return { tipo: "url_invalida", url: url! };
  }

  return null;
}

export function mensajeErrorSupabase(
  config: SupabaseConfigError,
  error?: unknown
): string {
  if (config?.tipo === "faltan_variables") {
    return `Faltan variables en web/.env.local: ${config.faltan.join(", ")}. Copia web/.env.local.example y completa las credenciales.`;
  }

  if (config?.tipo === "url_invalida") {
    return `La URL de Supabase no es válida: "${config.url}". Debe ser como https://TU-PROYECTO.supabase.co`;
  }

  const msg = error instanceof Error ? error.message : String(error ?? "");

  if (msg.includes("ENOTFOUND") || msg.includes("fetch failed")) {
    return (
      "No se encontró el proyecto de Supabase. La URL en .env.local no existe o el proyecto fue pausado/eliminado. " +
      "Ve a supabase.com/dashboard → tu proyecto → Settings → API y copia de nuevo la Project URL y la anon key."
    );
  }

  if (msg.includes("Invalid API key") || msg.includes("JWT")) {
    return "La anon key de Supabase no es válida. Cópiala de nuevo desde Settings → API en el dashboard.";
  }

  return msg || "Error desconocido al conectar con Supabase.";
}
