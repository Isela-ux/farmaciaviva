# Semanas 4 y 5 — Estado final del proyecto

**Proyecto:** Farmacia Viva · VIC 2026  
**URL producción:** https://project-gzlfs.vercel.app  
**Repositorio:** https://github.com/Isela-ux/farmaciaviva  
**Último deploy:** `fb96c7d` — *Fix RAG seguimiento, fichas ubicacion y entregables S4-S5*  
**Catálogo:** 284 especies · 857 embeddings pgvector

---

## Resumen ejecutivo

| Semana | Objetivo | Código | Docs | Producción | Evidencia |
|--------|----------|--------|------|------------|-----------|
| **4** | Fichas completas + RAG v1 | ✅ 100 % | ✅ | ✅ | ⚠️ ~60 % |
| **5** | RAG en interfaz + asistente | ✅ 100 % | ✅ | ✅ | ⚠️ ~70 % |

**Criterios de aceptación (docente):** ✅ cumplidos en producción.

---

## Semana 4 — Cerrado

### Alumno A (Frontend)

| Entregable | Estado |
|------------|--------|
| Ficha completa (usos, riesgos, propiedades, imágenes, hábitat, bibliografía) | ✅ |
| Ubicaciones agrupadas + lista con viñetas | ✅ |
| Filtros catálogo (texto, familia, región) + paginación | ✅ |
| Flujo catálogo → ficha → asistente | ✅ |

### Alumno B (Backend e IA)

| Entregable | Estado |
|------------|--------|
| Pipeline RAG v1 (`rag.ts`, `/api/chat`) | ✅ |
| pgvector 857 / 284 especies | ✅ |
| Consultas lenguaje natural + DeepSeek V4 Flash | ✅ |
| Respuestas ancladas al catálogo | ✅ |

---

## Semana 5 — Cerrado

### Alumno A (Frontend)

| Entregable | Estado |
|------------|--------|
| Interfaz Médico Virtual integrada | ✅ |
| Conexión `POST /api/chat` + streaming | ✅ |
| Tarjetas de plantas con imagen | ✅ |
| Disclaimers sanitarios (pie + prompt) | ✅ |
| Flujo consulta extremo a extremo | ✅ |

### Alumno B (Backend e IA)

| Entregable | Estado |
|------------|--------|
| RAG refinado (prioridad consulta, seguimiento P13) | ✅ |
| Grounding mejorado | ✅ |
| `RAG_PRUEBAS.md` + `npm run rag:pruebas` | ✅ **15/15** |
| Documentación pipeline | ✅ |
| Variables Vercel configuradas | ✅ |

---

## Validaciones técnicas finales

| Prueba | Comando / URL | Resultado |
|--------|---------------|-----------|
| Build | `cd web && npm run build` | ✅ |
| RAG recuperación | `npm run rag:pruebas` | ✅ 15/15 |
| Catálogo prod | `/catalogo` | ✅ |
| Ficha prod | `/planta/283?nombre=Ajonjolí` | ✅ |
| Asistente prod | `/asistente` | ✅ |
| Seguimiento P13 | achiote → «y sus contraindicaciones» | ✅ |

---

## Stack en producción

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16 + Tailwind |
| Backend datos | Supabase PostgreSQL + Storage |
| Vectores | pgvector (`plant_embeddings`) |
| Chat | DeepSeek V4 Flash |
| Deploy | Vercel (root `web`) |

---

## Evidencia pendiente (solo capturas)

Ver [`evidencia/MAPEO_CAPTURAS.md`](../evidencia/MAPEO_CAPTURAS.md) y checklists en `evidencia/semana4/` y `evidencia/semana5/`.

| Pendiente | Quién |
|-----------|-------|
| Catálogo + filtros (A1–A6) | Alumno A |
| Detalle ficha scroll (A8–A11) si no están en un solo screenshot | Alumno A |
| Supabase embeddings (B1–B3) | Alumno B |
| Terminal build + rag:pruebas (B11, S5-B1) | Alumno B |
| Foto tutoría (A15 / B13) | Ambos |

---

## Documentos de entrega

| Semana | Índice | Alumno A | Alumno B |
|--------|--------|----------|----------|
| 4 | [`SEMANA_4_ENTREGABLES.md`](./SEMANA_4_ENTREGABLES.md) | [`ALUMNO_A_ENTREGABLE_SEMANA_4.md`](./ALUMNO_A_ENTREGABLE_SEMANA_4.md) | [`ALUMNO_B_ENTREGABLE_SEMANA_4.md`](./ALUMNO_B_ENTREGABLE_SEMANA_4.md) |
| 5 | [`SEMANA_5_ENTREGABLES.md`](./SEMANA_5_ENTREGABLES.md) | [`ALUMNO_A_ENTREGABLE_SEMANA_5.md`](./ALUMNO_A_ENTREGABLE_SEMANA_5.md) | [`ALUMNO_B_ENTREGABLE_SEMANA_5.md`](./ALUMNO_B_ENTREGABLE_SEMANA_5.md) |
| 4+5 | [`SEMANA_4_5_ENTREGABLES.md`](./SEMANA_4_5_ENTREGABLES.md) | — | [`RAG_PRUEBAS.md`](./RAG_PRUEBAS.md) |
