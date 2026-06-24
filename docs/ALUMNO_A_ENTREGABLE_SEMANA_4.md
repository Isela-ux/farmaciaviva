# Entregable Semana 4 — Alumno A (Frontend)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 29 de junio al 5 de julio de 2026  
**Rol:** Frontend web  
**Plataforma:** Sitio web Next.js (`web/`)  
**Fecha de entrega:** 5 de julio de 2026

---

## Metas de la semana — cumplimiento

| Meta | Estado | Evidencia en este documento |
|------|--------|----------------------------|
| Construir la ficha completa de cada planta con toda la información disponible | ✅ | Entregable 1 |
| Mostrar propiedades, usos, contraindicaciones e imágenes | ✅ | Entregable 1 |
| Mejorar la búsqueda con filtros básicos | ✅ | Entregable 2 |
| Validar la experiencia de navegación completa del catálogo | ✅ | Entregable 3 |

---

## Criterio de aceptación (Semana 4)

> El usuario puede navegar el catálogo, buscar una planta y ver su ficha completa con toda la información disponible.

| Criterio | Estado | Verificación |
|----------|--------|--------------|
| Ficha completa y funcional | ✅ | `/planta/[id]` con todas las secciones de Supabase |
| Usos y contraindicaciones visibles | ✅ | Campo `riesgos_contraindicaciones` en usos medicinales |
| Propiedades e imágenes | ✅ | Secciones dedicadas + galería hasta 3 fotos |
| Búsqueda con filtros básicos | ✅ | Texto + familia + región en `/catalogo` |
| Flujo catálogo → ficha estable | ✅ | Navegación ida y vuelta probada en local y Vercel |

---

## Entregable 1 — Ficha individual completa

### 1.1 Punto de partida (cierre Semana 3)

| Elemento | Estado al 28/jun |
|----------|------------------|
| Estructura de ficha | ✅ Todas las secciones creadas |
| Ubicación geográfica | ⚠️ Listado repetitivo (datos duplicados en BD) |
| Flujo hacia asistente | ⚠️ Enlace básico |
| Agrupación de ubicaciones | ❌ No implementada |
| Presentación de localidades | ❌ Párrafo largo |

**Objetivo Semana 4:** ficha completa, legible y conectada al resto de la app.

### 1.2 Ficha implementada (cierre Semana 4)

Archivos: `web/src/app/planta/[id]/page.tsx` + `web/src/components/PlantDetailView.tsx` + `web/src/lib/plants.ts`

| Sección | Contenido | Estado |
|---------|-----------|--------|
| Encabezado | Nombre común, científico, familia, género | ✅ |
| Acción principal | Botón «Consultar al Médico Virtual» con contexto de planta | ✅ |
| Galería | Hasta 3 imágenes desde Supabase Storage; placeholder 🌱 si no hay foto | ✅ |
| Descripción botánica | `especie.descripcion_botanica` | ✅ |
| Datos generales | Tipo, ciclo de vida, origen, conservación, endemismo | ✅ |
| Nombres comunes | Lista con idioma y región | ✅ |
| Usos medicinales | Categoría, descripción, parte, preparación, vía, **riesgos/contraindicaciones** | ✅ |
| Propiedades | Nombre, descripción, nivel de evidencia | ✅ |
| Compuestos activos | Nombre, concentración, descripción | ✅ |
| Hábitat | Tipos de hábitat vinculados | ✅ |
| Ubicación geográfica | Zonas agrupadas + localidades en **lista con viñetas** | ✅ |
| Bibliografía | Fuentes, autores, citas y enlaces | ✅ |

### 1.3 Mejora de ubicación geográfica (Semana 4)

Problema detectado: la tabla `especie_ubicacion` tenía muchas filas repetidas o micro-localidades que saturaban la ficha.

Solución en `plants.ts` (sin tocar la base de datos):

1. **Deduplicación** — misma lógica que la app Android (`Ubicacion.kt`).
2. **Agrupación** — por país · estado · municipio y mismos metadatos (nativa, cultivada, abundancia).
3. **Presentación** — localidades como lista (`<ul>`) en `PlantDetailView.tsx`.

