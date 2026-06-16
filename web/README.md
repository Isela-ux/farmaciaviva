# Farmacia Viva — Web

Plataforma web del proyecto VIC 2026: catálogo de plantas medicinales, fichas completas y asistente RAG.

## Stack

- **Frontend:** Next.js 16 + React + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + pgvector)
- **IA:** Vercel AI SDK + Google Gemini
- **Despliegue:** Vercel

## Inicio rápido

### 1. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completa con las mismas credenciales que usa la app Android (`local.properties`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY` — [Google AI Studio](https://aistudio.google.com/apikey)
- `SUPABASE_SERVICE_ROLE_KEY` — solo para el script de embeddings

### 2. Migración pgvector

En Supabase Dashboard → SQL Editor, ejecuta:

```
supabase/migrations/001_pgvector_embeddings.sql
```

### 3. Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 4. Indexar embeddings (RAG)

```bash
# Prueba con 10 especies
node ../supabase/scripts/generate-embeddings.mjs --limit=10

# Catálogo completo (~500 plantas)
node ../supabase/scripts/generate-embeddings.mjs
```

### 5. Desplegar en Vercel

1. Importa el repositorio en [vercel.com](https://vercel.com)
2. **Root Directory:** `web`
3. Añade las variables de entorno
4. Deploy

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Inicio con plantas destacadas |
| `/catalogo` | Catálogo con búsqueda y filtro por familia |
| `/planta/[id]` | Ficha completa de la especie |
| `/asistente` | Chat con RAG |
| `/api/chat` | API del asistente |

## Documentación

- Decisión técnica RAG: `../docs/DECISION_RAG.md`
