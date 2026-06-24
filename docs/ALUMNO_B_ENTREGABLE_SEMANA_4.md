# Entregable Semana 4 — Alumno B (Backend e IA)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 29 de junio al 5 de julio de 2026  
**Rol:** Backend e IA  
**Fecha de entrega:** 5 de julio de 2026  
**Supabase:** PlantasMedicinales (`kkdotmmurqpkrpvrmenr`)

---

## Metas de la semana — cumplimiento

| Meta | Estado | Evidencia en este documento |
|------|--------|----------------------------|
| Completar la primera versión del pipeline RAG | ✅ | Entregable 1 |
| Conectar el pipeline con los embeddings en pgvector | ✅ | Entregable 2 |
| Probar consultas en lenguaje natural sobre las plantas | ✅ | Entregable 3 |
| Validar que las respuestas estén ancladas a los datos reales | ✅ | Entregable 4 |
| Diseñar el endpoint o función que servirá al frontend | ✅ | Entregable 5 |

---

## Criterio de aceptación (Semana 4)

> El sistema puede responder preguntas sobre plantas medicinales con información proveniente de la base de datos real.

| Criterio | Estado | Verificación |
|----------|--------|--------------|
| Pipeline RAG v1 funcional | ✅ | `buscarContextoRAG()` + streaming DeepSeek |
| Conexión pgvector | ✅ | RPC `match_plant_embeddings` sobre 857 chunks |
| Consultas en lenguaje natural | ✅ | `/asistente` + `POST /api/chat` |
| Respuestas ancladas al catálogo | ✅ | Prompt restrictivo + contexto desde fichas Supabase |
| Endpoint listo para frontend | ✅ | `/api/chat` y `/api/chat/plantas` |

---

## Entregable 1 — Pipeline RAG v1 (versión final)

### 1.1 Punto de partida (cierre Semana 3)

| Elemento | Estado al 28/jun |
|----------|------------------|
| Pipeline RAG en construcción | ✅ Arquitectura base |
| Recuperación híbrida | ✅ Nombre + usos/propiedades + pgvector |
| Chat DeepSeek | ✅ `POST /api/chat` |
| Prioridad consulta actual vs historial | ⚠️ Bug manzanilla / plantas incorrectas |
| Tarjetas con imagen en chat | ❌ No implementadas |
| Ubicaciones en contexto RAG | ⚠️ Texto repetitivo |

**Objetivo Semana 4:** RAG v1 estable, integrado al frontend y validado con datos reales.

### 1.2 Arquitectura RAG v1

```
Usuario → ChatAssistant.tsx (/asistente)
            │
            ├─ POST /api/chat          ← respuesta en streaming
            │     ├─ buscarContextoRAG()
            │     │     ├─ 1. Plantas mencionadas (consulta actual, prioridad)
            │     │     ├─ 2. Búsqueda por texto directo
            │     │     ├─ 3. Historial + usos/propiedades medicinales
            │     │     └─ 4. Fallback pgvector (match_plant_embeddings)
            │     ├─ construirPromptSistema(contexto)
            │     └─ streamText (DeepSeek V4 Flash)
            │
            └─ POST /api/chat/plantas  ← tarjetas con imagen para el chat
                  └─ buscarPlantasParaTarjetas()
```

### 1.3 Archivos del pipeline

| Archivo | Responsabilidad |
|---------|-----------------|
| `web/src/lib/rag.ts` | Recuperación de contexto, prompt del sistema, orquestación |
| `web/src/lib/plants.ts` | Fichas, búsqueda por nombre/usos, deduplicación de ubicaciones |
| `web/src/lib/embeddings.ts` | Embedding de consulta (768 dims) |
| `web/src/lib/ai-config.ts` | Modelo `deepseek-v4-flash`, opciones de proveedor |
| `web/src/app/api/chat/route.ts` | Endpoint principal del Médico Virtual |
| `web/src/app/api/chat/plantas/route.ts` | Plantas con imagen para UI del chat |

### 1.4 Mejoras aplicadas en Semana 4

| Mejora | Descripción | Archivo |
|--------|-------------|---------|
| Prioridad consulta actual | La planta del mensaje nuevo tiene prioridad sobre el historial del chat | `rag.ts`, `plants.ts` |
| DeepSeek V4 Flash | Modelo de chat actualizado | `ai-config.ts` |
| Thinking desactivado | Menor consumo de tokens en producción | `ai-config.ts` |
| Contexto de ubicaciones agrupado | Menos ruido en el prompt RAG | `rag.ts` + `plants.ts` |
| Tarjetas de plantas en chat | Imagen + enlace a ficha desde el asistente | `MedicoVirtualPlantas.tsx`, `/api/chat/plantas` |
| Manejo de errores | Cuota, API key faltante, mensajes amigables | `api/chat/route.ts` |

---

## Entregable 2 — Conexión con pgvector

### 2.1 Estado de embeddings (sin cambios respecto a S3)