Resultado: en plantas como Ajonjolí (`/planta/283`) se muestran pocas zonas con sus localidades listadas, no decenas de bloques repetidos.

### 1.4 Metadata SEO

`generateMetadata()` en la página dinámica:
- Título: nombre común de la planta
- Descripción: primeros 160 caracteres de la descripción botánica

---

## Entregable 2 — Búsqueda y filtros básicos

Archivo: `web/src/components/PlantCatalog.tsx`

| Funcionalidad | Descripción | Estado |
|---------------|-------------|--------|
| Búsqueda por texto | Nombre común, científico y región | ✅ |
| Filtro por familia | `<select>` desde tabla `familia` | ✅ |
| Filtro por región | `<select>` desde `nombre_comun.region_uso` | ✅ |
| Combinación de filtros | Texto + familia + región a la vez | ✅ |
| Limpiar filtros | Botón cuando hay filtros activos | ✅ |
| Paginación | 24 resultados por página sobre el subconjunto filtrado | ✅ |
| Contador | «X resultados de Y especies indexadas» | ✅ |
| Normalización | Búsqueda insensible a acentos | ✅ |

### Ejemplos de prueba

| Acción | URL / entrada | Resultado esperado |
|--------|---------------|-------------------|
| Buscar por nombre | `manzanilla` en `/catalogo` | Tarjetas filtradas |
| Filtrar familia | Seleccionar una familia botánica | Solo especies de esa familia |
| Filtrar región | Seleccionar región de uso | Solo nombres comunes de esa región |
| Combinar | Texto + familia + región | Intersección de los tres criterios |

---

## Entregable 3 — Flujo de navegación completo

### 3.1 Diagrama del flujo

```
Inicio (/)
  └── Catálogo (/catalogo)
        ├── Buscar / filtrar / paginar
        ├── Clic en tarjeta → Ficha (/planta/[id]?nombre=...)
        │     ├── Ver ficha completa
        │     ├── «← Volver al catálogo»
        │     └── «Consultar al Médico Virtual» → /asistente?planta=&nombre=
        └── URL directa a ficha (compartir enlace)
```

### 3.2 Flujos validados

| # | Flujo | Ruta | Estado |
|---|-------|------|--------|
| 1 | Catálogo → Ficha | Clic en `PlantCard` | ✅ |
| 2 | Ficha → Catálogo | Enlace superior izquierdo | ✅ |
| 3 | Ficha → Asistente | Botón dorado con contexto de planta | ✅ |
| 4 | Búsqueda → Ficha | Filtrar y abrir resultado | ✅ |
| 5 | Paginación → Ficha | Página 2+ del catálogo | ✅ |
| 6 | URL directa | `/planta/283?nombre=Ajonjolí` | ✅ |
| 7 | Ficha inexistente | ID inválido → 404 | ✅ |
| 8 | Asistente con planta | `/asistente?planta=283&nombre=Ajonjolí` | ✅ |

### 3.3 Parámetros de URL

| Parámetro | Uso |
|-----------|-----|
| `[id]` | `id_especie` en Supabase |
| `?nombre=` | Nombre común destacado en título de ficha y enlace al asistente |
| `?planta=` (asistente) | Precarga contexto de la especie en el Médico Virtual |

---

## Entregable 4 — Despliegue y acceso

| Elemento | Estado |
|----------|--------|
| Local (`npm run dev`) | ✅ Rutas `/catalogo`, `/planta/[id]`, `/asistente` responden 200 |
| Deploy Vercel | ✅ `project-gzlfs.vercel.app` (root `web`) |
| Catálogo en producción | ✅ |
| Fichas en producción | ✅ (redeploy recomendado tras fix de ubicaciones) |

---

## Nota sobre el catálogo (284 especies)

El cronograma VIC menciona ~500 plantas como referencia.  
**Nuestro catálogo en Supabase tiene 284 especies medicinales.**  
El frontend muestra el **100 %** de esas especies con ficha individual disponible.

