# Entregable Semana 3 — Alumno B (Backend e IA)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 22–28 de junio de 2026  
**Rol:** Backend e IA  
**Fecha de entrega:** 28 de junio de 2026  
**Supabase:** PlantasMedicinales (`kkdotmmurqpkrpvrmenr`)

---

## Metas de la semana — cumplimiento

| Meta | Estado | Evidencia en este documento |
|------|--------|----------------------------|
| Completar los embeddings del catálogo en pgvector | ✅ | Entregable 1 |
| Validar integridad de todos los embeddings | ✅ | Entregable 2 |
| Comenzar la construcción del pipeline RAG | ✅ | Entregable 3 |
| Probar consultas semánticas básicas sobre pgvector | ✅ | Entregable 4 |

---

## Criterio de aceptación (Semana 3)

> Las plantas del catálogo disponible tienen embeddings en pgvector y el sistema puede responder consultas semánticas básicas.

| Criterio | Meta docente | Resultado real | Estado |
|----------|--------------|----------------|--------|
| Embeddings completos | 500 (referencia VIC) | **284 / 284 (100 %)** | ✅ |
| Chunks en pgvector | — | **857 filas** | ✅ |
| Integridad validada | Sin nulos / dims correctas | 768 dims, 100 % con vector | ✅ |
| Consultas semánticas básicas | RPC + recuperación en app | `match_plant_embeddings` + RAG híbrido | ✅ |
| Pipeline RAG en construcción | Arquitectura + primeras pruebas | `rag.ts` + `/api/chat` | ✅ |

> **Nota:** El cronograma cita ~500 plantas. Nuestro catálogo real tiene **284 especies**; se indexó el **100 %**, cumpliendo el espíritu del entregable con el dataset disponible.

---

## Entregable 1 — Embeddings completos del catálogo

### 1.1 Punto de partida (cierre Semana 2)

| Elemento | Estado al 21/jun |
|----------|------------------|
| Pipeline de embeddings | ✅ Funcional |
| Embeddings indexados | ✅ ~100 % (857 chunks) |
| Validación de calidad | ⚠️ Pruebas parciales |
| Pipeline RAG | ❌ No iniciado |
| Consultas semánticas en app | ❌ No conectadas al chat |

**Objetivo Semana 3:** confirmar integridad del 100 % del catálogo, conectar búsqueda semántica y comenzar el pipeline RAG.

### 1.2 Estado final de embeddings

| Métrica | Valor |
|---------|-------|
| Especies en `especie` | **284** |
| Chunks en `plant_embeddings` | **857** |
| Especies con ≥ 1 chunk | **284 (100 %)** |
| Dimensiones del vector | **768** |
| Modelo de embedding | `gemini-embedding-001` |
| Script | `supabase/scripts/generate-embeddings.mjs` |

### 1.3 Tipos de contenido indexado

Cada especie genera uno o más chunks con:

- Nombre común y científico
- Descripción botánica y origen
- Usos medicinales, preparación, contraindicaciones
- Propiedades y compuestos activos
- Hábitat y ubicación geográfica

Promedio: **~3 chunks por especie**.

---

## Entregable 2 — Validación de integridad

### 2.1 Checklist de integridad

| Verificación | Método | Resultado |
|--------------|--------|-----------|
| Conteo total de filas | Supabase Table Editor | 857 ✅ |
| Vectores no nulos | Columna `embedding` | 100 % ✅ |
| Dimensión 768 | Esquema `vector(768)` | ✅ |
| FK a `especie` | `id_especie` referenciado | ✅ |
| Sin duplicados inválidos | UNIQUE `(id_especie, chunk_type, content)` | ✅ |
| Índice IVFFlat | Migración aplicada | ✅ |
| RPC operativa | `match_plant_embeddings` | ✅ |

### 2.2 Consultas de validación (SQL)

Ejemplos ejecutables en Supabase SQL Editor:

```sql
-- Conteo total
SELECT COUNT(*) FROM plant_embeddings;

-- Especies distintas indexadas
SELECT COUNT(DISTINCT id_especie) FROM plant_embeddings;

-- Filas sin embedding
SELECT COUNT(*) FROM plant_embeddings WHERE embedding IS NULL;
```

Resultado esperado: **857 filas**, **284 especies**, **0 nulos**.

### 2.3 Pruebas de calidad semántica

| Consulta de prueba | Resultado esperado | Estado |
|--------------------|-------------------|--------|
| "manzanilla usos digestivos" | Especies con usos gastrointestinales | ✅ |
| "plantas antiinflamatorias" | Especies con propiedades relacionadas | ✅ |
| "Bixa orellana" | Achiote / datos de la especie | ✅ |
| "donde encontrar achiote" | Ubicación + nombre en contexto | ✅ |

---

## Entregable 3 — Pipeline RAG (construcción)

### 3.1 Arquitectura implementada

```
Usuario → POST /api/chat
            │
            ├─ buscarContextoRAG()  ← web/src/lib/rag.ts
            │     ├─ 1. Plantas mencionadas por nombre (texto)
            │     ├─ 2. Búsqueda por contenido medicinal (usos/propiedades)
            │     ├─ 3. Búsqueda por texto directo
            │     └─ 4. Fallback: pgvector (match_plant_embeddings)
            │
            ├─ construirPromptSistema(contexto)
            │
            └─ streamText (DeepSeek) → respuesta al frontend
```

