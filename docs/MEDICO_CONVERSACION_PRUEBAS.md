# Evals de conversación — Médico Virtual

**Proyecto:** Farmacia Viva · VIC 2026  
**Basado en:** *A Practical Guide to Building Agents* (OpenAI) — evals end-to-end y validación de salida  
**Comando:** `cd web && npm run medico:pruebas`  
**Escenarios:** `docs/medico-conversacion-escenarios.json`  
**Último resultado:** `docs/medico-conversacion-resultado.json`

---

## Objetivo

Validar el **flujo completo del agente** sin llamar al LLM:

| Capa | Qué prueba |
|------|------------|
| Guardrails clínicos | Síntomas urgentes bloquean plantas |
| Árbol de padecimientos | Enrutamiento texto libre → hoja / opciones |
| Triaje | Cierre automático y promesa de recomendación |
| Validación de salida | Plantas en texto ⊆ contexto RAG |
| Búsqueda de plantas | Padecimientos distintos → plantas distintas |

> Complementa `npm run rag:pruebas`, que solo valida recuperación vectorial/textual.

---

## Cómo ejecutar

```bash
cd web
npm run medico:pruebas
```

**Requisitos:** `web/.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (para escenarios E14–E15).

**Salida:** resumen en consola + JSON en `docs/medico-conversacion-resultado.json`.

---

## Escenarios (22)

| ID | Tipo | Descripción |
|----|------|-------------|
| E01–E04 | guardrail | Urgente / precaución / normal |
| E05–E07 | arbol | Enrutamiento texto libre |
| E08–E09 | validacion_salida | Plantas ⊆ contexto |
| E10–E11 | triaje | Cierre y promesa de recomendación |
| E12–E13 | intencion | Pedido plantas / seguimiento |
| E14–E15 | plantas_recomendacion | Búsqueda por padecimiento |
| E16 | tarjetas_texto | Tarjetas = plantas mencionadas |
| E17 | validacion_salida | No romper «Limón real» |
| E18–E20 | filtro_entrada | Off-topic / injection / planta OK |
| E21 | guardrail_arbol | Dolor de pecho urgente |
| E22 | errores_agente | Escalamiento tras 3 fallos |

---

## Validación de salida (producción)

Implementada en `web/src/lib/validar-salida-plantas.ts` e integrada en `/api/chat/guia`:

1. Tras generar texto del LLM, detecta plantas mencionadas en el catálogo completo.
2. Compara con las plantas del contexto RAG recuperado.
3. Si hay menciones fuera de contexto: elimina el nombre y añade nota con las plantas permitidas.
4. La respuesta JSON incluye `validacionSalida: { sanitizado, mencionesInvalidas }`.

---

## Relación con el PDF de agentes

| Principio del PDF | Implementación |
|-------------------|----------------|
| Guardrails | `guardrails-clinicos.ts` + evals E01–E04 |
| Output validation | `validar-salida-plantas.ts` + evals E08–E09 |
| Evals (agent evals) | Este script — 22 escenarios JSON |
| Input filter | `filtro-entrada-agente.ts` + evals E18–E20 |
| Guardrails árbol | `guardrails-arbol.ts` + eval E21 |
| Reintentos / errores | `agente-errores.ts` + eval E22 |
| Observabilidad | `agente-observabilidad.ts` |
| Arquitectura | `docs/ARQUITECTURA_MEDICO_VIRTUAL.md` |

---

## Evidencia Semana 7

Captura de terminal con `npm run medico:pruebas` mostrando **15/15 OK** → `evidencia/semana7/alumno-b/` (o la carpeta que corresponda según `evidencia/MAPEO_CAPTURAS.md`).
