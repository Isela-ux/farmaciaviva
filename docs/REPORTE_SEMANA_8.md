# Reporte semanal — Semana 8 (cierre del verano)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 27 de julio al 3 de agosto de 2026  
**Checkpoint:** Lunes  
**URL producción:** https://proyecto-gzlfs.vercel.app

---

## Avance de la semana anterior (Semana 7)

- Médico Virtual desplegado en Vercel (proyecto `proyecto-gzlfs`, root `web/`).
- Flujo completo: árbol de decisiones → triaje (~3 preguntas) → recomendación con plantas del catálogo.
- Capas de agente según PDF *A Practical Guide to Building Agents*:
  - Filtro de entrada (off-topic, prompt injection)
  - Guardrails clínicos (urgencias, precaución)
  - Validación de salida (tarjetas alineadas al texto)
  - Observabilidad y manejo de errores/reintentos
- Evals automatizados: **23 escenarios** (`medico:pruebas`) y **15 escenarios** RAG (`rag:pruebas`).
- Correcciones de producción: enrutamiento de síntomas urgentes, opciones del árbol al escribir «Dolor», reinicio ante malestar vago durante triaje.

---

## Evidencias

| Evidencia | Estado | Ubicación |
|-----------|--------|-----------|
| Plataforma en producción | ✅ | https://proyecto-gzlfs.vercel.app |
| `medico:pruebas` 23/23 | ✅ | `docs/medico-conversacion-resultado.json` |
| `rag:pruebas` 15/15 | ✅ | `docs/rag-pruebas-resultado.json` |
| Validación producción | ✅ | `evidencia/semana7/prod-validacion-resultado.json` |
| Documentación técnica S8 | ✅ | `docs/SEMANA_8_ENTREGABLES.md` y entregables A/B |
| Capturas tutoría / asesor | ⬜ Pendiente | `evidencia/semana8/tutoria/` |
| Capturas pantalla S8 | ⬜ Pendiente | `evidencia/semana8/alumno-a/`, `alumno-b/` |

---

## Problemas encontrados

| Problema | Resolución |
|----------|------------|
| Síntomas urgentes (`sangrado abundante`) iban al chat RAG sin guardrail | Enrutamiento a Médico Virtual + guardrail en `/api/chat` |
| «Dolor» saltaba a triaje sin sub-opciones | No usar `malestar-libre` cuando coincide con nodo del árbol |
| Injection durante triaje no se bloqueaba | Priorizar detección de injection antes del bypass de triaje |
| Frase demo mezclaba consultas anteriores | Reinicio automático ante malestar vago en fase triaje/fin |
| Deploy Vercel en proyecto incorrecto | Confirmado proyecto **proyecto-gzlfs** vinculado a GitHub |

---

## Tareas de la semana actual (Semana 8)

### Alumno A — Frontend

- [x] Documentar arquitectura del frontend
- [x] Documentar componentes principales
- [x] Documentar despliegue Vercel (`DEPLOY_VERCEL.md` + entregable S8)
- [x] Organizar estructura del repositorio en documentación
- [ ] Completar capturas en `evidencia/semana8/alumno-a/`
- [ ] Foto de tutoría / revisión con asesor

### Alumno B — Backend e IA

- [x] Documentar arquitectura backend y BD
- [x] Documentar pipeline RAG y decisiones técnicas
- [x] Documentar generación de embeddings
- [x] Guía Supabase + pgvector (`GUIA_CONFIGURACION_SUPABASE.md`)
- [x] Organizar scripts y docs en repositorio
- [ ] Completar capturas en `evidencia/semana8/alumno-b/`
- [ ] Foto de tutoría / revisión con asesor

---

## Nivel de avance general

**En tiempo** — Sistema funcional en producción con documentación técnica generada. Pendiente: evidencias fotográficas de tutoría y capturas finales de entrega institucional.

---

## Meta para entrega institucional (3 agosto)

1. Subir capturas a `evidencia/semana8/`
2. Verificar criterio de aceptación: desarrollador externo puede clonar, configurar y desplegar siguiendo docs
3. Entregar enlaces:
   - Repositorio: https://github.com/Isela-ux/farmaciaviva
   - Producción: https://proyecto-gzlfs.vercel.app
   - Índice documentación: `docs/SEMANA_8_ENTREGABLES.md`

---

## Formato breve (para copiar al reporte institucional)

**Avance de la semana anterior:**  
Documentación técnica del frontend y backend; guías de Vercel y Supabase; agente Médico Virtual con guardrails y 23 evals automatizados; plataforma en producción.

**Evidencias:**  
URL producción, resultados `23/23` y `15/15` en pruebas automatizadas, documentos en `docs/`.

**Problemas encontrados:**  
Enrutamiento de urgencias y filtros en producción (corregidos en commits `de12330`, `75f34f2`, `4d8744c`).

**Tareas de la semana actual:**  
Cierre de documentación S8, organización de evidencias, capturas de tutoría.

**Nivel de avance general:** En tiempo.
