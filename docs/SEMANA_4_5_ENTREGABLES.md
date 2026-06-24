# Semanas 4 y 5 — Entregables del equipo (cierre)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodos:** 29 jun – 5 jul (S4) · 6 – 12 jul (S5)  
**Producción:** https://project-gzlfs.vercel.app  
**Estado:** ✅ **Listo para entregar** (código + docs + deploy)

---

## Criterios de aceptación — cumplimiento

| Semana | Rol | Criterio | Estado |
|--------|-----|----------|--------|
| **4** | A | Navegar catálogo, buscar y ver ficha completa | ✅ |
| **4** | B | RAG responde con datos reales de la BD | ✅ |
| **5** | A | Preguntar desde la UI y recibir respuesta fundamentada | ✅ |
| **5** | B | Respuestas útiles, ancladas, latencia aceptable | ✅ |

---

## Paquete de entrega al asesor

Entregar **cuatro documentos principales** + evidencia visual:

### Semana 4

| Alumno | Documento |
|--------|-----------|
| A | [`ALUMNO_A_ENTREGABLE_SEMANA_4.md`](./ALUMNO_A_ENTREGABLE_SEMANA_4.md) |
| B | [`ALUMNO_B_ENTREGABLE_SEMANA_4.md`](./ALUMNO_B_ENTREGABLE_SEMANA_4.md) |

### Semana 5

| Alumno | Documento |
|--------|-----------|
| A | [`ALUMNO_A_ENTREGABLE_SEMANA_5.md`](./ALUMNO_A_ENTREGABLE_SEMANA_5.md) |
| B | [`ALUMNO_B_ENTREGABLE_SEMANA_5.md`](./ALUMNO_B_ENTREGABLE_SEMANA_5.md) |

### Anexos técnicos (Alumno B)

- [`RAG_PRUEBAS.md`](./RAG_PRUEBAS.md) — 15 preguntas, **15/15 OK**
- [`rag-pruebas-resultado.json`](./rag-pruebas-resultado.json) — resultado automatizado
- [`DECISION_RAG.md`](./DECISION_RAG.md) — stack y arquitectura

### Estado consolidado

- [`SEMANA_4_5_ESTADO.md`](./SEMANA_4_5_ESTADO.md)

---

## Evidencia visual

Carpeta: [`evidencia/`](../evidencia/)

| Carpeta | Contenido |
|---------|-----------|
| `evidencia/semana4/alumno-a/` | Capturas A1–A15 |
| `evidencia/semana4/alumno-b/` | Capturas B1–B13 |
| `evidencia/semana5/alumno-a/` | Capturas S5-A1–A6 |
| `evidencia/semana5/alumno-b/` | Capturas S5-B1–B7 |

Guía de mapeo (qué ya tienes y cómo nombrar archivos): [`evidencia/MAPEO_CAPTURAS.md`](../evidencia/MAPEO_CAPTURAS.md)

---

## Hitos técnicos S4–S5 (para el reporte)

1. **Fichas completas** con todas las secciones de Supabase  
2. **Ubicación geográfica** deduplicada y agrupada (fix repetición)  
3. **RAG híbrido** (nombre + usos/propiedades + pgvector)  
4. **Médico Virtual** pantalla completa, streaming, tarjetas con imagen  
5. **Fix P13** — seguimiento «¿Y sus contraindicaciones?» mantiene la planta del historial  
6. **Deploy Vercel** con variables configuradas y commit `fb96c7d` en producción  
7. **Validación automatizada** `npm run rag:pruebas` → 15/15  

---

## URLs para demostración en vivo

| Vista | URL |
|-------|-----|
| Inicio | https://project-gzlfs.vercel.app/ |
| Catálogo | https://project-gzlfs.vercel.app/catalogo |
| Ficha Ajonjolí | https://project-gzlfs.vercel.app/planta/283?nombre=Ajonjolí |
| Médico Virtual | https://project-gzlfs.vercel.app/asistente |

### Demo sugerida (3 min)

1. Catálogo → buscar «achiote» → abrir ficha  
2. Ficha → «Consultar al Médico Virtual»  
3. Preguntar usos → seguimiento «y sus contraindicaciones»  
4. Mostrar disclaimer y tarjeta con imagen  

---

## Próximo paso: Semana 6

Ver [`SEMANA_4_5_ESTADO.md`](./SEMANA_4_5_ESTADO.md) — accesibilidad, latencia, pulido UI, docs S6.
