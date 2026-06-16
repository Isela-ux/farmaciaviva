# Decisión técnica del stack RAG — Farmacia Viva

**Fecha:** Junio 2026  
**Equipo:** VIC 2026  
**Estado:** Aprobado para implementación

## Opciones evaluadas

| Opción | Pros | Contras | Compatibilidad |
|--------|------|---------|----------------|
| **Vercel AI SDK + pgvector directo** | Integración nativa con Next.js y Vercel; streaming; menos capas; Gemini gratuito | Hay que escribir prompt y retrieval manualmente | ✅ Alta |
| LangChain | Ecosistema amplio, muchos conectores | Pesado para MVP; curva de aprendizaje; más dependencias | Media |
| LlamaIndex | Bueno para indexación documental | Orientado a Python/Node con más setup; exceso para catálogo relacional | Media |
| Solo keyword search | Sin coste de API | No responde preguntas semánticas (“plantas para el estómago”) | ✅ Como fallback |

## Decisión

**Stack seleccionado: Vercel AI SDK + Google Gemini + pgvector en Supabase**

### Justificación

1. **Alineación con el stack base:** Next.js en Vercel, Supabase como backend, recursos gratuitos.
2. **Gemini (`gemini-embedding-001` + `gemini-2.5-flash`):** API gratuita; modelos verificados en el proyecto (jun 2026).
3. **pgvector en Supabase:** Los datos ya viven en PostgreSQL; no hace falta un vector store externo.
4. **Simplicidad:** Menos abstracciones que LangChain/LlamaIndex para un catálogo de ~500 especies con chunks estructurados.
5. **Fallback funcional:** Si los embeddings no están listos, búsqueda por texto en `nombre_comun` mantiene el asistente operativo.

## Arquitectura

```
Usuario → Next.js (asistente) → API /api/chat
                                    ↓
                          1. embed(consulta) — Gemini
                          2. RPC match_plant_embeddings — Supabase/pgvector
                          3. streamText(contexto + Gemini)
```

## Componentes implementados

| Componente | Ubicación |
|------------|-----------|
| Frontend web | `web/` |
| Cliente Supabase | `web/src/lib/supabase/` |
| Capa de datos | `web/src/lib/plants.ts` |
| Módulo RAG | `web/src/lib/rag.ts` + `web/src/app/api/chat/route.ts` |
| Migración pgvector | `supabase/migrations/001_pgvector_embeddings.sql` |
| Script de embeddings | `supabase/scripts/generate-embeddings.mjs` |

## Variables de entorno requeridas

Ver `web/.env.local.example`.

## Estado de implementación (15 jun 2026)

| Componente | Estado |
|------------|--------|
| Migración pgvector | ✅ Ejecutada |
| Tabla `plant_embeddings` | ✅ Creada |
| Embeddings indexados | ✅ 857 chunks (catálogo completo) |
| Asistente `/asistente` | ✅ Funcional con RAG híbrido |
| Deploy Vercel | 🔲 Pendiente |

## Próximos pasos

1. ~~Ejecutar migración SQL en Supabase Dashboard → SQL Editor.~~ ✅
2. ~~Configurar `.env.local` con credenciales de Supabase y Google.~~ ✅
3. ~~Completar script de embeddings~~ ✅ 857 chunks indexados.
4. Desplegar en Vercel con root directory `web`.
