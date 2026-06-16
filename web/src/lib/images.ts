import type { ImagenEspecie, NombreComun } from "@/types/database";

export function normalizarUrlImagen(raw: string): string {
  let url = raw.trim();
  if (!url) return url;

  const fixes = ["httphttps://", "https://https://", "hhttps://", "http://http://"];
  for (const mal of fixes) {
    while (url.includes(mal)) {
      url = url.replace(mal, "https://");
    }
  }
  if (url.startsWith("//")) url = `https:${url}`;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url;
}

function hostProyectoActivo(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  if (!raw) return null;
  try {
    return new URL(raw).host.toLowerCase();
  } catch {
    return null;
  }
}

export function urlImagenDelProyectoActivo(url: string): boolean {
  const hostActivo = hostProyectoActivo();
  if (!hostActivo) return true;
  try {
    return new URL(normalizarUrlImagen(url)).host.toLowerCase() === hostActivo;
  } catch {
    return false;
  }
}

export function imagenVisibleEnApp(img: ImagenEspecie): boolean {
  if (img.mostrar_en_app === false) return false;
  return urlImagenDelProyectoActivo(img.url_imagen);
}

export function ordenarImagenes(imagenes: ImagenEspecie[]): ImagenEspecie[] {
  return imagenes
    .filter(imagenVisibleEnApp)
    .map((img) => ({ ...img, url_imagen: normalizarUrlImagen(img.url_imagen) }))
    .filter((img) => img.url_imagen.length > 0)
    .sort((a, b) => {
      if (a.es_principal !== b.es_principal) return a.es_principal ? -1 : 1;
      return a.id_imagen - b.id_imagen;
    });
}

export function urlImagenParaLista(
  nombreComun: NombreComun,
  imagenes: ImagenEspecie[],
  cantidadNombresPorEspecie: Map<number, number>
): string | null {
  const deEspecie = imagenes.filter((i) => i.id_especie === nombreComun.id_especie);
  const dedicada = deEspecie.filter((i) => i.id_nombre_comun === nombreComun.id_nombre_comun);

  if (dedicada.length > 0) {
    return ordenarImagenes(dedicada)[0]?.url_imagen ?? null;
  }
  if (deEspecie.some((i) => i.id_nombre_comun != null)) return null;
  if ((cantidadNombresPorEspecie.get(nombreComun.id_especie) ?? 0) > 1) return null;
  return ordenarImagenes(deEspecie)[0]?.url_imagen ?? null;
}

export function etiquetaEspecie(especie: {
  nombre_cientifico?: string | null;
  epiteto_especifico?: string | null;
  id_especie: number;
}): string {
  const cientifico = especie.nombre_cientifico?.trim();
  if (cientifico) return cientifico;
  const epiteto = especie.epiteto_especifico?.trim();
  if (epiteto) return epiteto;
  return `Especie #${especie.id_especie}`;
}

export function etiquetaUbicacion(u: {
  pais?: string | null;
  estado?: string | null;
  municipio?: string | null;
  localidad?: string | null;
}): string {
  const partes = [u.pais, u.estado, u.municipio, u.localidad]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p));
  return partes.join(" · ") || "Ubicación sin nombre";
}