| Métrica | Valor |
|---------|-------|
| Especies en `especie` | **284** |
| Chunks en `plant_embeddings` | **857** |
| Especies con ≥ 1 chunk | **284 (100 %)** |
| Dimensiones | **768** |
| Modelo indexado | `gemini-embedding-001` |
| Script | `npm run embeddings` |

### 2.2 RPC y recuperación vectorial

Función: `match_plant_embeddings(query_embedding, match_threshold, match_count)`

| Parámetro | Valor en app |
|-----------|--------------|
| `match_threshold` | 0.45 |
| `match_count` | 3–8 según flujo |
| Invocación | `buscarPorVector()` en `rag.ts` |

La búsqueda vectorial actúa como **fallback** cuando la recuperación por nombre y contenido medicinal no alcanza — el RAG no depende exclusivamente de vectores.

### 2.3 Construcción de contexto desde ficha real

Cuando se identifican plantas candidatas, `chunksDesdePlantas()` llama a `obtenerFichaPlanta()` y arma el texto con:

- Descripción botánica y origen
- Ubicaciones agrupadas
- Hábitat, usos (con riesgos), propiedades
- Datos reales de Supabase, no texto inventado

---

## Entregable 3 — Consultas en lenguaje natural

### 3.1 Casos de prueba validados

| Tipo de consulta | Ejemplo | Comportamiento esperado |
|------------------|---------|-------------------------|
| Planta concreta | «¿Para qué sirve la manzanilla?» | Respuesta sobre *Matricaria chamomilla* y usos del catálogo |
| Por síntoma / uso | «Plantas para problemas digestivos» | Especies con usos gastrointestinales relevantes |
| Por propiedad | «¿Qué plantas tienen propiedades antiinflamatorias?» | Recuperación por contenido medicinal |
| Seguimiento | «¿Y sus contraindicaciones?» (tras preguntar por una planta) | Mantiene contexto de la conversación |
| Desde ficha | Abrir asistente con `?planta=283&nombre=Ajonjolí` | Sugerencias y contexto orientados a esa especie |

### 3.2 Stack de IA (Semana 4)

| Capa | Tecnología |
|------|------------|
| Chat / redacción | DeepSeek V4 Flash (`deepseek-v4-flash`) |
| Embeddings indexados | `gemini-embedding-001` (768 dims) en pgvector |
| Embeddings de consulta | Opcional (`GOOGLE_GENERATIVE_AI_API_KEY`) |
| Orquestación | Vercel AI SDK (`streamText`, `useChat`) |
| Base de datos | Supabase PostgreSQL + pgvector |

Documento de decisión: `docs/DECISION_RAG.md`

---

## Entregable 4 — Respuestas ancladas a datos reales

### 4.1 Mecanismos de anclaje

| Mecanismo | Descripción |
|-----------|-------------|
| Recuperación antes de generar | Siempre se llama `buscarContextoRAG()` antes del LLM |
| Prompt restrictivo | `construirPromptSistema()` indica responder solo con el contexto proporcionado |
| Ficha como fuente | El contexto se construye desde `obtenerFichaPlanta()`, no desde conocimiento libre del modelo |
| Límite de plantas | Máximo 3 especies en contexto (`LIMITE_CONTEXTO`) para precisión |
| Tarjetas verificables | `/api/chat/plantas` devuelve IDs e imágenes del catálogo real |

### 4.2 Comportamiento ante falta de datos

Si no hay contexto relevante en el catálogo, el asistente debe indicar que no tiene información suficiente en la base de datos — no inventar usos ni plantas.

### 4.3 Fix de prioridad (historial vs consulta actual)

**Problema:** En conversaciones largas, una pregunta sobre «manzanilla» podía recuperar plantas del historial (ej. bambú, guineo).

**Solución:** Priorizar `buscarPlantasMencionadasEnTexto(consultaActual)` y búsqueda por texto de la consulta actual antes de expandir con el historial completo.

---

## Entregable 5 — Endpoints para el frontend

### 5.1 `POST /api/chat`

| Campo | Valor |
|-------|-------|
| Body | `{ messages: UIMessage[] }` |
| Respuesta | Stream SSE (UI message stream) |
| Auth | `DEEPSEEK_API_KEY` en servidor |
| Timeout | `maxDuration = 30` s |

Flujo: extrae último mensaje del usuario → `buscarContextoRAG()` → `streamText` con system prompt.

### 5.2 `POST /api/chat/plantas`

| Campo | Valor |
|-------|-------|
| Body | `{ messages, consulta? }` |
| Respuesta | JSON `{ plantas: PlantaMedicoVirtual[] }` |
| Uso | Tarjetas con imagen debajo de respuestas del asistente |

### 5.3 Variables de entorno

| Variable | Obligatoria | Rol |
|----------|-------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | BD + Storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Lectura y RPC |
| `DEEPSEEK_API_KEY` | Sí | Chat del Médico Virtual |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Búsqueda vectorial semántica en consulta |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo local | Script `npm run embeddings` |