---

## Lista exacta de capturas — Alumno A

Guardar en una carpeta `evidencia/semana4/alumno-a/` con los nombres sugeridos.

| # | Archivo sugerido | Qué capturar | URL / acción |
|---|-----------------|--------------|--------------|
| A1 | `01_catalogo_general.png` | Vista completa del catálogo: grid de tarjetas, contador «X resultados de 284 especies», paginación visible | `http://localhost:3000/catalogo` o Vercel |
| A2 | `02_busqueda_texto.png` | Campo de búsqueda con texto escrito (ej. `manzanilla` o `achiote`) y resultados filtrados | `/catalogo` + escribir en buscador |
| A3 | `03_filtro_familia.png` | Filtro **Familia** seleccionado (no «Todas») + contador de resultados actualizado | `/catalogo` + elegir familia |
| A4 | `04_filtro_region.png` | Filtro **Región** seleccionado + al menos una tarjeta visible | `/catalogo` + elegir región |
| A5 | `05_filtros_combinados.png` | Búsqueda + familia + región activos a la vez; botón «Limpiar filtros» visible | `/catalogo` con los 3 filtros |
| A6 | `06_tarjeta_imagen_real.png` | Una `PlantCard` con **foto real** de Supabase (no placeholder 🌱) | Zoom o recorte de una tarjeta del catálogo |
| A7 | `07_ficha_encabezado.png` | Parte superior de ficha: título, nombre científico, familia, botón «Consultar al Médico Virtual», galería | `/planta/283?nombre=Ajonjolí` |
| A8 | `08_ficha_usos_contraindicaciones.png` | Sección **Usos medicinales** con al menos un uso que muestre **Riesgos** en rojo/coral | Misma ficha, scroll a usos (ej. Ajonjolí o Manzanilla) |
| A9 | `09_ficha_propiedades_compuestos.png` | Secciones **Propiedades** y/o **Compuestos activos** visibles | Scroll en la misma ficha |
| A10 | `10_ficha_ubicacion_lista.png` | Sección **Ubicación geográfica** con zonas agrupadas y **localidades en lista con viñetas** | `/planta/283?nombre=Ajonjolí` |
| A11 | `11_ficha_bibliografia.png` | Sección **Bibliografía** con al menos una fuente | Scroll al final de la ficha |
| A12 | `12_flujo_volver_catalogo.png` | Enlace «← Volver al catálogo» visible en la ficha (o captura del clic de regreso) | `/planta/[id]` |
| A13 | `13_flujo_ficha_a_asistente.png` | Ficha con botón Médico Virtual **o** asistente abierto con `?planta=` en la URL | Clic en botón → `/asistente?planta=...` |
| A14 | `14_produccion_vercel.png` | Misma ficha o catálogo en **Vercel** (barra de URL con dominio de producción) | `https://project-gzlfs.vercel.app/catalogo` |
| A15 | `15_tutoria_asesor.jpg` | Fotografía de revisión técnica con el asesor (presencial o videollamada) | Sesión académica |

### Checklist rápido Alumno A

- [ ] A1 — Catálogo general  
- [ ] A2 — Búsqueda por texto  
- [ ] A3 — Filtro familia  
- [ ] A4 — Filtro región  
- [ ] A5 — Filtros combinados  
- [ ] A6 — Imagen real en tarjeta  
- [ ] A7 — Encabezado de ficha  
- [ ] A8 — Usos y contraindicaciones  
- [ ] A9 — Propiedades / compuestos  
- [ ] A10 — Ubicación en lista  
- [ ] A11 — Bibliografía  
- [ ] A12 — Volver al catálogo  
- [ ] A13 — Ficha → asistente  
- [ ] A14 — Producción Vercel  
- [ ] A15 — Foto tutoría  

---

## Firma / responsable

| Campo | Valor |
|-------|-------|
| Alumno A | _[nombre]_ |
| Fecha | 5 / 07 / 2026 |