### 3.2 Archivos del pipeline

| Archivo | Responsabilidad |
|---------|-----------------|
| `web/src/lib/rag.ts` | Recuperación de contexto + prompt del sistema |
| `web/src/lib/plants.ts` | Búsqueda por nombre, usos, propiedades |
| `web/src/lib/embeddings.ts` | Embedding de consulta (Gemini 768 dims) |
| `web/src/lib/ai-config.ts` | Modelo de chat (DeepSeek V4 Flash) |
| `web/src/app/api/chat/route.ts` | Endpoint streaming del Médico Virtual |
| `web/src/app/api/chat/plantas/route.ts` | Plantas con imagen para tarjetas del chat |

### 3.3 Stack RAG (Semana 3)

| Capa | Tecnología |
|------|------------|
| Recuperación híbrida | Nombre + usos/propiedades + pgvector |
| Vector store | pgvector en Supabase |
| Embeddings (indexados) | `gemini-embedding-001` (768 dims) |
| Chat / redacción | DeepSeek V4 Flash (`deepseek-v4-flash`) |
| Orquestación | Vercel AI SDK (`streamText`) |
| Frontend chat | `ChatAssistant.tsx` + `/asistente` |

Documento de decisión: `docs/DECISION_RAG.md`

### 3.4 Estado del pipeline al cierre de Semana 3

| Componente | Estado |
|------------|--------|
| Recuperación por nombre | ✅ |
| Recuperación por usos/propiedades | ✅ |
| Recuperación vectorial (pgvector) | ✅ |
| Prompt restringido al contexto | ✅ |
| Streaming de respuesta | ✅ |
| Historial de conversación | ✅ |
| Manejo de errores (cuota, API key) | ✅ |

> El pulido final del RAG v1 (tarjetas con imagen, prioridad de consulta actual, Médico Virtual pantalla completa) se documenta en Semana 4.

---

## Entregable 4 — Consultas semánticas básicas

### 4.1 RPC pgvector

Función: `match_plant_embeddings(query_embedding, match_threshold, match_count)`

| Parámetro | Valor en app |
|-----------|--------------|
| `match_threshold` | 0.45–0.5 |
| `match_count` | 3–8 |
| Similitud | Coseno (1 − distancia) |

Invocada desde `buscarPorVector()` en `rag.ts` cuando la búsqueda por texto no alcanza.

### 4.2 Recuperación híbrida (sin depender solo de vectores)

Para preguntas como *"plantas para el estómago"* o *"¿para qué sirve la manzanilla?"*:

1. **Prioridad:** planta mencionada en la consulta actual
2. **Fallback:** búsqueda en `uso_planta` y `propiedad` por términos medicinales
3. **Último recurso:** similitud vectorial con pgvector

### 4.3 Pruebas desde la aplicación

| Prueba | Endpoint / ruta | Estado |
|--------|-----------------|--------|
| Pregunta por planta concreta | `POST /api/chat` | ✅ |
| Pregunta por síntoma/uso | `POST /api/chat` | ✅ |
| Pregunta de seguimiento | Chat con historial | ✅ |
| Respuesta anclada al catálogo | Prompt + contexto RAG | ✅ |

Ejemplo verificado: *"¿Para qué sirve la manzanilla?"* → respuesta con *Matricaria chamomilla* y usos del catálogo.

---

## Entregable 5 — Variables de entorno

| Variable | Rol en Semana 3 |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Conexión BD + Storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Lectura catálogo y RPC |
| `SUPABASE_SERVICE_ROLE_KEY` | Script embeddings (solo local) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Embeddings de consulta (pgvector) |
| `DEEPSEEK_API_KEY` | Chat del Médico Virtual |

---

## Lo que queda para Semana 4

| Prioridad | Elemento |
|-----------|----------|
| Alta | RAG v1 pulido (tarjetas, prioridad consulta, UX chat) |
| Alta | Ficha completa integrada al flujo del asistente |
| Media | DeepSeek V4 Flash en producción (Vercel) |
| Baja | Afinar umbral de similitud vectorial |

---

## Evidencia sugerida (Alumno B)

- [ ] Captura Supabase: `plant_embeddings` con **857 filas**
- [ ] Captura SQL Editor: consulta de conteo / especies distintas
- [ ] Captura terminal: `npm run embeddings:test` o conteo final
- [ ] Captura `/asistente` con pregunta y respuesta del catálogo
- [ ] Captura de respuesta a pregunta semántica (ej. "plantas digestivas")
- [ ] Captura de estructura de archivos: `rag.ts`, `api/chat/route.ts`
- [ ] Captura Vercel: variables de entorno configuradas (sin mostrar valores)
- [ ] Fotografía de tutoría académica

---

## Firma / responsable

| Campo | Valor |
|-------|-------|
| Alumno B | _[nombre]_ |
| Fecha | 28 / 06 / 2026 |
