# Entregable Semana 1 — Alumno A (Frontend)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 12–14 de junio de 2026  
**Rol:** Frontend web  
**Plataforma:** Sitio web Next.js (`web/`)  
**Fecha de entrega:** 15 de junio de 2026

---

## Metas de la semana — cumplimiento

| Meta | Estado | Evidencia en este documento |
|------|--------|----------------------------|
| Revisar el estado actual del frontend (~15 % avanzado) | ✅ | Entregable 1, sección 1 |
| Identificar componentes existentes y lo que falta construir | ✅ | Entregable 1, secciones 2 y 3 |
| Definir estructura de páginas y navegación del sitio | ✅ | Entregable 2 |
| Instalar entorno de desarrollo con Next.js y Tailwind | ✅ | Entregable 3 |
| Participar en la investigación del stack RAG | ✅ | Sección final |

---

## Entregable 1 — Inventario del estado actual del frontend

### 1.1 Punto de partida (~15 % al inicio de semana 1)

Al arrancar el verano, el frontend web contaba con:

| Elemento | Estado inicial |
|----------|----------------|
| Código del sitio web | No existía — proyecto por crear |
| Diseño visual definido | Paleta botánica acordada (verdes, crema, dorado) |
| Flujos de usuario definidos | Catálogo, ficha de planta y asistente acordados |
| Stack tecnológico | Next.js + React + Tailwind CSS (según cronograma VIC) |

**Avance estimado al inicio:** ~15 % (especificación y diseño, sin implementación).

### 1.2 Componentes implementados (cierre semana 1)

| Elemento | Ruta / archivo | Estado |
|----------|----------------|--------|
| Página de inicio | `web/src/app/page.tsx` | ✅ |
| Catálogo con búsqueda y filtro | `web/src/app/catalogo/page.tsx` + `PlantCatalog.tsx` | ✅ |
| Ficha de planta | `web/src/app/planta/[id]/page.tsx` + `PlantDetailView.tsx` | ✅ |
| Asistente RAG | `web/src/app/asistente/page.tsx` + `ChatAssistant.tsx` | ✅ |
| Cabecera y navegación | `web/src/components/Header.tsx` | ✅ |
| Tarjeta de planta | `web/src/components/PlantCard.tsx` | ✅ |
| Sección reutilizable | `web/src/components/SectionCard.tsx` | ✅ |
| Errores de conexión | `web/src/components/SupabaseErrorBanner.tsx` | ✅ |
| Layout global | `web/src/app/layout.tsx` | ✅ |
| Estilos (paleta botánica) | `web/src/app/globals.css` | ✅ |

**Avance estimado al cierre de semana 1:** ~45 % del frontend web objetivo.

### 1.3 Lo que falta construir

| Prioridad | Elemento | Semana sugerida |
|-----------|----------|-----------------|
| Alta | Despliegue en Vercel | 2 |
| Media | Página "Acerca de" / créditos VIC | 2 |
| Media | Favoritos de plantas | 3+ |
| Media | SEO (metadata, sitemap.xml) | 2–3 |
| Baja | Modo oscuro | Opcional |
| Baja | Refinamiento responsive en fichas largas | 2 |

---

## Entregable 2 — Estructura de páginas y navegación definida

### 2.1 Sitemap

```
/                          Inicio — presentación, plantas destacadas, accesos rápidos
├── /catalogo              Catálogo — listado, búsqueda, filtro por familia
├── /planta/[id]           Ficha detallada de la especie
└── /asistente             Consultas asistidas por RAG

/api/chat                  API interna del asistente (no visible al usuario)
```

### 2.2 Navegación principal

Barra superior persistente (`Header.tsx`):

```
[ 🌿 Farmacia Viva ]     [ Inicio ]  [ Catálogo ]  [ Asistente ]
```

### 2.3 Flujos de usuario definidos

| Flujo | Ruta | Descripción |
|-------|------|-------------|
| Explorar catálogo | `/` → `/catalogo` | Desde inicio al listado completo |
| Buscar planta | `/catalogo` | Búsqueda por nombre común o científico |
| Filtrar por familia | `/catalogo` | Select de familias botánicas |
| Ver ficha | `/catalogo` → `/planta/[id]` | Detalle completo de la especie |
| Consultar asistente | `/asistente` o desde ficha | Chat con RAG |
| Pregunta de seguimiento | `/asistente` | El asistente mantiene contexto de la conversación |

### 2.4 Wireframe textual

**Inicio (`/`)**
- Hero con título, descripción y botones "Explorar catálogo" / "Asistente RAG"
- Grid de 6 plantas destacadas
- Sección de características (catálogo, fichas, asistente)

**Catálogo (`/catalogo`)**
- Barra de búsqueda + filtro por familia
- Grid de tarjetas (`PlantCard`) con imagen, nombre común y científico

**Ficha (`/planta/[id]`)**
- Imágenes, datos botánicos, usos, propiedades, compuestos, hábitat, ubicación, bibliografía
- Botón "Preguntar al asistente"

**Asistente (`/asistente`)**
- Chat con sugerencias, historial y campo de entrada

---

## Entregable 3 — Entorno de desarrollo listo

### 3.1 Stack instalado

| Tecnología | Versión | Ubicación |
|------------|---------|-----------|
| Next.js | 16.x | `web/package.json` |
| React | 19.x | `web/package.json` |
| Tailwind CSS | 4.x | `web/src/app/globals.css` |
| TypeScript | 5.x | `web/tsconfig.json` |

### 3.2 Instalación y ejecución

```bash
cd web
npm install
cp .env.local.example .env.local   # completar credenciales Supabase y Google
npm run dev                        # http://localhost:3000
npm run build                      # verificación de producción
```

### 3.3 Verificación realizada

- [x] `npm install` sin errores
- [x] `npm run dev` — servidor en `localhost:3000`
- [x] `npm run build` — compilación exitosa
- [x] Catálogo carga 284 especies desde Supabase
- [x] Fichas y asistente operativos

### 3.4 Estructura del proyecto web

```
web/
├── src/
│   ├── app/              # Rutas (App Router)
│   │   ├── page.tsx      # Inicio
│   │   ├── catalogo/
│   │   ├── planta/[id]/
│   │   ├── asistente/
│   │   └── api/chat/
│   ├── components/       # UI reutilizable
│   ├── lib/              # Supabase, plantas, imágenes
│   └── types/            # Tipos TypeScript
├── public/
├── package.json
├── next.config.ts
├── .env.local.example
└── README.md
```

---

## Participación en investigación del stack RAG

Como responsable de frontend web, participé en la evaluación del stack RAG:

- Revisión de compatibilidad **Vercel AI SDK + Next.js** para streaming en `/asistente`
- Validación de que la UI de chat (`ChatAssistant.tsx`) funciona con la API `/api/chat`
- Pruebas de flujo de usuario en el sitio: catálogo → ficha → asistente
- Revisión del documento de decisión: `docs/DECISION_RAG.md`

---

## Evidencia sugerida (Alumno A)

- [ ] Captura de `http://localhost:3000` (inicio)
- [ ] Captura de `/catalogo` con plantas cargadas
- [ ] Captura de ficha `/planta/[id]`
- [ ] Captura de `/asistente`
- [ ] Captura de estructura del proyecto web (`web/src/`)

---

## Firma / responsable

| Campo | Valor |
|-------|-------|
| Alumno A | _[nombre]_ |
| Fecha | 15 / 06 / 2026 |
