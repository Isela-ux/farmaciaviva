# Entregable Semana 3 — Alumno A (Frontend)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 22–28 de junio de 2026  
**Rol:** Frontend web  
**Plataforma:** Sitio web Next.js (`web/`)  
**Fecha de entrega:** 28 de junio de 2026

---

## Metas de la semana — cumplimiento

| Meta | Estado | Evidencia en este documento |
|------|--------|----------------------------|
| Construir el catálogo de plantas con listado navegable | ✅ | Entregable 1 |
| Implementar búsqueda básica sobre el catálogo | ✅ | Entregable 2 |
| Mostrar imágenes de plantas desde Supabase Storage | ✅ | Entregable 3 |
| Crear estructura de la ficha individual de planta | ✅ | Entregable 4 |
| Validar navegación entre catálogo y fichas | ✅ | Entregable 5 |

---

## Criterio de aceptación (Semana 3)

> El usuario puede navegar el catálogo, buscar plantas y ver imágenes reales desde la base de datos.

| Criterio | Estado | Verificación |
|----------|--------|--------------|
| Catálogo navegable | ✅ | `/catalogo` con grid de tarjetas y paginación |
| Búsqueda básica operativa | ✅ | Por nombre común, científico y región |
| Imágenes reales desde BD | ✅ | URLs de Supabase Storage en tarjetas y fichas |
| Ficha individual accesible | ✅ | `/planta/[id]` con datos e imágenes |
| Navegación catálogo ↔ ficha | ✅ | Enlaces ida y vuelta probados |

---

## Entregable 1 — Catálogo navegable

### 1.1 Punto de partida (cierre Semana 2)

| Elemento | Estado al 21/jun |
|----------|------------------|
| Página `/catalogo` creada | ✅ Estructura base |
| Listado desde Supabase | ✅ Sin paginación |
| Búsqueda | ⚠️ Básica (solo texto) |
| Filtros | ⚠️ Solo familia |
| Paginación | ❌ No implementada |
| Contador de resultados | ❌ No implementado |

**Objetivo Semana 3:** catálogo completo, navegable y usable para explorar las 284 especies.

### 1.2 Catálogo implementado (cierre Semana 3)

Archivos: `web/src/app/catalogo/page.tsx` + `web/src/components/PlantCatalog.tsx`

| Funcionalidad | Descripción | Estado |
|---------------|-------------|--------|
| Grid de tarjetas | `PlantCard` responsive (1/2/3 columnas) | ✅ |
| Paginación | 24 plantas por página con Anterior / Siguiente | ✅ |
| Contador | "X resultados de Y especies indexadas" | ✅ |
| Estado vacío | Mensaje si no hay coincidencias | ✅ |
| Carga server-side | Datos desde Supabase en Server Component | ✅ |

### 1.3 Flujo de navegación en el catálogo

```
/catalogo
  ├── Ver listado paginado
  ├── Aplicar búsqueda / filtros
  ├── Clic en tarjeta → /planta/[id]?nombre=...
  └── Paginar resultados filtrados
```

**Avance estimado al cierre de Semana 3:** ~80 % del frontend web objetivo.

---

## Entregable 2 — Búsqueda y filtros

### 2.1 Búsqueda básica

Implementada en `PlantCatalog.tsx` (client-side sobre datos cargados):

| Campo buscable | Ejemplo |
|----------------|---------|
| Nombre común | "manzanilla", "achiote" |
| Nombre científico | "Bixa orellana" |
| Región de uso | Texto en `region_uso` |

- Normalización de acentos (búsqueda insensible a tildes)
- Actualización en tiempo real al escribir
- Reinicio de página al cambiar filtros

### 2.2 Filtros adicionales (Semana 3)

| Filtro | Control | Fuente |
|--------|---------|--------|
| Familia botánica | `<select>` | Tabla `familia` vía `obtenerFamilias()` |
| Región de uso | `<select>` | Valores únicos de `nombre_comun.region_uso` |

### 2.3 Acciones del usuario

| Acción | Comportamiento |
|--------|----------------|
| Buscar + filtrar | Combina texto + familia + región |
| Limpiar filtros | Botón visible cuando hay filtros activos |
| Paginar | Solo sobre resultados filtrados |

---

## Entregable 3 — Imágenes desde Supabase Storage

### 3.1 Configuración

| Elemento | Archivo / ubicación |
|----------|---------------------|
| Dominio permitido | `web/next.config.ts` → `**.supabase.co` |
| Lógica de URL | `web/src/lib/images.ts` → `urlImagenParaLista()` |
| Componente imagen | `next/image` en `PlantCard.tsx` |

### 3.2 Bucket y rutas

- **Storage:** Supabase → bucket `plantas`
- **Tabla:** `imagen_especie` (relación especie ↔ URL)
- **Prioridad:** Imagen principal de la especie; fallback si no hay foto

