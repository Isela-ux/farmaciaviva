# Semana 7 — Despliegue en Vercel y pruebas en producción

**Periodo:** 20 al 26 de julio de 2026  
**Objetivo:** Desplegar la plataforma en Vercel y validar que todo funcione en producción.

**URL producción:** https://project-gzlfs.vercel.app

---

## Estado general

| Rol | Documento entregable | Estado técnico | Evidencia visual |
|-----|---------------------|----------------|------------------|
| Alumno A (Frontend) | [`ALUMNO_A_ENTREGABLE_SEMANA_7.md`](./ALUMNO_A_ENTREGABLE_SEMANA_7.md) | ✅ Completo | ⚠️ Capturas pendientes |
| Alumno B (Backend e IA) | [`ALUMNO_B_ENTREGABLE_SEMANA_7.md`](./ALUMNO_B_ENTREGABLE_SEMANA_7.md) | ✅ Completo | ⚠️ Capturas pendientes |

---

## Alumno A — Frontend

### Metas

| Meta | Estado |
|------|--------|
| Desplegar en Vercel | ✅ |
| Validar catálogo en producción | ✅ |
| Validar fichas e imágenes | ✅ |
| Validar asistente en producción | ✅ |
| Corregir errores de despliegue | ✅ |

### Entregables

| Entregable | Estado |
|------------|--------|
| Plataforma con URL pública | ✅ https://project-gzlfs.vercel.app |
| Catálogo y fichas en producción | ✅ |
| Asistente RAG en producción | ✅ |

### Criterio de aceptación

> La plataforma está accesible en línea y el flujo completo funciona en producción.

**Resultado:** ✅ Cumplido (pendiente solo evidencia fotográfica del usuario).

---

## Alumno B — Backend e IA

### Metas

| Meta | Estado |
|------|--------|
| Validar Vercel ↔ Supabase | ✅ |
| Validar pipeline RAG en producción | ✅ |
| Corregir env vars / configuración | ✅ |
| Pruebas en entorno real | ✅ |
| Documentar despliegue | ✅ |

### Entregables

| Entregable | Estado |
|------------|--------|
| Backend y RAG en producción | ✅ |
| Documentación de despliegue | ✅ [`DEPLOY_VERCEL.md`](./DEPLOY_VERCEL.md) |
| Registro de pruebas | ✅ [`PRUEBAS_PRODUCCION.md`](./PRUEBAS_PRODUCCION.md) |

### Criterio de aceptación

> Backend, base de datos y RAG funcionan en producción Vercel.

**Resultado:** ✅ Cumplido.

---

## Documentación y herramientas S7

| Recurso | Descripción |
|---------|-------------|
| [`DEPLOY_VERCEL.md`](./DEPLOY_VERCEL.md) | Guía paso a paso del despliegue |
| [`PRUEBAS_PRODUCCION.md`](./PRUEBAS_PRODUCCION.md) | Registro detallado de pruebas |
| `npm run prod:validar` | Script HTTP/API contra producción |
| `npm run rag:pruebas` | Validación recuperación RAG (15 preguntas) |
| `evidencia/semana7/` | Carpeta para capturas |

---

## Evidencia sugerida (ambos alumnos)

| # | Qué capturar | Carpeta |
|---|--------------|---------|
| 1 | Plataforma desplegada con **URL visible** | `evidencia/semana7/alumno-a/01_url_produccion.png` |
| 2 | Asistente funcionando en producción (triaje o RAG) | `alumno-a/04_*` o `05_*` |
| 3 | Foto sesión validación final | `evidencia/semana7/sesion_validacion.jpg` |

Guía completa de renombrado: [`evidencia/MAPEO_CAPTURAS.md`](../evidencia/MAPEO_CAPTURAS.md)

---

## Sesión rápida para completar evidencia (~15 min)

1. Abrir https://project-gzlfs.vercel.app → captura con URL → **S7-A1**
2. `/catalogo` → **S7-A2**
3. `/planta/283` con imagen → **S7-A3**
4. `/asistente` → escribir «ME DUELE LA NARIZ» → captura triaje → **S7-A4**
5. Continuar hasta recomendación con plantas → **S7-A5**
6. Vercel dashboard → env vars (sin valores) → **S7-B1**
7. Terminal: `cd web` → `npm run prod:validar` → **S7-B3**
8. Terminal: `npm run rag:pruebas` → **S7-B4**
9. Foto del equipo validando → **sesion_validacion.jpg**

---

## Comandos de verificación

```powershell
cd c:\Users\isela\AndroidStudioProjects\appplantas\web
npm run prod:validar
npm run rag:pruebas
npm run build
```

---

## Fecha de cierre

26 de julio de 2026