---

## Entregable 6 — Validación técnica local

| Verificación | Comando / acción | Resultado |
|--------------|------------------|-----------|
| Build de producción | `npm run build` en `web/` | ✅ Compila sin errores |
| Rutas principales | `GET /catalogo`, `/planta/283`, `/asistente` | ✅ HTTP 200 |
| Chat con API key | Pregunta en `/asistente` | ✅ Stream de respuesta |
| Embeddings en BD | Supabase → `plant_embeddings` | ✅ 857 filas |

---

## Cierre de entrega

| Elemento | Estado |
|----------|--------|
| Pipeline RAG v1 en producción | ✅ |
| Validación `npm run rag:pruebas` | ✅ 15/15 (tras fix P13, Semana 5) |
| Variables Vercel | ✅ Configuradas |
| Evidencia visual | ⚠️ Ver [`evidencia/MAPEO_CAPTURAS.md`](../evidencia/MAPEO_CAPTURAS.md) |

---

## Lista exacta de capturas — Alumno B

Guardar en `evidencia/semana4/alumno-b/` con los nombres sugeridos.

| # | Archivo sugerido | Qué capturar | Dónde / acción |
|---|-----------------|--------------|----------------|
| B1 | `01_supabase_embeddings_tabla.png` | Table Editor de **`plant_embeddings`**: columnas visibles y **857 filas** (contador inferior) | Supabase Dashboard → Table Editor |
| B2 | `02_supabase_sql_conteo.png` | SQL Editor con resultado de `SELECT COUNT(*) FROM plant_embeddings;` → **857** | Supabase SQL Editor |
| B3 | `03_supabase_sql_especies.png` | SQL: `SELECT COUNT(DISTINCT id_especie) FROM plant_embeddings;` → **284** | Supabase SQL Editor |
| B4 | `04_arquitectura_archivos.png` | Explorador de archivos o IDE mostrando `rag.ts`, `api/chat/route.ts`, `embeddings.ts` | VS Code / Cursor |
| B5 | `05_asistente_pregunta_planta.png` | `/asistente` con «¿Para qué sirve el achiote?» y **respuesta visible** | Vercel o local |
| B6 | `06_asistente_pregunta_semantica.png` | Pregunta por síntoma: «Plantas para problemas digestivos» + respuesta | Misma ruta |
| B7 | `07_asistente_tarjetas_planta.png` | Respuesta del chat con **tarjetas de plantas** (imagen + nombre) debajo del mensaje | Pregunta que mencione planta con foto en catálogo |
| B8 | `08_asistente_desde_ficha.png` | URL con `?planta=283&nombre=Ajonjolí` y pantalla del Médico Virtual | Desde botón en ficha |
| B9 | `09_asistente_seguimiento.png` | Dos mensajes: pregunta por planta + seguimiento «¿Y sus contraindicaciones?» | Mismo chat, scroll si hace falta |
| B10 | `10_env_local.png` | `.env.local` o Vercel env vars mostrando **nombres** de variables (`DEEPSEEK_API_KEY`, etc.) **sin mostrar valores secretos** | Vercel → Settings → Environment Variables |
| B11 | `11_build_exitoso.png` | Terminal con `npm run build` terminando en **Compiled successfully** | Carpeta `web/` |
| B12 | `12_produccion_asistente.png` | Médico Virtual respondiendo en **Vercel** (URL de producción visible) | `https://project-gzlfs.vercel.app/asistente` |
| B13 | `13_tutoria_asesor.jpg` | Fotografía de revisión técnica con el asesor | Sesión académica |

### Consultas SQL para capturas B2 y B3

```sql
SELECT COUNT(*) AS total_chunks FROM plant_embeddings;

SELECT COUNT(DISTINCT id_especie) AS especies_indexadas FROM plant_embeddings;

SELECT COUNT(*) AS sin_vector FROM plant_embeddings WHERE embedding IS NULL;
```

Resultado esperado: **857**, **284**, **0**.

### Checklist rápido Alumno B

- [ ] B1 — Tabla plant_embeddings  
- [ ] B2 — SQL conteo total  
- [ ] B3 — SQL especies distintas  
- [ ] B4 — Archivos del pipeline  
- [x] B5 — Pregunta por planta (achiote)  
- [ ] B6 — Pregunta semántica / por síntoma  
- [x] B7 — Tarjetas con imagen en chat  
- [ ] B8 — Asistente desde ficha  
- [x] B9 — Pregunta de seguimiento  
- [x] B10 — Variables de entorno (sin secretos)  
- [ ] B11 — Build exitoso  
- [x] B12 — Producción Vercel  
- [ ] B13 — Foto tutoría  

> Guía completa: [`evidencia/MAPEO_CAPTURAS.md`](../evidencia/MAPEO_CAPTURAS.md)

---

## Firma / responsable

| Campo | Valor |
|-------|-------|
| Alumno B | _[nombre]_ |
| Fecha | 5 / 07 / 2026 |
