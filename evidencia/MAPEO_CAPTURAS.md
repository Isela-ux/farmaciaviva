# Mapeo de capturas — S4 y S5

Usa esta guía para **renombrar y organizar** las capturas que ya tomaste y ver qué falta.

**Producción:** https://project-gzlfs.vercel.app

---

## Capturas que ya tienes (renombrar y guardar)

| Tu captura | Guardar como | Cubre |
|------------|--------------|-------|
| Vercel → Deployments «Listo» commit fix RAG | `semana4/alumno-b/12_produccion_asistente.png` | B12, A14 |
| Vercel → Environment Variables (nombres sin valores) | `semana4/alumno-b/10_env_local.png` | B10 |
| Asistente: achiote + «y sus contraindicaciones» + tarjeta | `semana5/alumno-b/03_asistente_achiote.png` | B5, B7, B9, S5-B3 |
| Misma captura (tarjeta + respuesta) | `semana5/alumno-a/02_pregunta_respuesta.png` | S5-A2, S5-A3 |
| Misma captura (URL `/asistente` en Vercel) | `semana5/alumno-a/01_asistente_vacio.png` | Parcial S5-A1 *(mejor retomar con chat vacío)* |

---

## Semana 4 — Pendiente de capturar

### Alumno A (`evidencia/semana4/alumno-a/`)

- [ ] A1 — Catálogo general con contador y paginación  
- [ ] A2 — Búsqueda «achiote»  
- [ ] A3 — Filtro familia  
- [ ] A4 — Filtro región  
- [ ] A5 — Filtros combinados  
- [ ] A6 — Tarjeta con foto real  
- [ ] A7 — Encabezado ficha Ajonjolí  
- [ ] A8 — Usos con riesgos/contraindicaciones  
- [ ] A9 — Propiedades / compuestos  
- [ ] A10 — Ubicación en lista con viñetas  
- [ ] A11 — Bibliografía  
- [ ] A12 — «← Volver al catálogo»  
- [ ] A13 — Botón Médico Virtual en ficha  
- [x] A14 — Producción Vercel *(usar captura deploy o URL en catálogo)*  
- [ ] A15 — Foto tutoría  

### Alumno B (`evidencia/semana4/alumno-b/`)

- [ ] B1 — Tabla `plant_embeddings` 857 filas  
- [ ] B2 — SQL `COUNT(*)` → 857  
- [ ] B3 — SQL especies → 284  
- [ ] B4 — IDE con `rag.ts` y `api/chat/route.ts`  
- [x] B5 — Pregunta achiote + respuesta *(captura S5)*  
- [ ] B6 — Pregunta digestivos  
- [x] B7 — Tarjetas con imagen  
- [ ] B8 — Asistente desde ficha `?planta=283`  
- [x] B9 — Seguimiento contraindicaciones  
- [x] B10 — Variables Vercel  
- [ ] B11 — Terminal `npm run build` exitoso  
- [x] B12 — Asistente en producción  
- [ ] B13 — Foto tutoría  

---

## Semana 5 — Pendiente de capturar

### Alumno A (`evidencia/semana5/alumno-a/`)

- [ ] S5-A1 — Asistente vacío (hero + sugerencias + disclaimer)  
- [x] S5-A2 — Pregunta + respuesta  
- [x] S5-A3 — Tarjetas planta  
- [ ] S5-A4 — Flujo desde ficha con `?planta=`  
- [ ] S5-A5 — Disclaimer pie de página (scroll abajo)  
- [ ] S5-A6 — Foto sesión integración  

### Alumno B (`evidencia/semana5/alumno-b/`)

- [ ] S5-B1 — Terminal `npm run rag:pruebas` → **15/15 OK**  
- [ ] S5-B2 — `RAG_PRUEBAS.md` en IDE  
- [x] S5-B3 — Asistente achiote en Vercel  
- [ ] S5-B4 — Pregunta digestivos  
- [ ] S5-B5 — `rag-pruebas-resultado.json`  
- [ ] S5-B6 — Arquitectura archivos RAG  
- [ ] S5-B7 — Foto sesión integración  

---

## Sesión rápida para completar (~20 min)

1. `https://project-gzlfs.vercel.app/catalogo` → A1, A2, buscar achiote → A6  
2. Filtros → A3, A4, A5  
3. `/planta/283?nombre=Ajonjolí` → scroll A7–A12, A13  
4. Supabase → B1–B3  
5. Terminal local → `npm run rag:pruebas` + `npm run build` → B11, S5-B1  
6. `/asistente` vacío → S5-A1; scroll disclaimer → S5-A5  
