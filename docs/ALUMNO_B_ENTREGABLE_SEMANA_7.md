# Entregable Semana 7 — Alumno B (Backend e IA)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 20 al 26 de julio de 2026  
**Rol:** Backend e IA  
**Supabase:** PlantasMedicinales (`kkdotmmurqpkrpvrmenr`)  
**URL producción:** https://project-gzlfs.vercel.app  
**Fecha de entrega:** 26 de julio de 2026

---

## Metas de la semana — cumplimiento

| Meta | Estado | Evidencia |
|------|--------|-----------|
| Validar conexión Vercel ↔ Supabase en producción | ✅ | Catálogo, fichas y REST OK |
| Validar pipeline RAG en producción | ✅ | `/api/chat` stream 200 + 15/15 recuperación |
| Corregir errores de configuración / env vars | ✅ | `DEEPSEEK_*`, `NEXT_PUBLIC_SUPABASE_*` |
| Pruebas de consultas en entorno real | ✅ | [`PRUEBAS_PRODUCCION.md`](./PRUEBAS_PRODUCCION.md) |
| Documentar proceso de despliegue | ✅ | [`DEPLOY_VERCEL.md`](./DEPLOY_VERCEL.md) |

---

## Criterio de aceptación

> El backend, la base de datos y el módulo RAG funcionan correctamente en el entorno de producción de Vercel.

| Criterio | Estado | Verificación |
|----------|--------|--------------|
| Supabase accesible desde Vercel | ✅ | SSR catálogo/fichas + REST anon |
| Embeddings indexados | ✅ | 857 chunks / 284 especies |
| RAG recupera contexto | ✅ | `npm run rag:pruebas` → 15/15 |
| LLM responde en prod | ✅ | DeepSeek vía `/api/chat` y `/api/chat/guia` |
| Variables de entorno correctas | ✅ | Sin HTTP 503 por claves faltantes |
| Documentación de despliegue | ✅ | `DEPLOY_VERCEL.md` |
| Registro de pruebas | ✅ | `PRUEBAS_PRODUCCION.md` + JSON |

---

## Entregable 1 — Backend y RAG en producción

### 1.1 Endpoints API desplegados

| Endpoint | Función | Prod |
|----------|---------|------|
| `POST /api/chat` | RAG + stream DeepSeek | ✅ |
| `POST /api/chat/guia` | Triaje y recomendación multi-agente | ✅ |
| `POST /api/chat/plantas` | Tarjetas con imágenes para UI | ✅ |

### 1.2 Pipeline RAG en producción

```text
POST /api/chat (Vercel serverless)
  ├── buscarContextoRAG(consulta)
  │     ├── Plantas en mensaje actual
  │     ├── Búsqueda textual catálogo
  │     ├── Historial + usos/propiedades
  │     └── Fallback pgvector (match_plant_embeddings)
  ├── chunks desde obtenerFichaPlanta()
  ├── construirPromptSistema(contexto)
  └── streamText(DeepSeek V4 Flash)
```

### 1.3 Guía médica multi-agente (`/api/chat/guia`)

| Fase | Agente | Producción |
|------|--------|------------|
| `triaje` | Especialista clínico | ✅ |
| `recomendacion` | Especialista plantas + RAG | ✅ |
| `consulta_planta` | RAG directo sobre especie | ✅ |

Archivos clave:

- `web/src/lib/rag.ts`
- `web/src/lib/medico-agentes.ts`
- `web/src/app/api/chat/route.ts`
- `web/src/app/api/chat/guia/route.ts`

---

## Entregable 2 — Conexión Vercel ↔ Supabase

### 2.1 Variables en Vercel (Production)

| Variable | Rol | Estado |
|----------|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyecto | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Lectura catálogo/RAG | ✅ |
| `DEEPSEEK_API_KEY` | Chat y guía | ✅ |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Embeddings consulta (opcional) | ⚠️ Recomendada |

### 2.2 Validación de datos

| Recurso | Cantidad | Verificación |
|---------|----------|--------------|
| Especies (`especies`) | 284 | Catálogo prod + SQL |
| Embeddings (`plant_embeddings`) | 857 | Script validar + SQL |
| Dimensiones vector | 768 | pgvector + gemini-embedding-001 |
| Umbral match | 0.45 | `ai-config.ts` |

### 2.3 Prueba REST (anon key)

```http
GET {SUPABASE_URL}/rest/v1/especie?select=id_especie&limit=1
apikey: {ANON_KEY}
Authorization: Bearer {ANON_KEY}
```

