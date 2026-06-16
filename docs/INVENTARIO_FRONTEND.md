# Inventario del estado actual del frontend web — Semana 1

**Proyecto:** Farmacia Viva · VIC 2026  
**Plataforma:** Sitio web Next.js (`web/`)  
**Fecha:** 15 de junio de 2026  
**Responsable:** Alumno A (Frontend)

---

## 1. Resumen ejecutivo

| Área | Avance estimado | Estado |
|------|-----------------|--------|
| Especificación y diseño | ~15 % (inicio semana 1) | Paleta botánica y flujos definidos |
| Implementación web | ~45 % (cierre semana 1) | Inicio, catálogo, ficha y asistente operativos |

---

## 2. Componentes implementados

| Ruta | Componente | Estado |
|------|------------|--------|
| `/` | `app/page.tsx` | ✅ |
| `/catalogo` | `PlantCatalog.tsx` | ✅ |
| `/planta/[id]` | `PlantDetailView.tsx` | ✅ |
| `/asistente` | `ChatAssistant.tsx` | ✅ |
| Layout global | `Header.tsx`, `layout.tsx` | ✅ |
| API chat | `api/chat/route.ts` | ✅ |

**Stack:** Next.js 16, React 19, Tailwind CSS 4, TypeScript.

---

## 3. Estructura de páginas (sitemap)

```
/                          Inicio
├── /catalogo              Catálogo con búsqueda y filtros
├── /planta/[id]           Ficha detallada
└── /asistente             Consultas RAG
```

**Navegación:** `[ Inicio ]  [ Catálogo ]  [ Asistente ]`

---

## 4. Lo que falta construir

| Prioridad | Elemento | Semana sugerida |
|-----------|----------|-----------------|
| Alta | Despliegue en Vercel | 2 |
| Media | Página "Acerca de" / créditos VIC | 2 |
| Media | Favoritos | 3+ |
| Media | SEO (metadata, sitemap.xml) | 2–3 |

---

## 5. Entorno de desarrollo

```bash
cd web
npm install
cp .env.local.example .env.local
npm run dev
```

**Estado:** ✅ Listo (`npm run build` exitoso).

---

## 6. Evidencia sugerida

- [ ] Captura de `http://localhost:3000`
- [ ] Captura de `/catalogo`
- [ ] Captura de `/planta/[id]`
- [ ] Captura de `/asistente`
- [ ] Captura de estructura `web/src/`
