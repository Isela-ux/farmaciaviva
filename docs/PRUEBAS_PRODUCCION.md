# Registro de pruebas en producción — Semana 7

**Entorno:** https://project-gzlfs.vercel.app  
**Fecha de validación:** 26 de julio de 2026  
**Supabase:** PlantasMedicinales (`kkdotmmurqpkrpvrmenr`)

---

## Resumen ejecutivo

| Área | Resultado | Notas |
|------|-----------|-------|
| Despliegue Vercel | ✅ | URL pública accesible |
| Catálogo | ✅ | 284 especies, búsqueda y filtros |
| Fichas + imágenes | ✅ | Ficha Ajonjolí (`/planta/283`) con imagen Supabase |
| Asistente UI | ✅ | Médico Virtual cargado en `/asistente` |
| API RAG `/api/chat` | ✅ | Stream 200 con respuesta anclada |
| API guía `/api/chat/guia` | ✅ | Triaje conversacional operativo |
| Vercel ↔ Supabase | ✅ | REST y consultas desde servidor OK |
| Script `prod:validar` | ✅ | Ver `evidencia/semana7/prod-validacion-resultado.json` |
| Script `rag:pruebas` | ✅ | 15/15 recuperación (misma BD que producción) |

---

## 1. Pruebas de páginas (HTTP)

| # | Prueba | URL | Esperado | Resultado | Fecha |
|---|--------|-----|----------|-----------|-------|
| P1 | Home | `/` | HTTP 200, «Farmacia Viva» | ✅ | 26/07/2026 |
| P2 | Catálogo | `/catalogo` | HTTP 200, listado especies | ✅ | 26/07/2026 |
| P3 | Ficha planta | `/planta/283` | HTTP 200, «Ajonjolí» | ✅ | 26/07/2026 |
| P4 | Asistente | `/asistente` | HTTP 200, «Médico Virtual» | ✅ | 26/07/2026 |

---

## 2. Pruebas de catálogo (manual / navegador)

| # | Caso | Pasos | Resultado | Observaciones |
|---|------|-------|-----------|---------------|
| C1 | Listado general | Abrir `/catalogo` | ✅ | Contador de especies visible |
| C2 | Búsqueda | Buscar «achiote» | ✅ | Resultados filtrados |
| C3 | Filtro familia | Aplicar filtro | ✅ | Lista se actualiza |
| C4 | Filtro región | Aplicar filtro | ✅ | Lista se actualiza |
| C5 | Tarjeta con foto | Ver tarjeta en grid | ✅ | Imagen desde bucket Supabase |
| C6 | Enlace a ficha | Clic en tarjeta | ✅ | Navega a `/planta/{id}` |

---

## 3. Pruebas de fichas e imágenes

| # | Caso | URL | Resultado | Observaciones |
|---|------|-----|-----------|---------------|
| F1 | Encabezado ficha | `/planta/283` | ✅ | Nombre común y científico |
| F2 | Usos y riesgos | Scroll ficha | ✅ | Secciones legibles |
| F3 | Imagen principal | Ficha Ajonjolí | ✅ | Carga desde storage Supabase |
| F4 | Botón asistente | Ficha → Médico Virtual | ✅ | `?planta=` en URL |
| F5 | Volver al catálogo | Enlace superior | ✅ | Navegación correcta |

---

## 4. Pruebas del asistente en producción

| # | Caso | Entrada | Resultado esperado | Resultado |
|---|------|---------|-------------------|-----------|
| A1 | Consulta directa planta | «¿Para qué sirve el ajonjolí?» | Respuesta RAG + tarjetas | ✅ |
| A2 | Síntoma nasal | «ME DUELE MUCHO LA NARIZ» | Triaje sin tarjetas iniciales | ✅ |
| A3 | Respuesta triaje | «congestión y picor» | Sigue preguntando (no reinicia) | ✅ |
| A4 | Pedir plantas en triaje | «¿Qué plantas me recomiendas?» | Recomendación con contexto | ✅ |
| A5 | Usos de planta en chat | «¿Para qué malestares sirve el achiote?» | Consulta catálogo, no clínico | ✅ |
| A6 | Disclaimer | Pie del asistente | Texto sanitario visible | ✅ |
| A7 | Botones escape | «Nuevo malestar» / «Buscar planta» | Cambia modo sin recargar | ✅ |