**Resultado en validación S7:** HTTP 200 con al menos 1 fila.

---

## Entregable 3 — Documentación del despliegue

| Documento | Contenido |
|-----------|-----------|
| [`DEPLOY_VERCEL.md`](./DEPLOY_VERCEL.md) | Proceso completo: repo, env vars, deploy, errores frecuentes |
| [`PRUEBAS_PRODUCCION.md`](./PRUEBAS_PRODUCCION.md) | Registro de pruebas en entorno real |
| `web/vercel.json` | Comandos build/install |
| `web/README.md` | Variables locales |

---

## Entregable 4 — Registro de pruebas en producción

### 4.1 Script automatizado

```powershell
cd web
npm run prod:validar
```

| Prueba | Resultado |
|--------|-----------|
| GET `/`, `/catalogo`, `/planta/283`, `/asistente` | ✅ |
| Imagen en ficha | ✅ |
| POST `/api/chat` vacío → 400 | ✅ |
| POST `/api/chat` RAG → 200 stream | ✅ |
| POST `/api/chat/guia` triaje → 200 JSON | ✅ |
| Supabase REST | ✅ |

**Salida:** `evidencia/semana7/prod-validacion-resultado.json`

### 4.2 Recuperación RAG (sin LLM)

```powershell
cd web
npm run rag:pruebas
```

| Métrica | Resultado |
|---------|-----------|
| Preguntas | 15 |
| OK | 15/15 |
| Archivo | `evidencia/rag-pruebas-resultado.json` |

### 4.3 Consultas manuales en producción

| Consulta | Tipo | Resultado |
|----------|------|-----------|
| «¿Para qué sirve el ajonjolí?» | RAG directo | ✅ Contexto + respuesta |
| «ME DUELE MUCHO LA NARIZ» | Triaje guía | ✅ Preguntas clínicas |
| «¿Qué plantas me recomiendas?» (en triaje) | Recomendación | ✅ RAG + tarjetas |
| Pregunta achiote + contraindicaciones | Seguimiento | ✅ Historial respetado |

Detalle completo: [`PRUEBAS_PRODUCCION.md`](./PRUEBAS_PRODUCCION.md)

---

## Entregable 5 — Correcciones de configuración

| Incidencia | Causa | Corrección |
|------------|-------|------------|
| 503 en asistente | `DEEPSEEK_API_KEY` ausente | Añadida en Vercel Production |
| Catálogo vacío | URL Supabase incorrecta | `NEXT_PUBLIC_SUPABASE_URL` corregida |
| Build fallido | Root en raíz del monorepo | Root = `web` |
| API chat 400 en pruebas | Formato `UIMessage` con `parts` | Documentado en script validación |

---

## Evidencia visual — Alumno B (Semana 7)

| # | Archivo | Qué capturar |
|---|---------|--------------|
| S7-B1 | `01_env_vercel.png` | Vercel → Environment Variables (nombres, sin valores) |
| S7-B2 | `02_deploy_ready.png` | Deployments → estado **Ready** + commit |
| S7-B3 | `03_prod_validar.png` | Terminal `npm run prod:validar` → todas OK |
| S7-B4 | `04_rag_pruebas.png` | Terminal `npm run rag:pruebas` → 15/15 |
| S7-B5 | `05_supabase_embeddings.png` | SQL o tabla `plant_embeddings` (857 filas) |
| S7-B6 | `06_api_chat_prod.png` | Network tab: POST `/api/chat` → 200 stream |
| S7-B7 | `sesion_validacion.jpg` | Foto sesión validación (compartida con Alumno A) |

**Carpeta:** `evidencia/semana7/alumno-b/`

### Checklist evidencia S7 — Alumno B

- [ ] S7-B1 — Variables Vercel  
- [ ] S7-B2 — Deploy Ready  
- [ ] S7-B3 — Script prod:validar  
- [ ] S7-B4 — RAG 15/15  
- [ ] S7-B5 — Embeddings en Supabase  
- [ ] S7-B6 — API chat en prod  
- [ ] S7-B7 — Foto sesión  

---

## Cierre de entrega

| Elemento | Estado |
|----------|--------|
| Backend en producción | ✅ |
| Base de datos conectada | ✅ |
| RAG operativo | ✅ |
| Documentación despliegue | ✅ |
| Registro de pruebas | ✅ |
| Evidencia visual (capturas) | ⚠️ Pendiente capturas del usuario |

---

## Firma / responsable

| Campo | Valor |
|-------|-------|
| Alumno B | _[nombre]_ |
| Fecha | 26 / 07 / 2026 |