### 3.3 Dónde se muestran imágenes

| Vista | Componente | Cantidad |
|-------|------------|----------|
| Catálogo | `PlantCard` | 1 imagen por tarjeta |
| Ficha | `PlantDetailView` | Hasta 3 imágenes |
| Inicio | `PlantCard` en grid destacadas | 6 plantas |

### 3.4 Verificación

- [x] Imágenes cargan desde URLs reales (`*.supabase.co/storage/...`)
- [x] Placeholder 🌱 si la especie no tiene imagen
- [x] Aspect ratio consistente (4:3) en tarjetas

---

## Entregable 4 — Estructura de ficha individual

### 4.1 Ruta

`/planta/[id]?nombre=...` — `web/src/app/planta/[id]/page.tsx`

### 4.2 Secciones de la ficha (estructura Semana 3)

Implementadas en `PlantDetailView.tsx`:

| Sección | Contenido | Estado |
|---------|-----------|--------|
| Encabezado | Nombre común, científico, familia, género | ✅ |
| Galería | Hasta 3 imágenes desde Storage | ✅ |
| Descripción botánica | Texto de `especie.descripcion_botanica` | ✅ |
| Datos generales | Tipo, ciclo de vida, origen, endemismo | ✅ |
| Nombres comunes | Lista con idioma y región | ✅ |
| Usos medicinales | Descripción, parte, preparación, riesgos | ✅ |
| Propiedades | Nombre y nivel de evidencia | ✅ |
| Compuestos activos | Nombre y concentración | ✅ |
| Hábitat | Tipos de hábitat | ✅ |
| Ubicación geográfica | Regiones reportadas | ✅ |
| Bibliografía | Fuentes y citas | ✅ |

> **Nota:** La ficha incluye todas las secciones disponibles en Supabase. El pulido visual y el flujo hacia el asistente se documentan en el entregable de Semana 4.

### 4.3 Metadata SEO por planta

`generateMetadata()` en la página dinámica:
- Título: nombre común de la planta
- Descripción: primeros 160 caracteres de la descripción botánica

---

## Entregable 5 — Validación de navegación

### 5.1 Flujos probados

| # | Flujo | Ruta | Estado |
|---|-------|------|--------|
| 1 | Inicio → Catálogo | `/` → `/catalogo` | ✅ |
| 2 | Catálogo → Ficha | Clic en `PlantCard` | ✅ |
| 3 | Ficha → Catálogo | "← Volver al catálogo" | ✅ |
| 4 | Búsqueda → Ficha | Filtrar y abrir resultado | ✅ |
| 5 | Paginación → Ficha | Página 2+ del catálogo | ✅ |
| 6 | URL directa | `/planta/111?nombre=Achiote` | ✅ |
| 7 | Ficha inexistente | ID inválido → 404 | ✅ |

### 5.2 Parámetros de URL

| Parámetro | Uso |
|-----------|-----|
| `[id]` | `id_especie` en Supabase |
| `?nombre=` | Nombre común para título destacado en la ficha |

---

## Entregable 6 — Despliegue y acceso público

| Elemento | Estado |
|----------|--------|
| Deploy Vercel | ✅ `project-gzlfs.vercel.app` |
| Root Directory `web` | ✅ |
| Catálogo accesible en producción | ✅ |
| Imágenes en producción | ✅ |

---

## Nota sobre el catálogo (284 especies)

El cronograma VIC menciona ~500 plantas como referencia.  
**Nuestro catálogo en Supabase tiene 284 especies medicinales.**  
El catálogo web muestra y permite navegar el **100 %** de esas especies.

---

## Lo que queda para Semana 4

| Prioridad | Elemento |
|-----------|----------|
| Alta | Pulir ficha completa y flujo catálogo → ficha → Médico Virtual |
| Media | Diseño formal unificado (hero, acentos dorados) |
| Media | Médico Virtual con imágenes de plantas en el chat |
| Baja | SEO (sitemap.xml) |

---

## Evidencia sugerida (Alumno A)

- [ ] Captura de `/catalogo` con grid, contador y paginación
- [ ] Captura de búsqueda activa (ej. "achiote" con resultados)
- [ ] Captura de filtros por familia y/o región aplicados
- [ ] Captura de tarjeta con **imagen real** desde Supabase
- [ ] Captura de ficha `/planta/[id]` con galería y secciones visibles
- [ ] Captura del flujo "Volver al catálogo" desde una ficha
- [ ] Captura de la URL en Vercel (producción) — opcional
- [ ] Fotografía de tutoría académica

---

## Firma / responsable

| Campo | Valor |
|-------|-------|
| Alumno A | _[nombre]_ |
| Fecha | 28 / 06 / 2026 |
