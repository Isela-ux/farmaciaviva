# Documentación técnica del frontend — Semana 8

**Proyecto:** Farmacia Viva · VIC 2026  
**Responsable:** Alumno A (Frontend)  
**Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript  
**URL producción:** https://proyecto-gzlfs.vercel.app

---

## 1. Resumen ejecutivo

El frontend web es una aplicación **Next.js** desplegada en **Vercel** que ofrece:

- Página de inicio con plantas destacadas
- Catálogo con búsqueda y filtros (284 especies)
- Fichas detalladas por especie
- **Médico Virtual**: asistente conversacional con árbol de decisiones, triaje y recomendación de plantas

**Estado al cierre del verano:** funcional en producción, con pruebas automatizadas del flujo de UI y agente.

---

## 2. Arquitectura del frontend

```text
┌─────────────────────────────────────────────────────────────┐
│  Navegador (React 19)                                       │
├─────────────────────────────────────────────────────────────┤
│  Páginas (App Router)                                       │
│    /              → page.tsx                                │
│    /catalogo      → PlantCatalog.tsx                        │
│    /planta/[id]   → PlantDetailView.tsx                     │
│    /asistente     → ChatAssistant.tsx                       │
├─────────────────────────────────────────────────────────────┤
│  Estado y orquestación                                      │
│    useMedicoGuia.ts    → fases: árbol → triaje → fin        │
│    useChat (@ai-sdk)   → chat libre RAG                     │
├─────────────────────────────────────────────────────────────┤
│  Capa de presentación                                       │
│    MedicoVirtual*      → burbujas, progreso, tarjetas       │
│    Header, PlantCard, SectionCard                           │
└─────────────────────────────────────────────────────────────┘
         │ fetch                    │ fetch
         ▼                          ▼
   /api/chat/guia            /api/chat, /api/chat/plantas
```

### 2.1 Decisiones de diseño

| Decisión | Motivo |
|----------|--------|
| App Router (Next.js 16) | SSR para catálogo/fichas; API routes en el mismo proyecto |
| Hook `useMedicoGuia` | Separar flujo clínico-educativo del chat libre RAG |
| Componentes `MedicoVirtual*` | Reutilizar UI del asistente sin mezclar con chat genérico |
| Tailwind CSS 4 | Paleta botánica del proyecto; diseño responsive |
| Cliente Supabase solo en servidor | Las API routes leen BD; el navegador no expone service role |

---

## 3. Componentes principales

### 3.1 Páginas

| Archivo | Ruta | Función |
|---------|------|---------|
| `app/page.tsx` | `/` | Landing, accesos rápidos al catálogo y asistente |
| `app/catalogo/page.tsx` | `/catalogo` | Listado paginado con búsqueda |
| `app/planta/[id]/page.tsx` | `/planta/[id]` | Ficha completa de especie |
| `app/asistente/page.tsx` | `/asistente` | Médico Virtual |
| `app/layout.tsx` | — | Layout global, fuentes, metadata |

### 3.2 Catálogo y fichas

| Componente | Responsabilidad |
|------------|-----------------|
| `PlantCatalog.tsx` | Grid de plantas, búsqueda, filtro por familia, paginación |
| `PlantCard.tsx` | Tarjeta con imagen, nombre común y científico |
| `PlantDetailView.tsx` | Usos, propiedades, hábitat, ubicación, fuentes |
| `SectionCard.tsx` | Bloques reutilizables en fichas |
| `SupabaseErrorBanner.tsx` | Aviso si faltan variables de entorno |

### 3.3 Médico Virtual (núcleo Semana 6–8)

| Componente / Hook | Responsabilidad |
|-------------------|-----------------|
| `ChatAssistant.tsx` | Orquesta chat libre + guía; entrada de usuario; sugerencias |
| `useMedicoGuia.ts` | Máquina de estados: `arbol` → `triaje` → `recomendacion` → `fin` |
| `MedicoVirtualProgreso.tsx` | Barra de pasos (¿qué sientes? → triaje → plantas) |
| `MedicoVirtualBubble.tsx` | Burbujas usuario/asistente con etiqueta de agente |
| `MedicoVirtualPlantas.tsx` | Tarjetas de plantas recomendadas (máx. 3) |
| `AssistantMessage.tsx` | Render markdown del chat libre (streaming) |

### 3.4 Librerías de apoyo (lado cliente / compartidas)

| Módulo | Uso en UI |
|--------|-----------|
| `arbol-padecimientos.ts` | Interpreta texto → opciones del árbol o hoja de padecimiento |
| `enrutar-medico-virtual.ts` | Decide si el mensaje va al guía o al chat libre |
| `medico-virtual-presentacion.ts` | Textos de progreso, placeholders, estados de carga |
| `filtro-entrada-agente.ts` | Off-topic e injection (también en API) |
| `guardrails-clinicos.ts` | Alertas de urgencia en el flujo del guía |

