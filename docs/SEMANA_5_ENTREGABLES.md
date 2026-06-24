# Semana 5 — Entregables del equipo (índice)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 6 al 12 de julio de 2026  
**Catálogo real:** ~284 especies (857 embeddings)

---

## Criterio de aceptación (ambos alumnos)

| Rol | Criterio | Estado |
|-----|----------|--------|
| **Alumno A** | Preguntar desde la interfaz y recibir respuesta fundamentada en los datos | ✅ |
| **Alumno B** | Respuestas útiles, ancladas a datos, latencia aceptable | ✅ / ⚠️ latencia → S6 |

---

## Documentos de entrega por alumno

### Alumno A — Frontend

**Archivo principal:** [`ALUMNO_A_ENTREGABLE_SEMANA_5.md`](./ALUMNO_A_ENTREGABLE_SEMANA_5.md)

| Entregable requerido | Sección |
|----------------------|---------|
| Interfaz del asistente integrada | Entregable 1 |
| Integración con endpoint RAG | Entregable 2 |
| Respuestas en la interfaz | Entregable 3 |
| Disclaimers sanitarios | Entregable 4 |
| Flujo de consulta validado | Entregable 5 |

### Alumno B — Backend e IA

**Archivo principal:** [`ALUMNO_B_ENTREGABLE_SEMANA_5.md`](./ALUMNO_B_ENTREGABLE_SEMANA_5.md)

| Entregable requerido | Sección |
|----------------------|---------|
| Pipeline RAG refinado | Entregable 1 |
| Mejor grounding | Entregable 2 |
| Pruebas con preguntas reales | Entregable 4 |
| Documentación del pipeline | Entregable 5 |

**Anexo de pruebas:** [`RAG_PRUEBAS.md`](./RAG_PRUEBAS.md) · [`rag-pruebas-resultado.json`](./rag-pruebas-resultado.json)

---

## Validación RAG — resumen

```bash
cd web
npm run rag:pruebas
```

| Métrica | Resultado (24 jun 2026) |
|---------|-------------------------|
| Pruebas | 15 |
| OK | 15 |
| Fallos | 0 |

---

## Evidencia sugerida (equipo)

| # | Captura | Responsable |
|---|---------|-------------|
| 1 | Asistente funcionando en `/asistente` | A |
| 2 | Pregunta + respuesta con tarjetas | A + B |
| 3 | Disclaimer sanitario visible | A |
| 4 | Terminal `npm run rag:pruebas` 14/15 | B |
| 5 | Ejemplos pregunta/respuesta (achiote, digestivos) | B |
| 6 | Foto sesión de integración | Ambos |

---

## Documentos relacionados

- [`ALUMNO_A_ENTREGABLE_SEMANA_4.md`](./ALUMNO_A_ENTREGABLE_SEMANA_4.md)  
- [`ALUMNO_B_ENTREGABLE_SEMANA_4.md`](./ALUMNO_B_ENTREGABLE_SEMANA_4.md)  
- [`DECISION_RAG.md`](./DECISION_RAG.md)  
- [`SEMANA_3_4_ESTADO.md`](./SEMANA_3_4_ESTADO.md)
