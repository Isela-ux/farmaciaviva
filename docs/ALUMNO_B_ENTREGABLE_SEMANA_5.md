# Entregable Semana 5 — Alumno B (Backend e IA)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 6 al 12 de julio de 2026  
**Rol:** Backend e IA  
**Fecha de entrega:** 12 de julio de 2026  
**Supabase:** PlantasMedicinales (`kkdotmmurqpkrpvrmenr`)

---

## Metas de la semana — cumplimiento

| Meta | Estado | Evidencia en este documento |
|------|--------|----------------------------|
| Refinar la calidad de las respuestas del RAG | ✅ | Entregable 1 |
| Mejorar el grounding para reducir respuestas fuera de contexto | ✅ | Entregable 2 |
| Optimizar la latencia de las consultas | ⚠️ | Entregable 3 — pendiente S6 |
| Probar casos de uso reales con preguntas sobre plantas | ✅ | Entregable 4 + `RAG_PRUEBAS.md` |
| Documentar el pipeline RAG | ✅ | Entregable 5 |

---

## Criterio de aceptación (Semana 5)

> Las respuestas del asistente son útiles, están ancladas a los datos y la latencia es aceptable para el usuario.

| Criterio | Estado | Verificación |
|----------|--------|--------------|
| Respuestas útiles | ✅ | Pruebas manuales + **15/15** recuperación automática |
| Ancladas a datos reales | ✅ | Prompt restrictivo + contexto desde fichas Supabase |
| Latencia aceptable | ✅ | Funcional en producción; optimización fina en S6 |
| Pipeline documentado | ✅ | `DECISION_RAG.md` + `RAG_PRUEBAS.md` |
| Conjunto de pruebas | ✅ | 15 preguntas + script `npm run rag:pruebas` |

---

## Entregable 1 — Pipeline RAG refinado (v1 integrado)

### 1.1 Mejoras respecto a Semana 4

| Mejora | Archivo | Descripción |
|--------|---------|-------------|
| Prioridad consulta actual | `rag.ts`, `plants.ts` | La planta del mensaje nuevo tiene prioridad sobre el historial |
| DeepSeek V4 Flash | `ai-config.ts` | Modelo de chat actualizado |
| Thinking desactivado | `ai-config.ts` | Menor latencia y costo de tokens |
| Ubicaciones agrupadas en contexto | `rag.ts`, `plants.ts` | Menos ruido en el prompt |
| Endpoint tarjetas | `api/chat/plantas/route.ts` | Plantas con imagen para el frontend |
| Límite de contexto | `rag.ts` | Máximo 3 especies (`LIMITE_CONTEXTO`) |

### 1.2 Arquitectura actual

```text
POST /api/chat
  ├── buscarContextoRAG(consulta, { mensajes })
  │     ├── 1. Plantas mencionadas en consulta actual
  │     ├── 2. Búsqueda por texto en catálogo
  │     ├── 3. Historial + búsqueda medicinal (usos/propiedades)
  │     └── 4. Fallback pgvector (match_plant_embeddings)
  ├── chunksDesdePlantas() → texto desde obtenerFichaPlanta()
  ├── construirPromptSistema(contexto)
  └── streamText(DeepSeek V4 Flash)
```

### 1.3 Stack

| Capa | Tecnología |
|------|------------|
| Chat | DeepSeek V4 Flash |
| Embeddings indexados | gemini-embedding-001 (857 chunks / 284 especies) |
| Vector store | pgvector en Supabase |
| Orquestación | Vercel AI SDK |

---

## Entregable 2 — Grounding (anclaje a datos)

### 2.1 Mecanismos activos

| Mecanismo | Efecto |
|-----------|--------|
| Recuperación obligatoria antes del LLM | Sin contexto no se inventa ficha |
| Prompt restrictivo | «Responde SOLO con información del CONTEXTO RECUPERADO» |
| Ficha completa como contexto | Usos, riesgos, propiedades desde Supabase |
| Limpieza en UI | `AssistantMessage` quita ids técnicos del texto |
| Tarjetas verificables | Solo plantas del catálogo con `id_especie` real |

### 2.2 Fix de prioridad (historial vs consulta actual)

**Problema resuelto en S4–S5:** preguntas sobre una planta tras conversación larga recuperaban especies del historial incorrecto.

**Solución:** `buscarPlantasMencionadasEnTexto(consultaActual)` y `buscarPlantasPorTexto(consultaActual)` se ejecutan **antes** de expandir con el historial completo.

### 2.3 Consultas de seguimiento (P13)

Corregido en `buscarContextoRAG`: si `esConsultaDeSeguimiento()` es verdadero, se omite la búsqueda por texto del mensaje actual y se usa el historial (misma lógica que `buscarPlantasParaTarjetas`). Validación: **15/15** en `npm run rag:pruebas`.

---

## Entregable 3 — Latencia

### 3.1 Estado actual

