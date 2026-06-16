export interface NombreComun {
  id_nombre_comun: number;
  nombre_comun: string;
  idioma: string;
  region_uso: string;
  id_especie: number;
}

export interface ImagenEspecie {
  id_imagen: number;
  url_imagen: string;
  es_principal: boolean;
  id_especie: number;
  id_nombre_comun?: number | null;
  mostrar_en_app?: boolean | null;
}

export interface Familia {
  id_familia: number;
  nombre_familia: string;
  descripcion?: string | null;
}

export interface EspecieDetalle {
  id_especie: number;
  nombre_cientifico?: string | null;
  autor_taxonomico?: string | null;
  epiteto_especifico?: string | null;
  descripcion_botanica?: string | null;
  ciclo_vida?: string | null;
  tipo_planta?: string | null;
  estatus_conservacion?: string | null;
  origen_geografico?: string | null;
  es_endemica?: boolean | null;
  observaciones?: string | null;
  id_genero?: number | null;
}

export interface GeneroInfo {
  id_genero: number;
  nombre_genero?: string | null;
  id_familia?: number | null;
}

export interface Propiedad {
  id_propiedad: number;
  nombre_propiedad: string;
  descripcion?: string | null;
}

export interface EspeciePropiedad {
  id_especie_propiedad: number;
  id_especie: number;
  id_propiedad: number;
  nivel_evidencia?: string | null;
  observaciones?: string | null;
}

export interface CategoriaUso {
  id_categoria_uso: number;
  nombre_categoria: string;
  descripcion?: string | null;
}

export interface UsoPlanta {
  id_uso: number;
  id_especie: number;
  id_categoria_uso?: number | null;
  descripcion_uso?: string | null;
  parte_utilizada?: string | null;
  forma_preparacion?: string | null;
  via_administracion?: string | null;
  frecuencia_uso?: string | null;
  riesgos_contraindicaciones?: string | null;
}

export interface CompuestoActivo {
  id_compuesto: number;
  nombre_compuesto: string;
  descripcion?: string | null;
}

export interface EspecieCompuesto {
  id_especie_compuesto: number;
  id_especie: number;
  id_compuesto: number;
  concentracion?: string | null;
  observaciones?: string | null;
}

export interface Habitat {
  id_habitat: number;
  nombre_habitat: string;
  descripcion?: string | null;
}

export interface EspecieHabitat {
  id_especie_habitat: number;
  id_especie: number;
  id_habitat: number;
  observaciones?: string | null;
}

export interface UbicacionGeografica {
  id_ubicacion: number;
  pais?: string | null;
  estado?: string | null;
  municipio?: string | null;
  localidad?: string | null;
  latitud?: string | null;
  longitud?: string | null;
  region_biogeografica?: string | null;
}

export interface EspecieUbicacion {
  id_especie_ubicacion: number;
  id_especie: number;
  id_ubicacion: number;
  es_nativa?: boolean | null;
  es_cultivada?: boolean | null;
  abundancia?: string | null;
  observaciones?: string | null;
}

export interface Fuente {
  id_fuente: number;
  titulo?: string | null;
  autores?: string | null;
  anio?: number | null;
  tipo_fuente?: string | null;
  url?: string | null;
}

export interface DetalleFuenteEspecie {
  id_detalle_fuente: number;
  id_especie: number;
  id_fuente: number;
  cita_textual_resumida?: string | null;
  pagina?: string | null;
  observaciones?: string | null;
}

export interface PlantEmbedding {
  id: number;
  id_especie: number;
  chunk_type: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity?: number;
}

export interface PlantaCatalogo {
  nombreComun: NombreComun;
  imagenUrl: string | null;
  nombreCientifico: string | null;
  idFamilia: number | null;
}

export interface FichaPlanta {
  especie: EspecieDetalle;
  nombresComunes: NombreComun[];
  imagenes: ImagenEspecie[];
  genero: GeneroInfo | null;
  familia: Familia | null;
  usos: UsoPlanta[];
  categoriasUso: Map<number, CategoriaUso>;
  propiedades: EspeciePropiedad[];
  catalogoPropiedades: Map<number, Propiedad>;
  compuestos: EspecieCompuesto[];
  catalogoCompuestos: Map<number, CompuestoActivo>;
  habitats: EspecieHabitat[];
  catalogoHabitats: Map<number, Habitat>;
  ubicaciones: EspecieUbicacion[];
  catalogoUbicaciones: Map<number, UbicacionGeografica>;
  fuentes: DetalleFuenteEspecie[];
  catalogoFuentes: Map<number, Fuente>;
}
