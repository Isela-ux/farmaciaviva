# Entregable Semana 2 — Alumno B (Backend e IA)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 15–21 de junio de 2026  
**Rol:** Backend e IA  
**Fecha de entrega:** 21 de junio de 2026  
**Supabase:** PlantasMedicinales (`kkdotmmurqpkrpvrmenr`)

---

## Metas de la semana — cumplimiento

| Meta | Estado | Evidencia en este documento |
|------|--------|----------------------------|
| Configurar el pipeline de generación de embeddings | ✅ | Entregable 1 |
| Procesar y cargar embeddings del primer lote de plantas | ✅ | Entregable 2 |
| Validar calidad de los embeddings generados | ✅ | Entregable 3 |
| Avanzar al menos al 60 % del total de embeddings | ✅ | Entregable 2 (100 %) |
| Documentar el proceso de generación | ✅ | Entregable 4 |

---

## Criterio de aceptación (Semana 2)

> El pipeline de embeddings funciona correctamente y al menos el 60 % de las plantas tienen embeddings en pgvector.

| Criterio | Meta docente | Resultado real | Estado |
|----------|--------------|----------------|--------|
| Pipeline funcional | Script ejecutable sin errores | `npm run embeddings` | ✅ |
| Plantas con embeddings | ≥ 60 % (~300 en cronograma) | **284 / 284 (100 %)** | ✅ |
| Chunks en pgvector | — | **857 filas** | ✅ |
| Documentación del proceso | Procedimiento reproducible | Este documento + README | ✅ |

> **Nota:** El cronograma cita ~500 plantas como referencia VIC. El catálogo disponible en Supabase tiene **284 especies**; se indexó el **100 %** del catálogo real, superando el 60 % exigido.

---

## Entregable 1 — Pipeline de generación de embeddings

### 1.1 Punto de partida (cierre Semana 1)

| Elemento | Estado al 15/jun |
|----------|------------------|
| Decisión de stack RAG | ✅ Vercel AI SDK + pgvector |
| Migración pgvector | ✅ Diseñada (`001_pgvector_embeddings.sql`) |
| Embeddings indexados | ⚠️ ~30 % estimado al inicio del verano |
| Script de indexación | ⚠️ En desarrollo |

**Objetivo Semana 2:** pipeline reproducible, primer lote cargado y avance ≥ 60 %.

### 1.2 Infraestructura pgvector

Archivo: `supabase/migrations/001_pgvector_embeddings.sql`

| Componente | Descripción |
|------------|-------------|
| Extensión `vector` | Habilitada en PostgreSQL |
| Tabla `plant_embeddings` | Vectores 768 dims + texto del chunk |
| Índice IVFFlat | Búsqueda por similitud coseno |
| RPC `match_plant_embeddings` | Consulta semántica desde la app |

Esquema de la tabla:

| Columna | Tipo | Uso |
|---------|------|-----|
| `id` | bigserial | PK |
| `id_especie` | integer | FK → `especie` |
| `chunk_type` | text | Tipo de fragmento (ej. `ficha_completa`) |
| `content` | text | Texto embeddable |
| `metadata` | jsonb | Nombre común, metadatos |
| `embedding` | vector(768) | Vector semántico |

### 1.3 Script de generación

Archivo: `supabase/scripts/generate-embeddings.mjs`

| Aspecto | Detalle |
|---------|---------|
| Modelo de embeddings | Google `gemini-embedding-001` (768 dimensiones) |
| Fuente de datos | Tablas Supabase (especie, usos, propiedades, etc.) |
| Escritura | `SUPABASE_SERVICE_ROLE_KEY` (solo servidor/scripts) |
| Comandos npm | `npm run embeddings` / `npm run embeddings:test` |

**Flujo del pipeline:**

```
1. Leer especies desde Supabase
2. Construir texto por especie (nombre, usos, propiedades, hábitat…)
3. Generar embedding con gemini-embedding-001 (768 dims)
4. Upsert en plant_embeddings (id_especie + chunk_type + content)
5. Repetir hasta completar catálogo
```

### 1.4 Comandos de ejecución

```bash
cd web

# Prueba con 10 especies
npm run embeddings:test
# equivalente: node ../supabase/scripts/generate-embeddings.mjs --limit=10

# Catálogo completo (284 especies → 857 chunks)
npm run embeddings
```

### 1.5 Variables de entorno requeridas

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Conexión a Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Escritura en `plant_embeddings` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Generación de vectores |

> El **chat** del Médico Virtual usa **DeepSeek** (`DEEPSEEK_API_KEY`); los **embeddings indexados** usan Gemini. Son capas separadas.

---

## Entregable 2 — Carga de embeddings y avance

### 2.1 Primer lote (validación)

| Paso | Acción | Resultado |
|------|--------|-----------|
| 1 | Ejecutar `--limit=10` | 10 especies indexadas sin error |
| 2 | Verificar filas en Table Editor | Chunks visibles en `plant_embeddings` |
| 3 | Probar RPC `match_plant_embeddings` | Similitud coseno operativa |

### 2.2 Carga completa del catálogo disponible

