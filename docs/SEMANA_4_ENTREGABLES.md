# Semana 4 — Entregables del equipo (índice)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 29 de junio al 5 de julio de 2026  
**Catálogo real:** ~284 especies (857 embeddings) — no se requiere llegar a 500

---

## Criterio de aceptación (ambos alumnos)

| Rol | Criterio | Estado |
|-----|----------|--------|
| **Alumno A** | Navegar catálogo, buscar una planta y ver su ficha completa con toda la información disponible | ✅ |
| **Alumno B** | Responder preguntas sobre plantas medicinales con información de la base de datos real | ✅ |

---

## Documentos de entrega por alumno

### Alumno A — Frontend

**Archivo principal:** [`ALUMNO_A_ENTREGABLE_SEMANA_4.md`](./ALUMNO_A_ENTREGABLE_SEMANA_4.md)

| Entregable requerido | Sección del documento |
|----------------------|----------------------|
| Fichas individuales completas | Entregable 1 |
| Búsqueda con filtros básicos | Entregable 2 |
| Flujo catálogo → ficha estable | Entregable 3 |

### Alumno B — Backend e IA

**Archivo principal:** [`ALUMNO_B_ENTREGABLE_SEMANA_4.md`](./ALUMNO_B_ENTREGABLE_SEMANA_4.md)

| Entregable requerido | Sección del documento |
|----------------------|----------------------|
| Pipeline RAG v1 funcional | Entregable 1 |
| Conexión pgvector | Entregable 2 |
| Consultas en lenguaje natural | Entregable 3 |
| Respuestas ancladas a datos | Entregable 4 |
| Endpoint para frontend | Entregable 5 |

**Anexo técnico:** [`DECISION_RAG.md`](./DECISION_RAG.md) · [`SEMANA_3_4_ESTADO.md`](./SEMANA_3_4_ESTADO.md)

---

## Lista exacta de capturas — equipo completo

Carpeta sugerida en el repo o en Drive:

```
evidencia/semana4/
├── alumno-a/     ← capturas A1–A15
├── alumno-b/     ← capturas B1–B13
└── equipo/       ← capturas compartidas E1–E2
```

### Resumen por alumno

| Alumno | Capturas | Enfoque |
|--------|----------|---------|
| **A** | 15 (A1–A15) | Catálogo, filtros, ficha completa, navegación, Vercel |
| **B** | 13 (B1–B13) | Supabase/pgvector, RAG, chat, endpoints, Vercel |
| **Equipo** | 2 (E1–E2) | Tutoría y vista general del proyecto |

### Capturas compartidas (equipo)

| # | Archivo | Qué capturar |
|---|---------|--------------|
| E1 | `equipo_01_home.png` | Página de inicio `/` con branding Farmacia Viva |
| E2 | `equipo_02_tutoria_grupo.jpg` | Foto grupal o evidencia de sesión con asesor (si no se duplica A15/B13) |

### Orden recomendado para tomarlas (1 sesión ~45 min)

1. **Supabase (B1–B3)** — 5 min  
2. **Catálogo y filtros (A1–A6)** — 10 min  
3. **Ficha Ajonjolí (A7–A12)** — 10 min  
4. **Médico Virtual (B5–B9, A13)** — 15 min  
5. **Vercel producción (A14, B12)** — 5 min  
6. **Terminal build (B11)** y **env vars (B10)** — 5 min  
7. **Tutoría (A15 / B13 / E2)** — cuando corresponda  

### URLs de referencia rápida

| Vista | Local | Producción |
|-------|-------|------------|
| Catálogo | `http://localhost:3000/catalogo` | `https://project-gzlfs.vercel.app/catalogo` |
| Ficha Ajonjolí | `http://localhost:3000/planta/283?nombre=Ajonjolí` | `https://project-gzlfs.vercel.app/planta/283?nombre=Ajonjolí` |
| Médico Virtual | `http://localhost:3000/asistente` | `https://project-gzlfs.vercel.app/asistente` |
| Supabase | Dashboard → proyecto PlantasMedicinales | — |

### Preguntas sugeridas para capturas del chat (B5–B9)

1. «¿Para qué sirve la manzanilla?»  
2. «Plantas para problemas digestivos»  
3. «¿Qué plantas tienen propiedades antiinflamatorias?»  
4. (Tras la 1) «¿Y sus contraindicaciones?»  

---

## Estado del código al cierre de Semana 4

| Área | Estado |
|------|--------|
| Ficha completa + ubicaciones agrupadas | ✅ |
| Catálogo con filtros y paginación | ✅ |
| RAG v1 + DeepSeek V4 Flash | ✅ |
| pgvector 857 / 284 especies | ✅ |
| Deploy Vercel | ✅ (redeploy tras fix ubicaciones recomendado) |
| Documentos formales S4 | ✅ Este índice + entregables A y B |
| Capturas de evidencia | ⬜ Pendiente por el equipo |

---

## Documentos relacionados

- [`ALUMNO_A_ENTREGABLE_SEMANA_4.md`](./ALUMNO_A_ENTREGABLE_SEMANA_4.md)  
- [`ALUMNO_B_ENTREGABLE_SEMANA_4.md`](./ALUMNO_B_ENTREGABLE_SEMANA_4.md)  
- [`SEMANA_3_4_ESTADO.md`](./SEMANA_3_4_ESTADO.md)  
- [`SEMANA_3_4_ENTREGABLES.md`](./SEMANA_3_4_ENTREGABLES.md)