---

## 5. Pruebas de API (automáticas)

### 5.1 `POST /api/chat`

| Caso | Body | HTTP | Resultado |
|------|------|------|-----------|
| Consulta vacía | `parts: [{ text: "   " }]` | 400 | ✅ |
| RAG ajonjolí | `¿Para qué sirve el ajonjolí medicinal?` | 200 stream | ✅ |

### 5.2 `POST /api/chat/guia`

| Caso | Fase | HTTP | Resultado |
|------|------|------|-----------|
| Triaje nasal | `triaje` + padecimiento respiratorio | 200 JSON | ✅ Texto > 20 caracteres |

### 5.3 Comando de validación

```powershell
cd web
npm run prod:validar
```

Salida guardada en: `evidencia/semana7/prod-validacion-resultado.json`

---

## 6. Pruebas backend — Vercel ↔ Supabase

| # | Prueba | Método | Resultado |
|---|--------|--------|-----------|
| B1 | REST especie (anon key) | `GET /rest/v1/especie?limit=1` | ✅ |
| B2 | Catálogo SSR en Vercel | Página `/catalogo` | ✅ Datos reales |
| B3 | Ficha SSR | `/planta/283` | ✅ Join usos/propiedades |
| B4 | Embeddings en BD | SQL `COUNT(*)` plant_embeddings | ✅ 857 filas |
| B5 | Especies indexadas | SQL `COUNT(DISTINCT id_especie)` | ✅ 284 |

---

## 7. Pruebas pipeline RAG (recuperación)

```powershell
cd web
npm run rag:pruebas
```

| Métrica | Valor |
|---------|-------|
| Preguntas del conjunto | 15 |
| Recuperación correcta | 15/15 |
| Archivo resultado | `evidencia/rag-pruebas-resultado.json` |

> Las pruebas usan la misma base Supabase que Vercel en producción; validan recuperación **sin** llamar al LLM.

---

## 8. Variables de entorno verificadas en Vercel

| Variable | Configurada en prod | Verificación |
|----------|---------------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Catálogo y fichas cargan |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | REST OK |
| `DEEPSEEK_API_KEY` | ✅ | Chat y guía responden (no 503) |

---

## 9. Incidencias y correcciones (Semana 7)

| Incidencia | Corrección | Estado |
|------------|------------|--------|
| Root directory Vercel en raíz del repo | Configurar `web` como root | ✅ Resuelto |
| Tarjetas antes de triaje | Lógica guía conversacional + `useMedicoGuia` | ✅ Resuelto |
| Reinicio al responder «dolor abdominal» | `esRespuestaSintomaEnTriaje` | ✅ Resuelto |
| «Plantas» sacaba del especialista | `esPedidoRecomendacionPlantas` | ✅ Resuelto |

---

## 10. Evidencia visual pendiente (usuario)

| Archivo | Descripción |
|---------|-------------|
| `evidencia/semana7/alumno-a/01_url_produccion.png` | Captura con URL visible |
| `evidencia/semana7/alumno-a/02_catalogo_prod.png` | Catálogo en producción |
| `evidencia/semana7/alumno-a/03_ficha_imagen.png` | Ficha con imagen |
| `evidencia/semana7/alumno-a/04_asistente_triaje.png` | Triaje sin tarjetas |
| `evidencia/semana7/alumno-a/05_asistente_recomendacion.png` | Recomendación final |
| `evidencia/semana7/alumno-b/01_env_vercel.png` | Variables (nombres, sin valores) |
| `evidencia/semana7/alumno-b/02_prod_validar.png` | Terminal `npm run prod:validar` |
| `evidencia/semana7/alumno-b/03_rag_pruebas.png` | Terminal 15/15 OK |
| `evidencia/semana7/sesion_validacion.jpg` | Foto sesión final (ambos) |

Guía completa: [`evidencia/MAPEO_CAPTURAS.md`](../evidencia/MAPEO_CAPTURAS.md)

---

## Firma

| Campo | Valor |
|-------|-------|
| Validado por | Equipo Farmacia Viva |
| Fecha | 26 / 07 / 2026 |
