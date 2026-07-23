# Documentación técnica del backend y módulo RAG — Semana 8

**Proyecto:** Farmacia Viva · VIC 2026  
**Responsable:** Alumno B (Backend e IA)  
**Backend:** Supabase (PostgreSQL + pgvector)  
**IA:** Vercel AI SDK + DeepSeek (generación) + Google Gemini (embeddings)  
**Supabase:** PlantasMedicinales (`kkdotmmurqpkrpvrmenr`)

---

## 1. Resumen ejecutivo

El backend del proyecto web **no es un servidor aparte**: es **Supabase** como base de datos y **Next.js API Routes** como capa de aplicación desplegada en Vercel. El módulo de IA implementa **RAG híbrido** (búsqueda SQL + pgvector + fallback textual) y un **agente multi-fase** (Médico Virtual) con guardrails y validación de salida.

| Métrica | Valor |
|---------|-------|
| Especies en catálogo | 284 |
| Chunks en `plant_embeddings` | 857 |
| Dimensiones embedding | 768 |
| Modelo de chat (prod) | DeepSeek `deepseek-chat` |
| Modelo embeddings | Google `gemini-embedding-001` |

---

## 2. Arquitectura del backend

```text
                    Vercel Serverless (Next.js API)
┌──────────────────────────────────────────────────────────┐
│  POST /api/chat          → Chat libre RAG + streaming    │
│  POST /api/chat/guia     → Triaje + recomendación        │
│  POST /api/chat/plantas  → Tarjetas con imágenes         │
└────────────────────────────┬─────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   lib/rag.ts          lib/plants.ts      lib/medico-agentes.ts
   lib/embeddings.ts   validar-salida     guardrails-*
         │                   │                   │
         └───────────────────┼───────────────────┘
                             ▼
              Supabase PostgreSQL + pgvector
         ┌─────────────────────────────────────┐
         │ especie, uso_planta, propiedad, …     │
         │ plant_embeddings (857 filas)          │
         │ RPC: match_plant_embeddings           │
         └─────────────────────────────────────┘
                             │
                             ▼
                    DeepSeek API (generación)
                    Google AI (embedding consulta)
```

---

## 3. Base de datos — tablas principales

| Tabla | Registros (aprox.) | Rol |
|-------|-------------------|-----|
| `especie` | 284 | Datos botánicos |
| `nombre_comun` | 289 | Nombres para catálogo y búsqueda |
| `imagen_especie` | — | Fotos (Storage URLs) |
| `uso_planta` | — | Usos medicinales (RAG + recomendación) |
| `especie_propiedad` / `propiedad` | — | Propiedades terapéuticas |
| `especie_compuesto` / `compuesto_activo` | — | Compuestos activos |
| `especie_habitat` / `habitat` | — | Hábitat |
| `especie_ubicacion` / `ubicacion_geografica` | — | Distribución |
| `detalle_fuente_especie` / `fuente` | — | Bibliografía |
| **`plant_embeddings`** | **857** | Vectores para RAG semántico |

**Cliente Supabase en código:**

- `web/src/lib/supabase/server.ts` — lectura en API routes (SSR)
- `web/src/lib/supabase/client.ts` — cliente browser (limitado)
- `web/src/lib/supabase/config.ts` — validación de env

---

## 4. Pipeline RAG

### 4.1 Flujo de recuperación (`web/src/lib/rag.ts`)

```text
Consulta del usuario (+ historial opcional)
    │
    ├─ 1. ¿Seguimiento de planta en conversación?
    │      → Cargar ficha completa (obtenerFichaPlanta)
    │
    ├─ 2. Búsqueda por contenido medicinal (SQL usos/propiedades)
    │
    ├─ 3. Búsqueda pgvector (match_plant_embeddings)
    │      → Requiere embedding de consulta (Google API)
    │
    ├─ 4. Fallback búsqueda textual (buscarPlantasPorTexto)
    │
    └─ 5. Construir prompt sistema (construirPromptSistema)
           → streamText con DeepSeek
```

### 4.2 Parámetros RAG (`web/src/lib/ai-config.ts`)

