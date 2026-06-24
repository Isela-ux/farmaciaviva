# Semanas 3 y 4 — Estado del proyecto

**Proyecto:** Farmacia Viva · VIC 2026  
**Stack IA:** DeepSeek (chat) + pgvector (Supabase) + recuperación híbrida  
**Catálogo:** ~284 especies · 857 embeddings — **catálogo completo indexado**

---

## Resumen ejecutivo

| Semana | Objetivo | Estado |
|--------|----------|--------|
| **3** | Catálogo navegable + embeddings completos | ✅ **~95 %** |
| **4** | Fichas completas + pipeline RAG v1 | ✅ **~95 %** |

> **Nota:** El cronograma menciona ~500 plantas como referencia del proyecto VIC.  
> El catálogo real en Supabase tiene **284 especies**, todas indexadas. Eso cumple el criterio de “embeddings completos del catálogo disponible”.

---

## Semana 3

### Frontend ✅

- Catálogo en `/catalogo` con búsqueda, filtros (familia + región), paginación  
- Imágenes desde Supabase Storage  
- Ficha en `/planta/[id]`  
- Contador de especies en cabecera  

### Backend / IA ✅

- Tabla `plant_embeddings`: **857 chunks** para **284 especies**  
- Script: `npm run embeddings`  
- RAG: búsqueda por nombre, usos, propiedades + pgvector opcional  
- Chat: **DeepSeek** via `DEEPSEEK_API_KEY`  

---

## Semana 4

### Frontend ✅

- Ficha con usos, contraindicaciones, propiedades, compuestos, hábitat, ubicación, bibliografía  
- Flujo: catálogo → ficha → asistente (con contexto de planta)  

### Backend / IA ✅

- Pipeline RAG v1 en `web/src/lib/rag.ts` + `POST /api/chat`  
- Respuestas basadas en contexto recuperado de Supabase  
- DeepSeek redacta; no inventa fuera del contexto (prompt restringido)  

---

## Stack IA actual

| Capa | Tecnología |
|------|------------|
| Chat | DeepSeek V4 Flash (`deepseek-v4-flash`) |
| Embeddings en BD | gemini-embedding-001 (768 dims) — ya indexados |
| Embeddings consulta | Opcional (misma clave Google) |
| Vector store | pgvector en Supabase |
| Orquestación | Vercel AI SDK |

---

## Pendiente solo para evidencia / deploy

1. Capturas para el reporte al doctor  
2. `DEEPSEEK_API_KEY` en Vercel  
3. Push a GitHub → redeploy  

---

Ver entregables formales: [`SEMANA_3_4_ENTREGABLES.md`](./SEMANA_3_4_ENTREGABLES.md)
