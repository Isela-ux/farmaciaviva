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

## Decisión (jun 2026)

**Stack seleccionado: Vercel AI SDK + DeepSeek (chat) + pgvector en Supabase**

### Evolución respecto a Semana 1

| Capa | Semana 1 | Semanas 3–4 |
|------|----------|-------------|
| Chat | Google Gemini | **DeepSeek** (`deepseek-chat`) |
| Embeddings indexados | Gemini 768 dims | Sin cambio (857 chunks en BD) |
| Recuperación | pgvector + texto | pgvector + usos/propiedades + texto |

### Justificación del cambio a DeepSeek

1. **Coste y cuota:** menos interrupciones por límites gratuitos en chat.
2. **Misma arquitectura RAG:** solo cambia el modelo de generación.
3. **Embeddings:** DeepSeek no expone API de embeddings; se conservan los vectores ya indexados y la búsqueda ampliada por usos/propiedades.

### Justificación original (Semana 1)

1. **Alineación con el stack base:** Next.js en Vercel, Supabase como backend.
2. **pgvector en Supabase:** Los datos ya viven en PostgreSQL; no hace falta un vector store externo.
3. **Simplicidad:** Menos abstracciones que LangChain/LlamaIndex.
4. **Fallback funcional:** Búsqueda por texto y usos medicinales mantiene el asistente operativo.

## Arquitectura (actual)

```
Usuario → Next.js (asistente) → API /api/chat
                                    ↓
                          1. Recuperación híbrida:
                             - nombre / usos / propiedades (SQL)
                             - pgvector (opcional, embedding consulta)
                          2. streamText(contexto + DeepSeek)
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

## Estado de implementación (jun 2026)

| Componente | Estado |
|------------|--------|
| Migración pgvector | ✅ Ejecutada |
| Tabla `plant_embeddings` | ✅ Creada |
| Embeddings indexados | ✅ 857 chunks (**284 especies**, catálogo completo) |
| Asistente `/asistente` | ✅ RAG híbrido + DeepSeek |
| Catálogo S3 | ✅ Búsqueda, filtros, paginación |
| Fichas S4 | ✅ Completas |
| Deploy Vercel | ✅ (configurar `DEEPSEEK_API_KEY`) |

## Próximos pasos

1. ~~Ejecutar migración SQL en Supabase Dashboard → SQL Editor.~~ ✅
2. ~~Configurar `.env.local` con credenciales de Supabase y Google.~~ ✅
3. ~~Completar script de embeddings~~ ✅ 857 chunks indexados.
4. Desplegar en Vercel con root directory `web`.