| Parámetro | Valor típico | Descripción |
|-----------|--------------|-------------|
| `RAG_VECTOR_MATCH_THRESHOLD` | 0.5 | Umbral similitud coseno |
| `RAG_VECTOR_MATCH_COUNT` | 8 | Máx. chunks vectoriales |
| `RAG_CONTEXTO_LIMITE` | — | Fragmentos en prompt |

### 4.3 Decisiones técnicas

Documento completo: [`DECISION_RAG.md`](./DECISION_RAG.md)

| Decisión | Razón |
|----------|-------|
| Vercel AI SDK + pgvector directo | Menos capas que LangChain; integración nativa Next.js |
| DeepSeek para chat | Mejor coste/cuota que solo Gemini en generación |
| Mantener embeddings Gemini 768d | Ya indexados; DeepSeek no expone API embeddings |
| RAG híbrido | Funciona aunque falle embedding de consulta |
| Validación de salida | Evita plantas inventadas o fuera de contexto |

---

## 5. APIs del backend

### 5.1 `POST /api/chat` — Chat libre

**Archivo:** `web/src/app/api/chat/route.ts`

| Paso | Acción |
|------|--------|
| 1 | `evaluarFiltroEntrada` — off-topic / injection |
| 2 | `evaluarGuardrailClinico` — urgencias en chat libre |
| 3 | `buscarContextoRAG` |
| 4 | `streamText` → respuesta streaming al cliente |

### 5.2 `POST /api/chat/guia` — Médico Virtual

**Archivo:** `web/src/app/api/chat/guia/route.ts`

| Fase (`body.fase`) | Comportamiento |
|--------------------|----------------|
| `triaje` | LLM hace preguntas; actualiza `notasTriaje` |
| `recomendacion` | RAG + plantas rankeadas; `validarYSanitizarSalidaPlantas` |
| `consulta_planta` | Respuesta sobre planta con contexto RAG |

**Guardrails:** si `evaluarGuardrailClinico` → `urgente`, devuelve mensaje de escalamiento sin plantas.

### 5.3 `POST /api/chat/plantas` — Tarjetas UI

**Archivo:** `web/src/app/api/chat/plantas/route.ts`

Resuelve nombres mencionados en la respuesta del LLM a registros de `especie` con imagen. Opción `restringirAContextoRAG: true` para chat libre.

---

## 6. Módulo Médico Virtual (agente)

Arquitectura detallada: [`ARQUITECTURA_MEDICO_VIRTUAL.md`](./ARQUITECTURA_MEDICO_VIRTUAL.md)

| Capa | Archivo | Función |
|------|---------|---------|
| Filtro entrada | `filtro-entrada-agente.ts` | Dominio + anti-injection |
| Guardrails clínicos | `guardrails-clinicos.ts` | Sangrado, pecho, etc. |
| Guardrails árbol | `guardrails-arbol.ts` | Alarma al seleccionar hoja |
| Árbol | `arbol-padecimientos.ts` | Decisiones por síntoma |
| Orquestación | `useMedicoGuia.ts` + API guía | Fases del flujo |
| Validación salida | `validar-salida-plantas.ts` | Tarjetas ⊆ texto |
| Observabilidad | `agente-observabilidad.ts` | Logs estructurados |
| Errores | `agente-errores.ts` | Reintentos / escalamiento |
| Evals | `medico-conversacion-pruebas.ts` | **23 escenarios** |

---

## 7. Generación de embeddings

### 7.1 Script principal

**Archivo:** `supabase/scripts/generate-embeddings.mjs`

| Comando | Acción |
|---------|--------|
| `npm run embeddings:test` | 10 especies (prueba) |
| `npm run embeddings` | Catálogo completo (~857 chunks) |
| `npm run embeddings:validar` | Verifica conteo y dimensiones |

### 7.2 Tipos de chunk generados

| `chunk_type` | Origen |
|--------------|--------|
| `botanica` | Descripción botánica de `especie` |
| `nombre_comun` | Nombres comunes |
| `uso` | Filas de `uso_planta` |
| `propiedad` | Propiedades medicinales |

### 7.3 Embedding en tiempo de consulta

**Archivo:** `web/src/lib/embeddings.ts`