Documentación del agente completo: [`ARQUITECTURA_MEDICO_VIRTUAL.md`](./ARQUITECTURA_MEDICO_VIRTUAL.md).

---

## 4. Flujo de usuario en `/asistente`

```text
Usuario escribe mensaje
        │
        ├─ ¿Malestar o síntoma clínico? ──► useMedicoGuia (guía)
        │       ├─ Filtro entrada / guardrails
        │       ├─ Árbol (opciones: Dolor → cabeza, estómago…)
        │       ├─ Triaje (~3 preguntas, sin plantas al inicio)
        │       └─ Recomendación + tarjetas
        │
        └─ ¿Consulta de planta? ──────────► useChat → /api/chat (RAG stream)
```

**Botones de control:**

- **✨ Empezar de nuevo** — reinicia la consulta de malestar
- **🌿 Explorar plantas** — sale del guía al modo consulta libre

---

## 5. Integración con APIs (consumo desde frontend)

| Endpoint | Método | Consumidor | Propósito |
|----------|--------|------------|-----------|
| `/api/chat` | POST | `useChat` en `ChatAssistant` | Chat libre con streaming |
| `/api/chat/guia` | POST | `useMedicoGuia` | Triaje, recomendación, consulta planta |
| `/api/chat/plantas` | POST | `useMedicoGuia`, `ChatAssistant` | Resolver tarjetas con imagen |

El frontend **no** llama a DeepSeek ni a Supabase directamente para IA; todo pasa por las API routes del servidor.

---

## 6. Variables de entorno (frontend)

Archivo de referencia: `web/.env.local.example`

| Variable | Visible en navegador | Uso |
|----------|----------------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URLs de imágenes Storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Lectura pública (si se usa cliente browser) |
| `DEEPSEEK_API_KEY` | **No** | Solo servidor (API routes) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | **No** | Embeddings de consulta (servidor) |

---

## 7. Desarrollo local

```powershell
cd c:\Users\isela\AndroidStudioProjects\appplantas\web
copy .env.local.example .env.local
# Completar variables
npm install
npm run dev
```

Abrir http://localhost:3000

**Build de producción:**

```powershell
npm run build
npm run start
```

---

## 8. Despliegue en Vercel

Guía completa: [`DEPLOY_VERCEL.md`](./DEPLOY_VERCEL.md)

**Resumen:**

1. Proyecto Vercel vinculado a `Isela-ux/farmaciaviva`
2. **Root Directory:** `web`
3. Variables: `NEXT_PUBLIC_SUPABASE_*`, `DEEPSEEK_API_KEY`, opcional `GOOGLE_GENERATIVE_AI_API_KEY`
4. Cada `git push` a `master` despliega automáticamente

**Verificación post-deploy:**

```powershell
cd web
npm run prod:validar
```

---

## 9. Pruebas desde el frontend

### Automáticas (no requieren navegador)

```powershell
cd web
npm run medico:pruebas   # 23/23 — flujo agente
```

### Manuales en producción

| Acción | Resultado esperado |
|--------|-------------------|
| `me siento mal y no sé qué me pasa` | Opciones del árbol (sin plantas) |
| `Dolor` → `De cabeza` | Triaje, luego recomendación |
| `sangrado abundante` | Alerta urgente, sin plantas |
| `¿para qué sirve la manzanilla?` | Respuesta + tarjetas |

---

## 10. Organización del repositorio (frontend)

```
web/
├── src/app/                 # Rutas y layouts
├── src/components/          # Componentes React
├── src/hooks/               # useMedicoGuia
├── src/lib/                 # Lógica compartida (árbol, guardrails, RAG cliente)
├── src/types/database.ts    # Tipos TypeScript de Supabase
├── scripts/                 # medico-conversacion-pruebas.ts
├── public/                  # Assets estáticos
├── package.json
├── vercel.json
└── .env.local.example
```

**No subir a Git:** `.env.local`, `.vercel/`, `node_modules/`, `.next/`

---

## 11. Evidencias Semana 8 (Alumno A)

- [ ] Captura `/catalogo` en producción
- [ ] Captura `/asistente` con opciones del árbol visibles
- [ ] Captura alerta de guardrail (`sangrado abundante`)
- [ ] Captura dashboard Vercel (deploy Ready)
- [ ] Captura `npm run build` exitoso

Guardar en: `evidencia/semana8/alumno-a/`

---

## 12. Referencias

| Documento | Enlace |
|-----------|--------|
| Despliegue Vercel | [`DEPLOY_VERCEL.md`](./DEPLOY_VERCEL.md) |
| Arquitectura Médico Virtual | [`ARQUITECTURA_MEDICO_VIRTUAL.md`](./ARQUITECTURA_MEDICO_VIRTUAL.md) |
| Inventario inicial (S1) | [`INVENTARIO_FRONTEND.md`](./INVENTARIO_FRONTEND.md) |
| Entregables S8 índice | [`SEMANA_8_ENTREGABLES.md`](./SEMANA_8_ENTREGABLES.md) |
