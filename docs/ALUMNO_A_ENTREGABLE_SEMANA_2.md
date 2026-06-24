# Entregable Semana 2 — Alumno A (Frontend)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 15–21 de junio de 2026  
**Rol:** Frontend web  
**Plataforma:** Sitio web Next.js (`web/`)  
**Fecha de entrega:** 21 de junio de 2026

---

## Metas de la semana — cumplimiento

| Meta | Estado | Evidencia en este documento |
|------|--------|----------------------------|
| Construir la estructura base del proyecto en Next.js | ✅ | Entregable 1, sección 2 |
| Crear layout principal y navegación | ✅ | Entregable 2 |
| Crear página de inicio básica | ✅ | Entregable 2, sección 2.4 |
| Crear estructura de la página de catálogo | ✅ | Entregable 2, sección 2.5 |
| Conectar proyecto con Supabase | ✅ | Entregable 3 |

---

## Criterio de aceptación (Semana 2)

> Existe una aplicación Next.js funcional con navegación básica y conexión a Supabase.

| Criterio | Estado | Verificación |
|----------|--------|--------------|
| Aplicación Next.js funcional | ✅ | `npm run dev` / `npm run build` sin errores |
| Navegación básica operativa | ✅ | Header con Inicio, Catálogo, Médico Virtual |
| Conexión Supabase establecida | ✅ | Catálogo y fichas cargan 284 especies desde BD |

---

## Entregable 1 — Estructura base del proyecto Next.js

### 1.1 Punto de partida (cierre Semana 1)

Al iniciar la Semana 2, el frontend web tenía ~45 % del objetivo implementado en la Semana 1:

| Elemento | Estado al 15/jun |
|----------|------------------|
| Rutas principales (`/`, `/catalogo`, `/planta/[id]`, `/asistente`) | ✅ Creadas |
| Componentes UI base | ✅ Header, PlantCard, SectionCard |
| Estilos (paleta botánica) | ✅ `globals.css` |
| Conexión Supabase | ⚠️ Parcial — lectura de catálogo probada, faltaba consolidar capa de datos |
| Despliegue Vercel | ❌ Pendiente |

**Objetivo Semana 2:** consolidar la estructura base, asegurar Supabase en todas las páginas y dejar el sitio listo para escalar el catálogo en Semana 3.

### 1.2 Estructura base implementada (cierre Semana 2)

| Elemento | Ruta / archivo | Estado |
|----------|----------------|--------|
| Layout global (header + main + footer) | `web/src/app/layout.tsx` | ✅ |
| Cabecera y navegación | `web/src/components/Header.tsx` | ✅ |
| Página de inicio | `web/src/app/page.tsx` | ✅ |
| Página de catálogo | `web/src/app/catalogo/page.tsx` | ✅ |
| Componente de catálogo | `web/src/components/PlantCatalog.tsx` | ✅ |
| Ficha de planta | `web/src/app/planta/[id]/page.tsx` | ✅ |
| Vista de ficha | `web/src/components/PlantDetailView.tsx` | ✅ |
| Asistente (estructura) | `web/src/app/asistente/page.tsx` | ✅ |
| Tarjeta de planta | `web/src/components/PlantCard.tsx` | ✅ |
| Banner de error Supabase | `web/src/components/SupabaseErrorBanner.tsx` | ✅ |
| Tipos TypeScript del dominio | `web/src/types/database.ts` | ✅ |
| Configuración Next.js | `web/next.config.ts` | ✅ |
| Configuración Vercel | `web/vercel.json` | ✅ |

**Avance estimado al cierre de Semana 2:** ~65 % del frontend web objetivo.

### 1.3 Lo que queda para semanas posteriores

| Prioridad | Elemento | Semana sugerida |
|-----------|----------|-----------------|
| Alta | Pulir catálogo (paginación, filtros avanzados) | 3 |
| Media | Página "Acerca de" / créditos VIC | 3 |
| Media | SEO (sitemap.xml, Open Graph) | 3 |
| Media | Diseño formal unificado (hero, acentos dorados) | 3–4 |
| Baja | Favoritos en web | 4+ |
| Baja | Modo oscuro | Opcional |

---

## Entregable 2 — Layout, navegación e inicio

### 2.1 Layout principal

El layout global envuelve todas las páginas con:

- **Header fijo** — logo Farmacia Viva + navegación
- **`<main>`** — contenido de cada ruta
- **Footer** — texto institucional VIC 2026

Archivo: `web/src/app/layout.tsx`

### 2.2 Navegación principal

Barra superior persistente (`Header.tsx`):

```
[ 🌿 Farmacia Viva ]     [ Inicio ]  [ Catálogo ]  [ Médico Virtual ]
```

| Enlace | Ruta | Función |
|--------|------|---------|
| Inicio | `/` | Presentación y plantas destacadas |
| Catálogo | `/catalogo` | Listado completo desde Supabase |
| Médico Virtual | `/asistente` | Chat con contexto del catálogo |

### 2.3 Sitemap (estructura Semana 2)

```
/                          Inicio — hero, plantas destacadas, accesos rápidos
├── /catalogo              Catálogo — listado, búsqueda, filtro por familia
├── /planta/[id]           Ficha detallada de la especie
└── /asistente             Consultas asistidas (estructura base)

/api/chat                  API interna del asistente (no visible al usuario)
```

### 2.4 Página de inicio (`/`)

Implementada en `web/src/app/page.tsx`:

- **Hero** con título "Farmacia Viva", badge VIC 2026 y botones de acceso
- **Plantas destacadas** — grid de 6 especies leídas desde Supabase
- **Contador** de especies en catálogo (284)
- **Sección informativa** — catálogo, fichas, Médico Virtual
- **Manejo de error** — `SupabaseErrorBanner` si falla la conexión

