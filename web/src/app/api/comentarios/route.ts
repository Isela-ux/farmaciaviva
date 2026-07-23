import { createClient } from "@/lib/supabase/server";

export const maxDuration = 15;

const TIPOS = new Set(["bug", "mejora", "duda", "otro"]);

type BodyComentario = {
  nombre?: string;
  correo?: string;
  tipo?: string;
  comentario?: string;
  pagina?: string;
};

function limpiar(texto: unknown, max: number): string {
  if (typeof texto !== "string") return "";
  return texto.trim().slice(0, max);
}

export async function POST(req: Request) {
  let body: BodyComentario;
  try {
    body = (await req.json()) as BodyComentario;
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const nombre = limpiar(body.nombre, 80) || null;
  const correo = limpiar(body.correo, 120) || null;
  const tipo = limpiar(body.tipo, 20).toLowerCase();
  const comentario = limpiar(body.comentario, 2000);
  const pagina = limpiar(body.pagina, 80) || "/catalogo";

  if (!TIPOS.has(tipo)) {
    return Response.json(
      { error: "Tipo de comentario no válido. Usa: bug, mejora, duda u otro." },
      { status: 400 }
    );
  }

  if (comentario.length < 10) {
    return Response.json(
      { error: "El comentario debe tener al menos 10 caracteres." },
      { status: 400 }
    );
  }

  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return Response.json({ error: "El correo no tiene un formato válido." }, { status: 400 });
  }

  const userAgent = req.headers.get("user-agent")?.slice(0, 300) ?? null;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("comentarios_prueba").insert({
      nombre,
      correo,
      tipo,
      comentario,
      pagina,
      user_agent: userAgent,
    });

    if (error) {
      console.error("[api/comentarios]", error.message);
      const mensaje =
        error.message.includes("comentarios_prueba") || error.code === "42P01"
          ? "La tabla de comentarios aún no está configurada en Supabase. Ejecuta la migración 002_comentarios_prueba.sql."
          : "No se pudo guardar el comentario. Intenta de nuevo en unos segundos.";
      return Response.json({ error: mensaje }, { status: 503 });
    }

    return Response.json({ ok: true, mensaje: "Comentario recibido. Gracias por ayudarnos a mejorar." });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    console.error("[api/comentarios]", msg);
    return Response.json(
      { error: "No se pudo conectar con la base de datos. Verifica Supabase." },
      { status: 503 }
    );
  }
}
