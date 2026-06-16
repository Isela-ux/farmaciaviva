# Entregable Semana 1 — Alumno B (Backend e IA)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 12–14 de junio de 2026  
**Rol:** Backend e IA  
**Fecha de entrega:** 15 de junio de 2026  
**Supabase:** PlantasMedicinales

---

## Metas de la semana — cumplimiento

| Meta | Estado | Evidencia en este documento |
|------|--------|----------------------------|
| Revisar estado de embeddings en pgvector (~30 %) | ✅ | Sección 1 |
| Revisar prototipo de asistente IA (~20 %) | ✅ | Sección 2 |
| Investigar opciones RAG (LangChain, LlamaIndex, Vercel AI SDK, pgvector) | ✅ | Sección 3 |
| Evaluar compatibilidad con Supabase y Next.js | ✅ | Sección 4 |
| Documentar decisión técnica con justificación | ✅ | Sección 5 |

---

## Entregable 1 — Reporte de evaluación de opciones RAG

### Contexto

Farmacia Viva necesita un módulo de consultas en lenguaje natural sobre ~284 especies medicinales. Los datos viven en **Supabase (PostgreSQL)** con texto estructurado en tablas relacionales. El frontend es **Next.js** desplegado en **Vercel**. Los recursos deben ser **públicos y gratuitos**.

### Opciones evaluadas

#### Opción A — Vercel AI SDK + pgvector directo en Supabase

| Criterio | Evaluación |
|----------|------------|
| Descripción | SDK oficial de Vercel para streaming + embeddings y retrieval vía RPC en Supabase |
| Pros | Integración nativa con Next.js y Vercel; pocas dependencias; streaming listo; Gemini gratuito |
| Contras | Prompt engineering y lógica de retrieval manual |
| Compatibilidad Supabase | ✅ Alta — pgvector en PostgreSQL |
| Compatibilidad Next.js | ✅ Alta — API Routes + Server Components |
| Coste | Gratuito (tier Gemini + Supabase free) |
| Complejidad | Media-baja |

#### Opción B — LangChain (JavaScript)

| Criterio | Evaluación |
|----------|------------|
| Descripción | Framework con abstracciones para chains, agents y vector stores |
| Pros | Ecosistema amplio; muchos conectores; documentación extensa |
| Contras | Pesado para MVP; muchas dependencias; curva de aprendizaje; overkill para catálogo relacional |
| Compatibilidad Supabase | Media — requiere adaptador vector store |
| Compatibilidad Next.js | Media — posible pero más capas |
| Coste | Gratuito (librería) + API del LLM |
| Complejidad | Alta |

#### Opción C — LlamaIndex (TypeScript)

| Criterio | Evaluación |
|----------|------------|
| Descripción | Framework orientado a indexación y retrieval de documentos |
| Pros | Bueno para corpus documental; pipelines de indexación |
| Contras | Más orientado a Python; setup mayor en Node; exceso para datos ya en tablas SQL |
| Compatibilidad Supabase | Media |
| Compatibilidad Next.js | Media |
| Coste | Gratuito (librería) + API del LLM |
| Complejidad | Alta |

#### Opción D — Implementación directa con pgvector (sin SDK de IA)

| Criterio | Evaluación |
|----------|------------|
| Descripción | Fetch manual a Supabase RPC + llamadas REST a Gemini sin abstracciones |
| Pros | Control total; cero dependencias de frameworks |
| Contras | Más código propio; sin streaming estándar; reinventar patrones |
| Compatibilidad Supabase | ✅ Alta |
| Compatibilidad Next.js | ✅ Alta |
| Coste | Gratuito |
| Complejidad | Media-alta (más código manual) |

#### Opción E — Solo búsqueda por palabras clave (sin vectores)