### 2.5 Estructura del catálogo (`/catalogo`)

Implementada en `web/src/app/catalogo/page.tsx` + `PlantCatalog.tsx`:

| Elemento | Descripción |
|----------|-------------|
| Carga de datos | Server Component → `obtenerCatalogoPlantas()` |
| Barra de búsqueda | Filtra por nombre común o científico |
| Filtro por familia | Select con familias botánicas |
| Grid de tarjetas | `PlantCard` con imagen, nombre y badges |
| Enlace a ficha | `/planta/[id_especie]?nombre=...` |
| Estado vacío | Mensaje si no hay resultados |

### 2.6 Flujos de usuario validados

| Flujo | Ruta | Estado |
|-------|------|--------|
| Inicio → catálogo | `/` → `/catalogo` | ✅ |
| Catálogo → ficha | `/catalogo` → `/planta/[id]` | ✅ |
| Ficha → volver | `/planta/[id]` → `/catalogo` | ✅ |
| Inicio → asistente | `/` → `/asistente` | ✅ |
| Ficha → asistente con contexto | `/planta/[id]` → `/asistente?planta=&nombre=` | ✅ |

---

## Entregable 3 — Conexión con Supabase

### 3.1 Variables de entorno

Archivo local: `web/.env.local` (no se sube a Git)

| Variable | Uso en frontend |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Lectura pública del catálogo |

### 3.2 Capa de datos implementada

| Archivo | Responsabilidad |
|---------|-----------------|
| `web/src/lib/supabase/client.ts` | Cliente Supabase en el navegador |
| `web/src/lib/supabase/server.ts` | Cliente Supabase en Server Components |
| `web/src/lib/supabase/config.ts` | Validación de credenciales |
| `web/src/lib/plants.ts` | Queries: catálogo, ficha, búsqueda |
| `web/src/lib/images.ts` | URLs de imágenes en Supabase Storage |

### 3.3 Tablas consultadas desde el frontend

| Tabla | Uso |
|-------|-----|
| `nombre_comun` | Listado y nombres en tarjetas |
| `especie` | Datos botánicos en fichas |
| `imagen_especie` | Fotos desde Storage |
| `familia` / relaciones taxonómicas | Filtros y badges |
| `uso_planta`, `propiedad`, etc. | Contenido de fichas |

### 3.4 Imágenes desde Supabase Storage

Configuración en `web/next.config.ts`:

- Dominio permitido: `**.supabase.co`
- Ruta: `/storage/v1/object/public/**`
- Componente: `next/image` con `unoptimized` para URLs externas

### 3.5 Verificación de conexión

- [x] Inicio carga plantas destacadas desde Supabase
- [x] Catálogo muestra **284 especies** (289 nombres comunes)
- [x] Ficha `/planta/111?nombre=Achiote` carga imagen y datos reales
- [x] Error de conexión muestra banner amigable (`SupabaseErrorBanner`)
- [x] `npm run build` compila sin errores de TypeScript

### 3.6 Despliegue (inicio de integración)

| Elemento | Estado |
|----------|--------|
| Repositorio GitHub | ✅ `github.com/Isela-ux/farmaciaviva` |
| Vercel — Root Directory `web` | ✅ Configurado |
| Variables de entorno en Vercel | ✅ Supabase + API keys |
| URL pública | ✅ `project-gzlfs.vercel.app` (equipo) |

---

## Entregable 4 — Entorno y comandos

### 4.1 Stack (sin cambios respecto a Semana 1)

| Tecnología | Versión |
|------------|---------|
| Next.js | 16.x |
| React | 19.x |
| Tailwind CSS | 4.x |
| TypeScript | 5.x |
| @supabase/ssr | 0.12.x |

### 4.2 Comandos de verificación

```bash
cd web
npm install
npm run dev          # http://localhost:3000
npm run build        # compilación de producción
```

### 4.3 Estructura del proyecto (Semana 2)

```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout global
│   │   ├── page.tsx            # Inicio
│   │   ├── globals.css         # Paleta botánica
│   │   ├── catalogo/page.tsx   # Catálogo
│   │   ├── planta/[id]/page.tsx
│   │   ├── asistente/page.tsx
│   │   └── api/chat/route.ts
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── PlantCard.tsx
│   │   ├── PlantCatalog.tsx
│   │   ├── PlantDetailView.tsx
│   │   └── SupabaseErrorBanner.tsx
│   ├── lib/
│   │   ├── supabase/           # Cliente + servidor
│   │   ├── plants.ts           # Queries al catálogo
│   │   └── images.ts           # URLs Storage
│   └── types/database.ts
├── vercel.json
├── next.config.ts
└── README.md
```

---

## Nota sobre el catálogo (284 especies)

El cronograma VIC menciona ~500 plantas como referencia del proyecto.  
**Nuestro catálogo real en Supabase tiene 284 especies medicinales.**  
Toda la conexión frontend–Supabase está construida sobre ese conjunto de datos.

---

## Evidencia sugerida (Alumno A)

- [ ] Captura de `http://localhost:3000` o URL Vercel (inicio con plantas destacadas)
- [ ] Captura de `/catalogo` con plantas cargadas desde Supabase
- [ ] Captura de navegación (Header con Inicio, Catálogo, Médico Virtual)
- [ ] Captura de ficha `/planta/[id]` con imagen real
- [ ] Captura de estructura del proyecto (`web/src/app/`, `web/src/components/`)
- [ ] Captura de deploy en Vercel (Dashboard → Deployments)
- [ ] Fotografía de sesión de trabajo técnico en equipo

---

## Firma / responsable

| Campo | Valor |
|-------|-------|
| Alumno A | _[nombre]_ |
| Fecha | 21 / 06 / 2026 |
