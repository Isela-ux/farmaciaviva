# Semanas 3 y 4 — Entregables del equipo

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodos:** 22–28 jun (S3) · 29 jun–5 jul (S4)  
**Catálogo real:** ~284 especies (857 embeddings) — **no se requiere llegar a 500**

---

## Criterio de aceptación (ambos)

| Semana | Criterio | Estado |
|--------|----------|--------|
| **3** | Navegar catálogo, buscar plantas y ver imágenes reales | ✅ |
| **3** | Embeddings completos del catálogo disponible + consultas semánticas básicas | ✅ |
| **4** | Ficha completa con toda la información disponible | ✅ |
| **4** | RAG responde preguntas ancladas a la base de datos real | ✅ |

---

## Semana 3 — Catálogo + embeddings

### Alumno A — Frontend

| Entregable | Estado | Evidencia |
|------------|--------|-----------|
| Catálogo navegable | ✅ | `/catalogo` — paginación 24/página |
| Búsqueda básica | ✅ | Nombre común, científico y región |
| Filtros | ✅ | Familia + región de uso |
| Imágenes Supabase Storage | ✅ | `PlantCard`, `images.ts` |
| Ficha (estructura) | ✅ | `/planta/[id]` |
| Navegación catálogo ↔ ficha | ✅ | Tarjetas + enlace volver |

### Alumno B — Backend e IA

| Entregable | Estado | Evidencia |
|------------|--------|-----------|
| Embeddings pgvector | ✅ | **857 chunks / 284 especies** (100 % del catálogo) |
| Integridad | ✅ | `001_pgvector_embeddings.sql` + script |
| Pipeline RAG | ✅ | `rag.ts`, `/api/chat` |
| Consultas semánticas | ✅ | pgvector + búsqueda por usos/propiedades |
| Stack chat | ✅ | **DeepSeek** (`DEEPSEEK_API_KEY`) |

---

## Semana 4 — Fichas + RAG v1

### Alumno A — Frontend

| Entregable | Estado |
|------------|--------|
| Ficha completa (usos, propiedades, contraindicaciones, imágenes, hábitat, bibliografía) | ✅ |
| Filtros en catálogo | ✅ |
| Flujo estable catálogo → ficha → asistente | ✅ |

### Alumno B — Backend e IA

| Entregable | Estado |
|------------|--------|
| Pipeline RAG v1 funcional | ✅ |
| Conexión pgvector | ✅ |
| Consultas lenguaje natural | ✅ DeepSeek + contexto recuperado |
| Respuestas ancladas a datos | ✅ Prompt + RAG híbrido |
| Endpoint frontend | ✅ `POST /api/chat` |

---

## Mejoras aplicadas (pulido S3–S4)

1. **Catálogo:** filtros familia + región, paginación, contador de especies, badges en tarjetas  
2. **Ficha:** placeholder de imagen, enlace al asistente con contexto  
3. **Asistente:** sugerencias personalizadas desde ficha (`?planta=&nombre=`)  
4. **RAG:** búsqueda ampliada por usos y propiedades (sin depender solo de vectores)  
5. **IA:** chat con DeepSeek; embeddings existentes en pgvector  

---

## Variables de entorno

```env
DEEPSEEK_API_KEY=...          # obligatorio — chat
GOOGLE_GENERATIVE_AI_API_KEY= # opcional — solo búsqueda vectorial semántica
```

---

## Evidencia sugerida

- [ ] Captura catálogo con filtros y paginación  
- [ ] Captura ficha completa  
- [ ] Captura asistente (DeepSeek) respondiendo  
- [ ] Captura `plant_embeddings` en Supabase (857 filas)  
- [ ] Foto tutoría / revisión con asesor  

---

## Documentos relacionados

- [`SEMANA_3_4_ESTADO.md`](./SEMANA_3_4_ESTADO.md) — detalle técnico  
- [`DECISION_RAG.md`](./DECISION_RAG.md) — stack RAG actualizado  
