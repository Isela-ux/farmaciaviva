# Evidencia Semana 8 — Farmacia Viva VIC 2026

**Periodo:** 27 jul – 3 ago 2026  
**Documentación:** [`docs/SEMANA_8_ENTREGABLES.md`](../docs/SEMANA_8_ENTREGABLES.md)

---

## Carpetas

```
evidencia/semana8/
├── alumno-a/          ← Frontend: producción, árbol, Vercel
├── alumno-b/          ← Backend: Supabase, pruebas RAG/medico
└── tutoria/           ← Foto sesión con asesor
```

---

## Checklist Alumno A (Frontend)

| ID | Captura | Archivo sugerido |
|----|---------|------------------|
| S8-A1 | Inicio `/` en producción | `S8-A1-inicio.png` |
| S8-A2 | Catálogo con búsqueda | `S8-A2-catalogo.png` |
| S8-A3 | Ficha `/planta/283` | `S8-A3-ficha.png` |
| S8-A4 | Asistente: opciones del árbol (`me siento mal`) | `S8-A4-arbol.png` |
| S8-A5 | Sub-opciones tras «Dolor» | `S8-A5-dolor-opciones.png` |
| S8-A6 | Guardrail urgente (`sangrado abundante`) | `S8-A6-urgente.png` |
| S8-A7 | Vercel deploy Ready | `S8-A7-vercel.png` |
| S8-A8 | `npm run build` exitoso | `S8-A8-build.png` |

---

## Checklist Alumno B (Backend e IA)

| ID | Captura | Archivo sugerido |
|----|---------|------------------|
| S8-B1 | Supabase: `plant_embeddings` 857 filas | `S8-B1-embeddings.png` |
| S8-B2 | SQL: función `match_plant_embeddings` | `S8-B2-rpc.png` |
| S8-B3 | `npm run rag:pruebas` → 15/15 | `S8-B3-rag.png` |
| S8-B4 | `npm run medico:pruebas` → 23/23 | `S8-B4-medico.png` |
| S8-B5 | Recomendación + tarjetas alineadas | `S8-B5-tarjetas.png` |
| S8-B6 | Filtro injection rechazado | `S8-B6-injection.png` |
| S8-B7 | Variables Vercel (sin service_role) | `S8-B7-env.png` |

---

## Checklist ambos

| ID | Evidencia |
|----|-----------|
| S8-T1 | Fotografía tutoría / revisión con asesor |
| S8-T2 | Plataforma funcionando en https://proyecto-gzlfs.vercel.app |

---

## Comandos para generar evidencia de pruebas

```powershell
cd web
npm run medico:pruebas
npm run rag:pruebas
npm run prod:validar
```