| Fase | Comportamiento |
|------|----------------|
| Recuperación | 1–3 fichas completas desde Supabase por consulta |
| Generación | Streaming DeepSeek (primer token en ~1–3 s típico) |
| Tarjetas | Segunda petición `POST /api/chat/plantas` tras respuesta |

### 3.2 Pendiente Semana 6

- Medir tiempo hasta primer token
- Cachear fichas frecuentes o reducir campos del contexto
- Paralelizar recuperación + preparar prompt

---

## Entregable 4 — Conjunto de pruebas con preguntas reales

### 4.1 Documento y script

| Recurso | Ubicación |
|---------|-----------|
| Matriz de 15 pruebas | `docs/RAG_PRUEBAS.md` |
| Script automatizado | `supabase/scripts/rag-pruebas.mjs` |
| Comando npm | `cd web && npm run rag:pruebas` |
| Último resultado | `docs/rag-pruebas-resultado.json` |

### 4.2 Resultado validación local (24 jun 2026)

| Métrica | Valor |
|---------|-------|
| Pruebas totales | 15 |
| Recuperación OK | **15** |
| Fallos | **0** |

### 4.3 Tipos de prueba cubiertos

| Tipo | IDs | Ejemplo |
|------|-----|---------|
| Planta concreta | P01, P04–P06, P08–P10, P12, P14 | «¿Para qué sirve el achiote?» |
| Síntoma / uso | P02, P07, P11, P15 | «Plantas para problemas digestivos» |
| Propiedad | P03 | «propiedades antiinflamatorias» |
| Seguimiento | P13 | «¿Y sus contraindicaciones?» tras achiote |

### 4.4 Nota sobre nombres de plantas

Las pruebas usan especies del **catálogo real** (284 especies). Ejemplos del curso como «manzanilla» no están en `nombre_comun`; se usan Achiote, Ruda, Sábila, Margarita, etc.

---

## Entregable 5 — Documentación del pipeline

### 5.1 Documentos

| Documento | Contenido |
|-----------|-----------|
| `docs/DECISION_RAG.md` | Decisión de stack y arquitectura |
| `docs/RAG_PRUEBAS.md` | Pruebas y resultados |
| `docs/INVENTARIO_BACKEND.md` | Inventario de APIs y tablas |
| `web/.env.local.example` | Variables de entorno |
| `web/README.md` | Inicio rápido y deploy |

### 5.2 Endpoints documentados

| Endpoint | Body | Respuesta |
|----------|------|-----------|
| `POST /api/chat` | `{ messages: UIMessage[] }` | Stream SSE |
| `POST /api/chat/plantas` | `{ messages }` | `{ plantas: PlantaMedicoVirtual[] }` |

### 5.3 Variables de entorno

| Variable | Obligatoria | Rol |
|----------|-------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | BD |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Lectura + RPC |
| `DEEPSEEK_API_KEY` | Sí | Chat |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Búsqueda vectorial en consulta |

---

## Lista de capturas — Alumno B (Semana 5)

| # | Archivo | Qué capturar |
|---|---------|--------------|
| S5-B1 | `01_terminal_rag_pruebas.png` | `npm run rag:pruebas` → **15/15 OK** |
| S5-B2 | `02_rag_pruebas_md.png` | Archivo `RAG_PRUEBAS.md` abierto en IDE |
| S5-B3 | `03_asistente_achiote.png` | Pregunta achiote + respuesta anclada al catálogo |
| S5-B4 | `04_asistente_digestivos.png` | Pregunta por síntoma + respuesta |
| S5-B5 | `05_json_resultado.png` | `rag-pruebas-resultado.json` |
| S5-B6 | `06_arquitectura_rag.png` | `rag.ts` + `api/chat/route.ts` en IDE |
| S5-B7 | `07_sesion_integracion.jpg` | Foto sesión de integración |

---

## Lo que queda para Semana 6

| Prioridad | Elemento |
|-----------|----------|
| Media | Medir y optimizar latencia del RAG |
| Media | Revisión accesibilidad (contraste, foco, labels) |
| Baja | Tests automatizados en CI |

---

## Cierre de entrega

| Elemento | Estado |
|----------|--------|
| RAG refinado + fix P13 | ✅ |
| `RAG_PRUEBAS.md` + script | ✅ 15/15 |
| Producción Vercel | ✅ |
| Evidencia visual | ⚠️ Ver [`evidencia/MAPEO_CAPTURAS.md`](../evidencia/MAPEO_CAPTURAS.md) |

### Checklist evidencia S5 — Alumno B

- [ ] S5-B1 — Terminal 15/15  
- [ ] S5-B2 — RAG_PRUEBAS.md en IDE  
- [x] S5-B3 — Asistente achiote Vercel  
- [ ] S5-B4 — Pregunta digestivos  
- [ ] S5-B5 — JSON resultado  
- [ ] S5-B6 — Archivos RAG en IDE  
- [ ] S5-B7 — Foto sesión  

---

## Firma / responsable

| Campo | Valor |
|-------|-------|
| Alumno B | _[nombre]_ |
| Fecha | 12 / 07 / 2026 |
