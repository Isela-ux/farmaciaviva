# Inventario del estado actual — Backend, embeddings e IA

**Proyecto:** Farmacia Viva · VIC 2026  
**Fecha:** 15 de junio de 2026  
**Responsable:** Alumno B (Backend e IA)  
**Supabase:** PlantasMedicinales (`kkdotmmurqpkrpvrmenr`)

---

## 1. Resumen ejecutivo

| Área | % avance | Estado al 15-jun-2026 |
|------|----------|------------------------|
| Base de datos relacional | ~90 % | 284 especies, fichas completas en Supabase |
| Infraestructura pgvector | ~100 % | Migración ejecutada, tabla `plant_embeddings` creada |
| Embeddings indexados | **100 %** | **857 chunks** — catálogo completo (284 especies) |
| Asistente IA (prototipo) | ~60 % | Chat funcional con RAG híbrido + historial de conversación |
| Despliegue web | 0 % | Pendiente Vercel |

---

## 2. Base de datos Supabase — tablas en uso

| Tabla | Registros (aprox.) | Uso |
|-------|-------------------|-----|
| `especie` | 284 | Datos botánicos principales |
| `nombre_comun` | 289 | Catálogo por nombre común |
| `imagen_especie` | — | Fotos en tarjetas y fichas |
| `uso_planta` | — | Usos medicinales (RAG) |
| `especie_propiedad` / `propiedad` | — | Propiedades |
| `especie_compuesto` / `compuesto_activo` | — | Compuestos activos |
| `especie_habitat` / `habitat` | — | Hábitat |
| `especie_ubicacion` / `ubicacion_geografica` | — | Distribución geográfica |
| `detalle_fuente_especie` / `fuente` | — | Bibliografía |
| `plant_embeddings` | 857 | Vectores para búsqueda semántica |

**Cliente configurado en:** `web/src/lib/supabase/` (lectura con anon key desde el servidor Next.js).

---

## 3. Estado de pgvector y embeddings

### Infraestructura (completada)

- [x] Extensión `vector` habilitada
- [x] Tabla `plant_embeddings` (768 dimensiones)
- [x] Función RPC `match_plant_embeddings`
- [x] Políticas RLS (lectura pública, escritura service_role)
- [x] Script de indexación: `supabase/scripts/generate-embeddings.mjs`

### Indexación de datos

| Métrica | Valor |
|---------|-------|
| Especies en BD | 284 |
| Chunks en `plant_embeddings` | **857** |
| Cobertura | **100 %** del catálogo |

**Tipos de chunk generados:** `botanica`, `nombre_comun`, `uso`, `propiedad`

### Indexación completada

```bash
cd web
npm run embeddings:test   # prueba (10 especies)
npm run embeddings        # catálogo completo — ✅ ejecutado (857 chunks)
```

---

## 4. Prototipo de asistente IA

| Característica | Estado |
|----------------|--------|
| UI de chat (`/asistente`) | ✅ |
| API streaming (`/api/chat`) | ✅ |
| Modelo de chat | Google Gemini `gemini-2.5-flash` |
| Modelo de embeddings | Google `gemini-embedding-001` (768 dims) |
| Retrieval pgvector | ✅ (cuando hay embeddings) |
| Fallback búsqueda por texto | ✅ |
| Memoria de conversación (seguimiento) | ✅ |
| Ficha completa en contexto | ✅ |

### Flujo RAG actual

```
Consulta del usuario
    ↓
¿Planta mencionada en el historial? → Cargar ficha completa
    ↓ (si no)
Búsqueda pgvector (match_plant_embeddings)
    ↓ (si vacío)
Búsqueda por palabras clave en catálogo
    ↓
Gemini responde con contexto recuperado
```

---

## 5. Compatibilidad Supabase + Next.js

| Aspecto | Resultado |
|---------|-----------|
| Lectura con anon key | ✅ Verificado |
| SSR con `@supabase/ssr` | ✅ |
| RPC pgvector desde servidor | ✅ |
| Escritura embeddings (service_role) | ✅ Verificado (857 chunks) |
| Imágenes desde Storage | ✅ URLs en `imagen_especie` |

---

## 6. Variables de entorno

| Variable | Uso | Configurada |
|----------|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente web (Next.js) | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Lectura pública | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Script embeddings | ✅ |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Chat + embeddings | ✅ |

---

## 7. Riesgos y pendientes inmediatos

| Riesgo | Mitigación |
|--------|------------|
| Proyecto Supabase pausado por inactividad | Reactivar desde dashboard; considerar plan Pro si es recurrente |
| Embeddings incompletos | ~~Ejecutar `npm run embeddings`~~ ✅ Completado (857 chunks) |
| Cuota Gemini gratuita | Usar `gemini-2.5-flash`; pausas en script |
| service_role expuesta | Solo en `.env.local`, nunca en Git ni cliente |

---

## 8. Evidencia sugerida

- [ ] Captura Table Editor: tabla `plant_embeddings` con filas
- [ ] Captura SQL Editor: migración ejecutada
- [ ] Captura `/asistente` con pregunta semántica respondida
- [ ] Captura Settings → API en Supabase (sin mostrar keys)