| Criterio | Evaluación |
|----------|------------|
| Descripción | Filtrar `nombre_comun` y campos de texto sin embeddings |
| Pros | Sin coste de API; implementación simple |
| Contras | No responde preguntas semánticas ("plantas para el estómago") |
| Compatibilidad | ✅ Total |
| Coste | Gratis |
| Complejidad | Baja |

### Matriz comparativa resumida

| Opción | Next.js | Supabase | Semántica | Simplicidad | **Recomendación** |
|--------|---------|----------|-----------|-------------|-------------------|
| A — Vercel AI SDK + pgvector | ✅ | ✅ | ✅ | ✅ | **Seleccionada** |
| B — LangChain | ⚠️ | ⚠️ | ✅ | ❌ | Descartada (complejidad) |
| C — LlamaIndex | ⚠️ | ⚠️ | ✅ | ❌ | Descartada (complejidad) |
| D — pgvector directo | ✅ | ✅ | ✅ | ⚠️ | Alternativa válida |
| E — Solo keywords | ✅ | ✅ | ❌ | ✅ | Fallback únicamente |

---

## Entregable 2 — Decisión técnica documentada y justificada

### Decisión

**Stack RAG seleccionado:**

```
Vercel AI SDK + Google Gemini + pgvector en Supabase
```

### Justificación

1. **Alineación con stack base del proyecto:** Next.js (Vercel) + Supabase + recursos gratuitos.
2. **pgvector en Supabase:** Los datos ya están en PostgreSQL; no se requiere vector store externo (Pinecone, etc.).
3. **Vercel AI SDK:** Streaming nativo en `/api/chat`, compatible con React y App Router.
4. **Google Gemini (gratuito):**
   - Chat: `gemini-2.5-flash`
   - Embeddings: `gemini-embedding-001` (768 dimensiones)
5. **Menor complejidad que LangChain/LlamaIndex** para un catálogo de ~284 especies con chunks estructurados desde tablas SQL.
6. **Estrategia híbrida:** pgvector + búsqueda por palabras clave + memoria de conversación como capas complementarias.

### Arquitectura implementada

```
Usuario (/asistente)
    ↓
POST /api/chat
    ↓
1. Resolver consulta con historial de conversación
2. ¿Planta identificada? → Cargar ficha completa desde Supabase
    ↓ (si no)
3. embed(consulta) → Gemini
4. RPC match_plant_embeddings → pgvector
    ↓ (si vacío)
5. Búsqueda por palabras clave en catálogo
    ↓
6. streamText(contexto + Gemini gemini-2.5-flash)
```

### Componentes en el repositorio

| Componente | Ubicación |
|------------|-----------|
| Migración pgvector | `supabase/migrations/001_pgvector_embeddings.sql` |
| Script de embeddings | `supabase/scripts/generate-embeddings.mjs` |
| Módulo RAG | `web/src/lib/rag.ts` |
| API del asistente | `web/src/app/api/chat/route.ts` |
| Capa de datos | `web/src/lib/plants.ts` |
| Cliente Supabase | `web/src/lib/supabase/` |

---

## Entregable 3 — Inventario del estado actual de embeddings y backend

### 1.1 Estado inicial vs. estado actual (embeddings ~30 %)

| Momento | Estado |
|---------|--------|
| **Inicio semana 1** | ~30 % — corpus de datos rico en Supabase (usos, propiedades, descripciones) pero **sin infraestructura vectorial** |
| **Cierre semana 1** | **100 %** — pgvector operativo + **857 chunks** indexados para **284 especies** |

El 30 % inicial correspondía al **corpus de texto embeddable** ya poblado en tablas relacionales, no a vectores generados.

### 1.2 Infraestructura pgvector

| Elemento | Estado |
|----------|--------|
| Extensión `vector` | ✅ Habilitada |
| Tabla `plant_embeddings` | ✅ Creada (768 dims) |
| Función `match_plant_embeddings` | ✅ Operativa |
| RLS lectura pública (anon) | ✅ |
| RLS escritura (service_role) | ✅ |
| Índice IVFFlat | ✅ |

