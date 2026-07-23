# Semana 8 — Documentación técnica y cierre del verano

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 27 de julio al 3 de agosto de 2026  
**Repositorio:** https://github.com/Isela-ux/farmaciaviva  
**Producción:** https://proyecto-gzlfs.vercel.app

---

## Objetivo semanal

Generar la documentación técnica del sistema y preparar todos los entregables para la entrega institucional del VIC, de modo que **un desarrollador externo pueda entender, configurar y desplegar** la plataforma.

---

## Entregables por rol

| Rol | Documento principal | Complementos |
|-----|---------------------|--------------|
| **Alumno A — Frontend** | [`ALUMNO_A_ENTREGABLE_SEMANA_8.md`](./ALUMNO_A_ENTREGABLE_SEMANA_8.md) | [`DEPLOY_VERCEL.md`](./DEPLOY_VERCEL.md) |
| **Alumno B — Backend e IA** | [`ALUMNO_B_ENTREGABLE_SEMANA_8.md`](./ALUMNO_B_ENTREGABLE_SEMANA_8.md) | [`GUIA_CONFIGURACION_SUPABASE.md`](./GUIA_CONFIGURACION_SUPABASE.md) |
| **Ambos** | [`REPORTE_SEMANA_8.md`](./REPORTE_SEMANA_8.md) | [`evidencia/semana8/`](../evidencia/semana8/) |

---

## Documentación transversal (ya existente, referenciada en S8)

| Documento | Contenido |
|-----------|-----------|
| [`ARQUITECTURA_MEDICO_VIRTUAL.md`](./ARQUITECTURA_MEDICO_VIRTUAL.md) | Agente conversacional, capas de seguridad, APIs |
| [`DECISION_RAG.md`](./DECISION_RAG.md) | Decisión técnica del stack RAG |
| [`MEDICO_CONVERSACION_PRUEBAS.md`](./MEDICO_CONVERSACION_PRUEBAS.md) | Evals del Médico Virtual (23 escenarios) |
| [`RAG_PRUEBAS.md`](./RAG_PRUEBAS.md) | Evals de recuperación RAG (15 escenarios) |
| [`PRUEBAS_PRODUCCION.md`](./PRUEBAS_PRODUCCION.md) | Validación en entorno real |

---

## Criterio de aceptación (ambos)

Un desarrollador externo puede:

1. Clonar el repositorio y configurar variables de entorno.
2. Ejecutar el proyecto localmente (`cd web && npm run dev`).
3. Conectar Supabase + pgvector siguiendo la guía.
4. Desplegar en Vercel con root directory `web`.
5. Verificar con `npm run prod:validar`, `npm run rag:pruebas` y `npm run medico:pruebas`.

---

## Evidencia sugerida (ambos)

| Evidencia | Ubicación sugerida |
|-----------|-------------------|
| Fotografía de tutoría o revisión con asesor | `evidencia/semana8/tutoria/` |
| Captura de plataforma en producción | `evidencia/semana8/alumno-a/S8-produccion.png` |
| Resultado `23/23` medico:pruebas | `evidencia/semana8/alumno-b/S8-medico-pruebas.png` |
| Resultado `15/15` rag:pruebas | `evidencia/semana8/alumno-b/S8-rag-pruebas.png` |
| Dashboard Vercel (deploy Ready) | `evidencia/semana8/alumno-a/S8-vercel-deploy.png` |

---

## Estructura final del repositorio

```
appplantas/
├── app/                    # App Android (Kotlin) — catálogo móvil
├── web/                    # ★ Plataforma web Next.js (producción VIC)
│   ├── src/app/            # Páginas y API routes
│   ├── src/components/     # UI
│   ├── src/hooks/          # useMedicoGuia
│   └── src/lib/            # RAG, agente, Supabase
├── supabase/
│   ├── migrations/         # pgvector
│   └── scripts/            # embeddings, validación, pruebas
├── docs/                   # Documentación técnica (S1–S8)
└── evidencia/              # Capturas por semana
```

---

## Checkpoint semanal (lunes)

Ver formato completo en [`REPORTE_SEMANA_8.md`](./REPORTE_SEMANA_8.md).

---

## Comandos de verificación rápida

```powershell
cd web
npm install
npm run build
npm run medico:pruebas    # Esperado: 23/23 OK
npm run rag:pruebas       # Esperado: 15/15 OK
npm run prod:validar      # Requiere .env.local y producción activa
```
