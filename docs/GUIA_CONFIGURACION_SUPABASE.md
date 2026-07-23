# Guía de configuración de Supabase y pgvector — Farmacia Viva

**Proyecto:** Farmacia Viva · VIC 2026  
**Responsable:** Alumno B (Backend e IA)  
**Proyecto Supabase:** PlantasMedicinales  
**ID referencia:** `kkdotmmurqpkrpvrmenr`

Esta guía permite a un desarrollador externo **configurar desde cero** la base de datos, habilitar pgvector, indexar embeddings y conectar la aplicación web.

---

## 1. Requisitos previos

| Requisito | Descripción |
|-----------|-------------|
| Cuenta Supabase | https://supabase.com |
| Proyecto con datos | 284 especies ya cargadas (o restaurar dump del equipo) |
| Node.js 20+ | Para scripts de embeddings |
| Google AI API key | Generación de embeddings (768 dimensiones) |
| Service role key | Solo para scripts locales (nunca en frontend) |

---

## 2. Obtener credenciales

1. Supabase Dashboard → tu proyecto → **Settings** → **API**
2. Copiar:

| Campo Supabase | Variable en `.env.local` |
|----------------|-------------------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role | `SUPABASE_SERVICE_ROLE_KEY` |

> La **service_role** omite RLS. Usarla únicamente en scripts locales (`generate-embeddings.mjs`), nunca en Vercel ni en el navegador.

---

## 3. Variables de entorno locales

```powershell
cd web
copy .env.local.example .env.local
```

Contenido mínimo de `web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://kkdotmmurqpkrpvrmenr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
DEEPSEEK_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=AI...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 4. Habilitar pgvector (migración)

### 4.1 Ejecutar SQL

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Pegar el contenido completo de:

```
supabase/migrations/001_pgvector_embeddings.sql
```

3. **Run**

### 4.2 Qué crea la migración

| Objeto | Descripción |
|--------|-------------|
| `extension vector` | Soporte pgvector |
| `plant_embeddings` | Tabla de chunks con `embedding vector(768)` |
| `plant_embeddings_embedding_idx` | Índice IVFFlat (cosine) |
| `match_plant_embeddings()` | RPC búsqueda por similitud |
| Políticas RLS | Lectura pública; escritura solo service_role |

### 4.3 Verificar

```sql
select count(*) from plant_embeddings;
-- Esperado tras indexación: 857

select id_especie, chunk_type, left(content, 60)
from plant_embeddings
limit 5;
```

---

## 5. Generar embeddings del catálogo

### 5.1 Prueba (10 especies)

```powershell
cd web
npm install
npm run embeddings:test
```

### 5.2 Catálogo completo

```powershell
npm run embeddings
```

El script `supabase/scripts/generate-embeddings.mjs`:

1. Lee especies, usos, propiedades y nombres desde Supabase
2. Genera texto por chunk
3. Llama a Google `gemini-embedding-001` (768 dims)
4. Inserta/actualiza en `plant_embeddings` con service role

**Tiempo estimado:** varios minutos (rate limits de Google API).

### 5.3 Validar indexación

```powershell
npm run embeddings:validar
```

Comprueba conteo, dimensiones y muestra de similitud.

---

## 6. Probar búsqueda vectorial manualmente

En SQL Editor (requiere un vector de prueba; más fácil usar el script):

```powershell
cd web
npm run rag:pruebas
```

Esperado: **15/15 OK**. Resultado: `docs/rag-pruebas-resultado.json`

---

## 7. Conectar la aplicación Next.js

### 7.1 Cliente servidor

`web/src/lib/supabase/server.ts` crea cliente con cookies SSR para API routes.

### 7.2 Llamada RPC desde código

En `web/src/lib/rag.ts`:

```typescript
const { data } = await supabase.rpc("match_plant_embeddings", {
  query_embedding: vectorConsulta,
  match_threshold: 0.5,
  match_count: 8,
});
```

### 7.3 Sin embedding de consulta

Si `GOOGLE_GENERATIVE_AI_API_KEY` no está configurada:

- El RAG sigue operativo con búsqueda SQL (usos, propiedades, texto)
- pgvector no se invoca en runtime

---

## 8. Políticas de seguridad (RLS)

| Rol | `plant_embeddings` | Tablas catálogo |
|-----|-------------------|-----------------|
| `anon` | SELECT | SELECT (lectura pública) |
| `authenticated` | SELECT | Según políticas del proyecto |
| `service_role` | ALL | Bypass RLS (solo scripts) |

**Buenas prácticas:**

- En Vercel: solo `NEXT_PUBLIC_*` y `DEEPSEEK_API_KEY`
- No subir `.env.local` a Git
- Rotar service_role si se expone accidentalmente

---

## 9. Imágenes (Storage)

Las URLs de imágenes vienen de `imagen_especie` apuntando a Supabase Storage.

Verificar en producción:

- `NEXT_PUBLIC_SUPABASE_URL` sin barra final
- Bucket público o política de lectura para `anon`

Helper: `web/src/lib/images.ts`

---

## 10. Despliegue en Vercel (variables Supabase)

En **Vercel → Settings → Environment Variables** (Production):

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon |
| `DEEPSEEK_API_KEY` | API DeepSeek |
| `GOOGLE_GENERATIVE_AI_API_KEY` | (recomendado) embeddings consulta |

**No añadir** `SUPABASE_SERVICE_ROLE_KEY` en Vercel.

Tras cambiar variables → **Redeploy**.

---

## 11. Solución de problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| Catálogo vacío | URL/key incorrecta | Verificar `NEXT_PUBLIC_SUPABASE_*` |
| `plant_embeddings` vacía | No se ejecutó script | `npm run embeddings` |
| RAG sin resultados semánticos | Sin Google key | Añadir key o confiar en fallback SQL |
| Error RPC `match_plant_embeddings` | Migración no aplicada | Ejecutar `001_pgvector_embeddings.sql` |
| Proyecto pausado | Inactividad Supabase free | Reactivar en dashboard |
| 401 en scripts | Service role inválida | Regenerar en Settings → API |

---

## 12. Checklist de configuración completa

```
□ Proyecto Supabase activo
□ Variables en web/.env.local
□ Migración 001_pgvector ejecutada
□ npm run embeddings (857 chunks)
□ npm run embeddings:validar OK
□ npm run rag:pruebas → 15/15
□ npm run dev → catálogo y asistente funcionan
□ Variables en Vercel (sin service_role)
□ npm run prod:validar en producción
```

---

## 13. Referencias en el repositorio

| Archivo | Contenido |
|---------|-----------|
| `supabase/migrations/001_pgvector_embeddings.sql` | DDL pgvector |
| `supabase/scripts/generate-embeddings.mjs` | Indexación |
| `web/src/lib/rag.ts` | Pipeline RAG |
| `web/src/lib/embeddings.ts` | Embedding de consulta |
| `docs/DECISION_RAG.md` | Decisiones técnicas |
| `docs/ALUMNO_B_ENTREGABLE_SEMANA_8.md` | Documentación backend S8 |