Genera vector 768d de la pregunta del usuario con Google Gemini para llamar a `match_plant_embeddings`. Si no hay API key, el sistema usa búsqueda SQL/texto.

### 7.4 Requisitos para re-indexar

```powershell
# En web/.env.local
SUPABASE_SERVICE_ROLE_KEY=...      # Solo local/scripts
GOOGLE_GENERATIVE_AI_API_KEY=...   # Generación de vectores

cd web
npm run embeddings
```

**Nunca** commitear `SUPABASE_SERVICE_ROLE_KEY`.

---

## 8. Migración pgvector

**Archivo:** `supabase/migrations/001_pgvector_embeddings.sql`

Crea:

- Extensión `vector`
- Tabla `plant_embeddings` (768 dimensiones)
- Índice IVFFlat
- Función RPC `match_plant_embeddings`
- Políticas RLS (lectura `anon`, escritura `service_role`)

Guía paso a paso: [`GUIA_CONFIGURACION_SUPABASE.md`](./GUIA_CONFIGURACION_SUPABASE.md)

---

## 9. Pruebas automatizadas

| Script | Comando | Esperado |
|--------|---------|----------|
| RAG recuperación | `npm run rag:pruebas` | 15/15 OK |
| Agente conversación | `npm run medico:pruebas` | 23/23 OK |
| Producción E2E | `npm run prod:validar` | JSON en `evidencia/semana7/` |
| Embeddings | `npm run embeddings:validar` | 857 chunks, 768 dims |

**Documentación de escenarios:**

- [`RAG_PRUEBAS.md`](./RAG_PRUEBAS.md)
- [`MEDICO_CONVERSACION_PRUEBAS.md`](./MEDICO_CONVERSACION_PRUEBAS.md)
- Escenarios JSON: `docs/medico-conversacion-escenarios.json`

---

## 10. Variables de entorno (backend)

| Variable | Obligatoria | Dónde |
|----------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Vercel + local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Vercel + local |
| `DEEPSEEK_API_KEY` | ✅ | Vercel + local |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ⚠️ Recomendada | Vercel + local |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo scripts | **Solo local** |

---

## 11. Organización del repositorio (backend / IA)

```
supabase/
├── migrations/
│   └── 001_pgvector_embeddings.sql
└── scripts/
    ├── generate-embeddings.mjs
    ├── validar-embeddings.mjs
    ├── rag-pruebas.mjs
    └── validar-produccion.mjs

web/src/
├── app/api/chat/           # API routes
├── lib/
│   ├── rag.ts              # Pipeline RAG
│   ├── embeddings.ts       # Embedding consulta
│   ├── plants.ts           # Acceso catálogo
│   ├── ai-config.ts        # Modelos y umbrales
│   ├── medico-agentes.ts   # Prompts triaje/recomendación
│   ├── guardrails-*.ts     # Seguridad clínica
│   ├── filtro-entrada-agente.ts
│   └── validar-salida-plantas.ts
└── scripts/
    └── medico-conversacion-pruebas.ts

docs/
├── DECISION_RAG.md
├── ARQUITECTURA_MEDICO_VIRTUAL.md
└── GUIA_CONFIGURACION_SUPABASE.md
```

---

## 12. Evidencias Semana 8 (Alumno B)

- [ ] Captura Supabase → Table Editor → `plant_embeddings` (857 filas)
- [ ] Captura `npm run rag:pruebas` → 15/15 OK
- [ ] Captura `npm run medico:pruebas` → 23/23 OK
- [ ] Captura SQL Editor con función `match_plant_embeddings`
- [ ] Captura asistente con recomendación + tarjetas alineadas

Guardar en: `evidencia/semana8/alumno-b/`

---

## 13. Referencias

| Documento | Enlace |
|-----------|--------|
| Configuración Supabase | [`GUIA_CONFIGURACION_SUPABASE.md`](./GUIA_CONFIGURACION_SUPABASE.md) |
| Decisión RAG | [`DECISION_RAG.md`](./DECISION_RAG.md) |
| Inventario inicial (S1) | [`INVENTARIO_BACKEND.md`](./INVENTARIO_BACKEND.md) |
| Pruebas producción | [`PRUEBAS_PRODUCCION.md`](./PRUEBAS_PRODUCCION.md) |
