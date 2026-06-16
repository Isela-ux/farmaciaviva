import { mensajeErrorSupabase, validarConfigSupabase } from "@/lib/supabase/config";

export function SupabaseErrorBanner({ error }: { error: unknown }) {
  const config = validarConfigSupabase();
  const mensaje = mensajeErrorSupabase(config, error);

  return (
    <div className="rounded-2xl border border-accent-coral/30 bg-accent-coral/10 p-6 text-sm text-accent-coral">
      <p className="font-semibold">No se pudo conectar con Supabase</p>
      <p className="mt-2">{mensaje}</p>
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-earth">
        <li>
          Abre{" "}
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            supabase.com/dashboard
          </a>
        </li>
        <li>Selecciona tu proyecto (o créalo si no existe)</li>
        <li>
          Ve a <strong>Settings → API</strong>
        </li>
        <li>
          Copia <strong>Project URL</strong> y <strong>anon public</strong> key a{" "}
          <code className="rounded bg-white/60 px-1">web/.env.local</code>
        </li>
        <li>Reinicia el servidor: <code className="rounded bg-white/60 px-1">npm run dev</code></li>
      </ol>
    </div>
  );
}
