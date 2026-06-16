"use client";

import type { ReactNode } from "react";
function limpiarTexto(texto: string): string {
  return texto
    .replace(/\[\d+(?:,\s*\d+)*\]/g, "")
    .replace(/\(ficha_completa\)/gi, "")
    .replace(/\(botanica\|nombre_comun\|uso\|propiedad\)/gi, "")
    .replace(/Especie #\d+\s*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderInline(texto: string): ReactNode[] {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((parte, i) => {
    if (parte.startsWith("**") && parte.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-forest">
          {parte.slice(2, -2)}
        </strong>
      );
    }
    return parte;
  });
}

function BloqueLista({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-[0.9rem] leading-relaxed text-earth">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-hero-green" />
          <span>{renderInline(item)}</span>
        </li>
      ))}
    </ul>
  );
}

function TarjetaPlanta({ titulo, cuerpo }: { titulo: string; cuerpo: string }) {
  const lineas = cuerpo.split("\n").filter((l) => l.trim());
  const bloques: { tipo: "texto" | "lista"; contenido: string | string[] }[] = [];
  let listaActual: string[] = [];

  for (const linea of lineas) {
    const t = linea.trim();
    if (t.startsWith("- ") || t.startsWith("• ")) {
      listaActual.push(t.replace(/^[-•]\s*/, ""));
    } else {
      if (listaActual.length) {
        bloques.push({ tipo: "lista", contenido: listaActual });
        listaActual = [];
      }
      if (t.startsWith("### ")) {
        bloques.push({ tipo: "texto", contenido: t.replace(/^###\s*/, "") });
      } else if (t) {
        bloques.push({ tipo: "texto", contenido: t });
      }
    }
  }
  if (listaActual.length) bloques.push({ tipo: "lista", contenido: listaActual });

  return (
    <article className="overflow-hidden rounded-xl border border-forest/10 bg-white shadow-sm">
      <header className="border-b border-forest/8 bg-gradient-to-r from-mint-light to-white px-4 py-3">
        <h3 className="flex items-center gap-2 font-semibold text-forest">
          <span aria-hidden>🌿</span>
          {renderInline(titulo.replace(/^#+\s*/, ""))}
        </h3>
      </header>
      <div className="space-y-2 px-4 py-3">
        {bloques.map((bloque, i) =>
          bloque.tipo === "lista" ? (
            <BloqueLista key={i} items={bloque.contenido as string[]} />
          ) : (
            <p key={i} className="text-[0.9rem] leading-relaxed text-earth">
              {renderInline(bloque.contenido as string)}
            </p>
          )
        )}
      </div>
    </article>
  );
}

function parsearMensaje(texto: string) {
  const limpio = limpiarTexto(texto);
  const secciones = limpio.split(/\n(?=##\s)/);

  if (secciones.length <= 1 && !limpio.startsWith("##")) {
    const lineas = limpio.split("\n");
    const items: string[] = [];
    const parrafos: string[] = [];

    for (const linea of lineas) {
      const t = linea.trim();
      if (t.startsWith("- ") || t.startsWith("• ")) {
        items.push(t.replace(/^[-•]\s*/, ""));
      } else if (t) {
        parrafos.push(t);
      }
    }

    return (
      <div className="space-y-2">
        {parrafos.map((p, i) => (
          <p key={i} className="leading-relaxed">
            {renderInline(p)}
          </p>
        ))}
        {items.length > 0 && <BloqueLista items={items} />}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {secciones.map((seccion, i) => {
        const match = seccion.match(/^##\s*(.+?)(?:\n([\s\S]*))?$/);
        if (match) {
          return (
            <TarjetaPlanta key={i} titulo={match[1].trim()} cuerpo={match[2]?.trim() ?? ""} />
          );
        }
        if (seccion.trim()) {
          return (
            <p key={i} className="leading-relaxed">
              {renderInline(seccion.trim())}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}

export function AssistantMessage({ texto }: { texto: string }) {
  if (!texto.trim()) return null;
  return <div className="min-w-[260px] max-w-full">{parsearMensaje(texto)}</div>;
}
