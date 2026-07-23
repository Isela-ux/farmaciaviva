"use client";

import { useState } from "react";

const TIPOS = [
  { value: "mejora", label: "Sugerencia de mejora" },
  { value: "bug", label: "Error o falla" },
  { value: "duda", label: "Duda o consulta" },
  { value: "otro", label: "Otro" },
] as const;

type EstadoEnvio = "idle" | "enviando" | "ok" | "error";

export function FormularioComentarios({ pagina = "/catalogo" }: { pagina?: string }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]["value"]>("mejora");
  const [comentario, setComentario] = useState("");
  const [estado, setEstado] = useState<EstadoEnvio>("idle");
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (estado === "enviando") return;

    const texto = comentario.trim();
    if (texto.length < 10) {
      setEstado("error");
      setMensaje("Escribe al menos 10 caracteres para que podamos entender tu comentario.");
      return;
    }

    setEstado("enviando");
    setMensaje(null);

    try {
      const res = await fetch("/api/comentarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim() || undefined,
          correo: correo.trim() || undefined,
          tipo,
          comentario: texto,
          pagina,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; mensaje?: string; error?: string };

      if (!res.ok) {
        setEstado("error");
        setMensaje(data.error ?? "No se pudo enviar. Intenta de nuevo.");
        return;
      }

      setEstado("ok");
      setMensaje(data.mensaje ?? "Gracias. Recibimos tu comentario.");
      setNombre("");
      setCorreo("");
      setTipo("mejora");
      setComentario("");
    } catch {
      setEstado("error");
      setMensaje("Error de red. Revisa tu conexión e intenta de nuevo.");
    }
  }

  return (
    <section
      aria-labelledby="titulo-comentarios"
      className="rounded-2xl border border-forest/10 bg-gradient-to-br from-card-white via-cream/40 to-mint-light/20 p-6 shadow-sm sm:p-8"
    >
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-hero-green">
          Fase de prueba · VIC 2026
        </p>
        <h2 id="titulo-comentarios" className="mt-1 text-xl font-bold text-forest sm:text-2xl">
          Enviar comentarios
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-earth-soft">
          ¿Encontraste un error, tienes una idea o una duda? Cuéntanoslo. Tu feedback nos ayuda a
          mejorar Farmacia Viva durante las pruebas.
        </p>
      </div>

      {estado === "ok" ? (
        <div
          role="status"
          className="mt-6 rounded-xl border border-hero-green/30 bg-white/90 px-4 py-4 text-sm text-forest"
        >
          <p className="font-semibold">{mensaje}</p>
          <button
            type="button"
            onClick={() => {
              setEstado("idle");
              setMensaje(null);
            }}
            className="mt-3 text-sm font-medium text-hero-green outline-none hover:underline focus-visible:ring-2 focus-visible:ring-sun-gold/50"
          >
            Enviar otro comentario
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => void enviar(e)} className="mt-6 grid max-w-2xl gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="comentario-nombre" className="mb-1.5 block text-xs font-medium text-forest">
                Nombre <span className="font-normal text-earth-soft">(opcional)</span>
              </label>
              <input
                id="comentario-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={80}
                autoComplete="name"
                className="w-full rounded-xl border border-forest/15 bg-white px-4 py-2.5 text-sm text-forest outline-none ring-hero-green/30 focus-visible:ring-2"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label htmlFor="comentario-correo" className="mb-1.5 block text-xs font-medium text-forest">
                Correo <span className="font-normal text-earth-soft">(opcional)</span>
              </label>
              <input
                id="comentario-correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                maxLength={120}
                autoComplete="email"
                className="w-full rounded-xl border border-forest/15 bg-white px-4 py-2.5 text-sm text-forest outline-none ring-hero-green/30 focus-visible:ring-2"
                placeholder="para responderte si hace falta"
              />
            </div>
          </div>

          <div>
            <label htmlFor="comentario-tipo" className="mb-1.5 block text-xs font-medium text-forest">
              Tipo de comentario
            </label>
            <select
              id="comentario-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as (typeof TIPOS)[number]["value"])}
              className="w-full rounded-xl border border-forest/15 bg-white px-4 py-2.5 text-sm text-forest outline-none ring-hero-green/30 focus-visible:ring-2"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="comentario-texto" className="mb-1.5 block text-xs font-medium text-forest">
              Comentario <span className="text-accent-coral">*</span>
            </label>
            <textarea
              id="comentario-texto"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              required
              minLength={10}
              maxLength={2000}
              rows={4}
              className="w-full resize-y rounded-xl border border-forest/15 bg-white px-4 py-2.5 text-sm text-forest outline-none ring-hero-green/30 focus-visible:ring-2"
              placeholder="Describe el error, la mejora o tu duda con el mayor detalle posible…"
            />
            <p className="mt-1 text-xs text-earth-soft">{comentario.trim().length}/2000</p>
          </div>

          {estado === "error" && mensaje && (
            <p role="alert" className="rounded-lg border border-accent-coral/30 bg-accent-coral/5 px-3 py-2 text-sm text-forest">
              {mensaje}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={estado === "enviando"}
              className="rounded-full bg-forest px-6 py-2.5 text-sm font-semibold text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-sun-gold/50 disabled:opacity-60"
            >
              {estado === "enviando" ? "Enviando…" : "Enviar comentario"}
            </button>
            <p className="text-xs text-earth-soft">
              Solo el equipo de Farmacia Viva puede leer estos mensajes.
            </p>
          </div>
        </form>
      )}
    </section>
  );
}
