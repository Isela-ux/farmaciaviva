# Despliegue en Vercel — Farmacia Viva

**Proyecto:** Farmacia Viva · VIC 2026  
**URL producción:** https://proyecto-gzlfs.vercel.app  
**Repositorio:** https://github.com/Isela-ux/farmaciaviva  
**Root directory en Vercel:** `web`

---

## 1. Requisitos previos

| Requisito | Descripción |
|-----------|-------------|
| Cuenta Vercel | Vinculada a GitHub |
| Repo en GitHub | Rama `master` con carpeta `web/` |
| Proyecto Supabase | `PlantasMedicinales` (`kkdotmmurqpkrpvrmenr`) |
| API DeepSeek | Clave para chat y guía médica |
| (Opcional) Google AI | `GOOGLE_GENERATIVE_AI_API_KEY` para embeddings de consulta en runtime |

---

## 2. Conectar el repositorio

1. En [vercel.com](https://vercel.com) → **Add New Project**.
2. Importar `Isela-ux/farmaciaviva`.
3. En **Root Directory** elegir `web` (no la raíz del monorepo).
4. Framework: **Next.js** (detectado automáticamente).
5. Build: `npm run build` · Install: `npm install`.

El archivo `web/vercel.json` confirma estos comandos.

---

## 3. Variables de entorno (Production)

Configurar en **Vercel → Project → Settings → Environment Variables**:

| Variable | Obligatoria | Uso |
|----------|-------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Clave anónima (catálogo, fichas, RAG lectura) |
| `DEEPSEEK_API_KEY` | ✅ | Chat `/api/chat`, guía `/api/chat/guia` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ⚠️ | Embeddings de consulta si no hay match textual |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | Solo scripts locales (`embeddings`, migraciones) |

> **Importante:** las variables `NEXT_PUBLIC_*` se exponen al navegador; usar solo la clave **anon** de Supabase, nunca la service role.

Tras añadir o cambiar variables → **Redeploy** del último deployment.

---

## 4. Despliegue automático

Cada `git push` a `master` dispara un nuevo build en Vercel.

```powershell
cd c:\Users\isela\AndroidStudioProjects\appplantas
git add .
git commit -m "tu mensaje"
git push origin master
```

En el dashboard: **Deployments** → estado **Ready** = producción actualizada.

---

## 5. Despliegue manual (CLI)

```powershell
npm i -g vercel
cd web
vercel --prod
```

Seguir el asistente y enlazar el proyecto existente si ya está creado.

---

## 6. Verificación post-despliegue

### 6.1 Script automatizado

```powershell
cd web
npm run prod:validar
```

Comprueba:

- Páginas: `/`, `/catalogo`, `/planta/283`, `/asistente`
- Imagen en ficha
- API chat (validación vacía + RAG streaming)
- API guía (triaje)
- Conexión Supabase (desde `web/.env.local`)

Resultado JSON: `evidencia/semana7/prod-validacion-resultado.json`

### 6.2 Pruebas RAG (recuperación, sin LLM)

```powershell
cd web
npm run rag:pruebas
```

Esperado: **15/15 OK**. Resultado: `evidencia/rag-pruebas-resultado.json`

### 6.3 Checklist manual en navegador

| Ruta | Qué validar |
|------|-------------|
| `/catalogo` | Listado, búsqueda, filtros, fotos en tarjetas |
| `/planta/283` | Ficha Ajonjolí completa + imagen |
| `/asistente` | Médico Virtual, disclaimer, sugerencias |
| Síntoma → triaje | Sin tarjetas al inicio; preguntas del especialista |
| «¿Qué plantas me recomiendas?» | Recomendación con tarjetas al final |

---

## 7. Errores frecuentes y solución

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Catálogo vacío / error 500 | Supabase mal configurado | Revisar `NEXT_PUBLIC_SUPABASE_*` en Vercel |
| Asistente: «Configura DEEPSEEK_API_KEY» | Falta clave en prod | Añadir `DEEPSEEK_API_KEY` y redeploy |
| Build falla en Vercel | Root directory incorrecto | Debe ser `web`, no raíz del repo |
| Imágenes rotas | URL Supabase incorrecta | Verificar `NEXT_PUBLIC_SUPABASE_URL` sin barra final |
| RAG sin contexto vectorial | Sin Google key en prod | Añadir `GOOGLE_GENERATIVE_AI_API_KEY` o confiar en búsqueda textual |
| 404 en rutas | Deploy antiguo | Forzar redeploy del commit más reciente |

---

## 8. Arquitectura en producción

```text
Usuario (navegador)
    │
    ▼
Vercel Edge / Serverless (Next.js 16 — web/)
    ├── Páginas SSR/SSG: catálogo, fichas, asistente
    ├── /api/chat          → RAG + DeepSeek (stream)
    ├── /api/chat/guia     → Triaje + recomendación multi-agente
    └── /api/chat/plantas  → Tarjetas con imágenes
            │
            ▼
    Supabase (PostgreSQL + pgvector)
    ├── especies, usos, propiedades, imágenes
    └── plant_embeddings (857 chunks / 284 especies)
```

---

## 9. Documentos relacionados

| Documento | Contenido |
|-----------|-----------|
| [`PRUEBAS_PRODUCCION.md`](./PRUEBAS_PRODUCCION.md) | Registro de pruebas en entorno real |
| [`ALUMNO_A_ENTREGABLE_SEMANA_7.md`](./ALUMNO_A_ENTREGABLE_SEMANA_7.md) | Entregable frontend |
| [`ALUMNO_B_ENTREGABLE_SEMANA_7.md`](./ALUMNO_B_ENTREGABLE_SEMANA_7.md) | Entregable backend e IA |
| [`evidencia/MAPEO_CAPTURAS.md`](../evidencia/MAPEO_CAPTURAS.md) | Guía de capturas S7 |

---

## 10. Responsable

| Campo | Valor |
|-------|-------|
| Documento | Proceso de despliegue Semana 7 |
| Fecha | 26 / 07 / 2026 |
| URL verificada | https://proyecto-gzlfs.vercel.app |
