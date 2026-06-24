# Semana 3 — Entregables del equipo (índice)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 22–28 de junio de 2026  
**Catálogo real:** ~284 especies (857 embeddings) — no se requiere llegar a 500

---

## Criterio de aceptación (ambos alumnos)

| Rol | Criterio | Estado |
|-----|----------|--------|
| **Alumno A** | Navegar catálogo, buscar plantas y ver imágenes reales desde la BD | ✅ |
| **Alumno B** | Embeddings completos del catálogo + consultas semánticas básicas | ✅ |

---

## Documentos de entrega por alumno

### Alumno A — Frontend

**Archivo principal:** [`ALUMNO_A_ENTREGABLE_SEMANA_3.md`](./ALUMNO_A_ENTREGABLE_SEMANA_3.md)

| Entregable requerido | Sección del documento |
|----------------------|----------------------|
| Catálogo navegable funcional | Entregable 1 |
| Búsqueda básica operativa | Entregable 2 |
| Imágenes desde Supabase Storage | Entregable 3 |
| Estructura de ficha individual | Entregable 4 |
| Navegación catálogo ↔ ficha | Entregable 5 |

### Alumno B — Backend e IA

**Archivo principal:** [`ALUMNO_B_ENTREGABLE_SEMANA_3.md`](./ALUMNO_B_ENTREGABLE_SEMANA_3.md)

| Entregable requerido | Sección del documento |
|----------------------|----------------------|
| Embeddings completos en pgvector | Entregable 1 |
| Validación de integridad | Entregable 2 |
| Pipeline RAG en construcción | Entregable 3 |
| Consultas semánticas básicas | Entregable 4 |

**Anexo técnico:** [`DECISION_RAG.md`](./DECISION_RAG.md) · [`INVENTARIO_BACKEND.md`](./INVENTARIO_BACKEND.md)

---

## Evidencia sugerida (equipo)

Para el reporte al asesor:

- [ ] Captura del catálogo navegable con búsqueda y paginación (Alumno A)
- [ ] Captura de ficha con imágenes reales desde Supabase (Alumno A)
- [ ] Captura de navegación catálogo → ficha → volver (Alumno A)
- [ ] Captura `plant_embeddings` con 857 filas (Alumno B)
- [ ] Captura del Médico Virtual respondiendo con contexto del catálogo (Alumno B)
- [ ] Captura de consulta semántica (ej. plantas para digestión) (Alumno B)
- [ ] Fotografía de tutoría académica (equipo)

---

## Estado global Semana 3

```
[████████████████████] ~100 % (técnico)

✅ Catálogo navegable + búsqueda + filtros + paginación
✅ Imágenes Supabase Storage en catálogo y fichas
✅ Ficha individual estructurada (/planta/[id])
✅ 857 embeddings / 284 especies (100 % del catálogo)
✅ Pipeline RAG + consultas semánticas básicas
✅ Documentación de entrega por alumno
🔲 Evidencia fotográfica y capturas para el asesor
```

---

## Relación con otras semanas

| Semana | Enfoque | Documento |
|--------|---------|-----------|
| 2 | Base Next.js + Supabase + pipeline embeddings | [`SEMANA_2_ENTREGABLES.md`](./SEMANA_2_ENTREGABLES.md) |
| **3** | **Catálogo funcional + embeddings completos + RAG inicial** | Este documento |
| 4 | Fichas completas + RAG v1 pulido | [`SEMANA_3_4_ENTREGABLES.md`](./SEMANA_3_4_ENTREGABLES.md) |

---

## Documentos relacionados

| Archivo | Uso |
|---------|-----|
| [`SEMANA_3_4_ESTADO.md`](./SEMANA_3_4_ESTADO.md) | Detalle técnico actualizado |
| [`SEMANA_2_ENTREGABLES.md`](./SEMANA_2_ENTREGABLES.md) | Entregables semana anterior |
