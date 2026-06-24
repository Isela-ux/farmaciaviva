# Semanas 3 y 4 — Estado del proyecto

**Proyecto:** Farmacia Viva · VIC 2026  
**Stack IA:** DeepSeek V4 Flash + pgvector (Supabase) + recuperación híbrida  
**Catálogo:** ~284 especies · 857 embeddings — **catálogo completo indexado**

> **Actualización:** Semanas 4 y 5 cerradas. Ver estado consolidado en [`SEMANA_4_5_ESTADO.md`](./SEMANA_4_5_ESTADO.md).

---

## Resumen ejecutivo

| Semana | Objetivo | Estado |
|--------|----------|--------|
| **3** | Catálogo navegable + embeddings completos | ✅ **100 %** |
| **4** | Fichas completas + pipeline RAG v1 | ✅ **100 %** |
| **5** | RAG en interfaz + asistente | ✅ **100 %** |

---

## Semana 3 — Resumen

- Catálogo `/catalogo` con búsqueda, filtros, paginación  
- 857 embeddings / 284 especies en pgvector  
- Estructura de ficha y navegación catálogo ↔ ficha  

---

## Semana 4 — Resumen

- Ficha completa con todas las secciones de Supabase  
- Ubicaciones agrupadas y en lista (fix repetición)  
- RAG v1 + DeepSeek en `/api/chat`  
- Deploy: https://project-gzlfs.vercel.app  

---

## Semana 5 — Resumen

- Médico Virtual integrado (`ChatAssistant`, tarjetas, disclaimers)  
- Fix P13 seguimiento en RAG  
- `npm run rag:pruebas` → **15/15 OK**  
- Producción verificada (achiote + contraindicaciones)  

---

## Entregables formales

| Documento |
|-----------|
| [`SEMANA_4_5_ENTREGABLES.md`](./SEMANA_4_5_ENTREGABLES.md) |
| [`ALUMNO_A_ENTREGABLE_SEMANA_4.md`](./ALUMNO_A_ENTREGABLE_SEMANA_4.md) |
| [`ALUMNO_B_ENTREGABLE_SEMANA_4.md`](./ALUMNO_B_ENTREGABLE_SEMANA_4.md) |
| [`ALUMNO_A_ENTREGABLE_SEMANA_5.md`](./ALUMNO_A_ENTREGABLE_SEMANA_5.md) |
| [`ALUMNO_B_ENTREGABLE_SEMANA_5.md`](./ALUMNO_B_ENTREGABLE_SEMANA_5.md) |
| [`RAG_PRUEBAS.md`](./RAG_PRUEBAS.md) |
| [`evidencia/MAPEO_CAPTURAS.md`](../evidencia/MAPEO_CAPTURAS.md) |