| Métrica | Valor |
|---------|-------|
| Especies en `especie` | **284** |
| Nombres comunes | 289 |
| Chunks en `plant_embeddings` | **857** |
| Especies con al menos 1 chunk | **284 (100 %)** |
| Avance vs. meta 60 % | **100 %** |
| Avance vs. meta 300 plantas | **284/300 = 94,7 %** (catálogo completo) |

### 2.3 Tipos de chunk generados

Cada especie puede producir varios chunks según la información disponible:

- Datos botánicos (descripción, origen)
- Usos medicinales y preparación
- Propiedades y compuestos
- Hábitat y ubicación geográfica

Promedio: ~3 chunks por especie → 857 total.

---

## Entregable 3 — Validación de calidad

### 3.1 Validaciones realizadas

| Prueba | Método | Resultado |
|--------|--------|-----------|
| Integridad de filas | Conteo en Supabase Table Editor | 857 filas |
| Dimensión de vectores | Columna `embedding vector(768)` | ✅ 768 dims |
| Sin embeddings nulos | Query `embedding is not null` | ✅ 100 % |
| RPC semántica | `match_plant_embeddings` con consulta de prueba | ✅ Retorna especies relacionadas |
| Búsqueda por nombre | `buscarPlantasPorTexto` en `plants.ts` | ✅ Fallback sin vectores |
| Recuperación RAG | `buscarContextoRAG` en `rag.ts` | ✅ Contexto coherente para el chat |

### 3.2 Consultas de prueba (ejemplos)

| Consulta | Comportamiento esperado | Estado |
|----------|-------------------------|--------|
| "¿Para qué sirve la manzanilla?" | Recupera *Matricaria chamomilla* o equivalente | ✅ |
| "Plantas para problemas digestivos" | Recupera especies con usos digestivos | ✅ |
| "Achiote" | Recupera *Bixa orellana* | ✅ |

### 3.3 Umbrales configurados

| Parámetro | Valor | Archivo |
|-----------|-------|---------|
| `match_threshold` | 0.45–0.5 | `rag.ts` / migración SQL |
| `match_count` | 3–8 | `rag.ts` |
| Dimensiones | 768 | Migración + script |

---

## Entregable 4 — Documentación del proceso

### 4.1 Procedimiento reproducible (resumen)

1. **Migración:** ejecutar `001_pgvector_embeddings.sql` en Supabase SQL Editor.
2. **Entorno:** configurar `.env.local` en `web/` con las tres variables del pipeline.
3. **Prueba:** `npm run embeddings:test` (10 especies).
4. **Producción:** `npm run embeddings` (catálogo completo).
5. **Verificación:** Table Editor → `plant_embeddings` → contar filas.
6. **Prueba semántica:** consulta RPC o pregunta en `/asistente`.

### 4.2 Documentos relacionados

| Archivo | Contenido |
|---------|-----------|
| `web/README.md` | Inicio rápido + comandos embeddings |
| `docs/DECISION_RAG.md` | Stack RAG y arquitectura |
| `docs/INVENTARIO_BACKEND.md` | Inventario técnico ampliado |
| `docs/ALUMNO_B_ENTREGABLE_SEMANA_1.md` | Evaluación de opciones RAG |

### 4.3 Arquitectura de datos (Semana 2)

```
Supabase PostgreSQL
├── Tablas relacionales (especie, uso_planta, propiedad…)
└── plant_embeddings (pgvector, 768 dims)
         ↑
         │ npm run embeddings
         │
generate-embeddings.mjs
         ↑
         │ gemini-embedding-001
         │
GOOGLE_GENERATIVE_AI_API_KEY
```

### 4.4 Integración con el frontend (preparación Semana 3)

El pipeline de Semana 2 deja listo el backend para:

- Catálogo navegable con datos reales (ya consumido por Alumno A)
- Búsqueda semántica vía `match_plant_embeddings`
- Pipeline RAG en construcción (Semana 3)

---

## Entregable 5 — Estado de Supabase

| Recurso | Estado |
|---------|--------|
| Proyecto Supabase | PlantasMedicinales — activo |
| Extensión pgvector | ✅ Habilitada |
| Tabla `plant_embeddings` | ✅ 857 filas |
| Storage (imágenes) | ✅ Bucket `plantas` |
| Políticas RLS lectura | ✅ Anon key para catálogo |

---

## Evidencia sugerida (Alumno B)

- [ ] Captura terminal: `npm run embeddings:test` ejecutándose sin error
- [ ] Captura terminal: `npm run embeddings` completado (catálogo completo)
- [ ] Captura Supabase Table Editor: `plant_embeddings` con **857 filas**
- [ ] Captura SQL Editor: migración `001_pgvector_embeddings.sql` aplicada
- [ ] Captura de consulta RPC o asistente respondiendo con contexto del catálogo
- [ ] Fotografía de sesión de trabajo técnico / tutoría con asesor

---

## Firma / responsable

| Campo | Valor |
|-------|-------|
| Alumno B | _[nombre]_ |
| Fecha | 21 / 06 / 2026 |