### 1.3 Métricas de indexación (15 jun 2026)

| Métrica | Valor |
|---------|-------|
| Especies en `especie` | 284 |
| Nombres comunes | 289 |
| Chunks en `plant_embeddings` | **857** |
| Cobertura del catálogo | **100 %** |
| Tipos de chunk | `botanica`, `nombre_comun`, `uso`, `propiedad` |

**Comandos utilizados:**

```bash
cd web
npm run embeddings:test    # prueba: 10 especies
npm run embeddings         # catálogo completo → 857 chunks
```

### 1.4 Base de datos — tablas en uso

| Tabla | Rol en el sistema |
|-------|-------------------|
| `especie` | Datos botánicos principales |
| `nombre_comun` | Catálogo y búsqueda |
| `imagen_especie` | Imágenes en UI |
| `uso_planta` | Usos medicinales (RAG) |
| `especie_propiedad` / `propiedad` | Propiedades |
| `especie_compuesto` / `compuesto_activo` | Compuestos |
| `especie_habitat` / `habitat` | Hábitat |
| `especie_ubicacion` / `ubicacion_geografica` | Distribución |
| `detalle_fuente_especie` / `fuente` | Bibliografía |
| `plant_embeddings` | Vectores para RAG semántico |

### 1.5 Prototipo de asistente IA (~20 % inicial → ~70 % actual)

| Momento | Estado |
|---------|--------|
| **Inicio semana 1** | ~20 % — datos estructurados listos como fuente RAG, **sin chat ni retrieval** |
| **Cierre semana 1** | ~70 % — asistente funcional con RAG híbrido |

| Característica | Estado |
|----------------|--------|
| UI chat `/asistente` | ✅ |
| API streaming `/api/chat` | ✅ |
| Retrieval pgvector | ✅ |
| Búsqueda por palabras clave (fallback) | ✅ |
| Memoria de conversación (preguntas de seguimiento) | ✅ |
| Ficha completa en contexto | ✅ |

### 1.6 Compatibilidad Supabase + Next.js — verificación

| Prueba | Resultado |
|--------|-----------|
| Lectura catálogo con anon key | ✅ |
| SSR con `@supabase/ssr` | ✅ |
| RPC `match_plant_embeddings` desde servidor | ✅ |
| Escritura embeddings con service_role | ✅ |
| Streaming Gemini desde API Route | ✅ |
| Build de producción (`npm run build`) | ✅ |

### 1.7 Variables de entorno configuradas

| Variable | Propósito |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Lectura pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Script de embeddings (solo servidor/scripts) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Chat + embeddings |

### 1.8 Riesgos identificados

| Riesgo | Mitigación aplicada |
|--------|---------------------|
| Proyecto Supabase pausado por inactividad | Reactivar desde dashboard |
| Cuota Gemini en modelos antiguos | Migrar a `gemini-2.5-flash` |
| Preguntas de seguimiento sin contexto | Historial de conversación en RAG |
| service_role expuesta | Solo en `.env.local`, nunca en cliente ni Git |

### 1.9 Pendientes post-semana 1

| Tarea | Prioridad |
|-------|-----------|
| Deploy en Vercel | Alta |
| Monitoreo de cuota Gemini en producción | Media |
| Afinar umbral de similitud en `match_plant_embeddings` | Baja |

---

## Evidencia sugerida (Alumno B)

- [ ] Captura Table Editor: `plant_embeddings` con **857 filas**
- [ ] Captura SQL Editor: migración `001_pgvector_embeddings.sql` ejecutada
- [ ] Captura `/asistente` con consulta semántica (ej. "plantas para el estómago")
- [ ] Este documento + `docs/DECISION_RAG.md` como anexo técnico

---

## Firma / responsable

| Campo | Valor |
|-------|-------|
| Alumno B | _[nombre]_ |
| Fecha | 15 / 06 / 2026 |
