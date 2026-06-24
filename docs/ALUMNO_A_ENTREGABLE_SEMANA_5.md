# Entregable Semana 5 — Alumno A (Frontend)

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** 6 al 12 de julio de 2026  
**Rol:** Frontend web  
**Plataforma:** Sitio web Next.js (`web/`)  
**Fecha de entrega:** 12 de julio de 2026

---

## Metas de la semana — cumplimiento

| Meta | Estado | Evidencia en este documento |
|------|--------|----------------------------|
| Construir la interfaz del asistente de consulta | ✅ | Entregable 1 |
| Integrar el frontend con el endpoint del módulo RAG | ✅ | Entregable 2 |
| Mostrar respuestas del asistente en la interfaz | ✅ | Entregable 3 |
| Agregar disclaimers sanitarios básicos | ✅ | Entregable 4 |
| Validar la experiencia de consulta de principio a fin | ✅ | Entregable 5 |

---

## Criterio de aceptación (Semana 5)

> El usuario puede hacer una pregunta sobre plantas medicinales desde la interfaz y recibir una respuesta fundamentada en los datos del sistema.

| Criterio | Estado | Verificación |
|----------|--------|--------------|
| Asistente accesible desde la web | ✅ | `/asistente` + enlace en Header |
| Pregunta enviada desde la UI | ✅ | Formulario + sugerencias rápidas |
| Respuesta visible (streaming) | ✅ | `useChat` + `AssistantMessage` |
| Respuesta basada en catálogo | ✅ | Contexto RAG + tarjetas de plantas |
| Disclaimer sanitario visible | ✅ | Pie del chat |

---

## Entregable 1 — Interfaz del Médico Virtual

### 1.1 Punto de partida (cierre Semana 4)

| Elemento | Estado al 5/jul |
|----------|-----------------|
| Página `/asistente` | ✅ Básica |
| Chat integrado | ✅ Sin pulido pantalla completa |
| Diseño formal | ⚠️ Mejorado en iteración S4 |
| Tarjetas con imagen | ✅ Añadidas en S4 |
| Contexto desde ficha | ✅ `?planta=&nombre=` |

**Objetivo Semana 5:** asistente integrado, usable y demostrable de extremo a extremo.

### 1.2 Interfaz implementada

Archivos principales:

| Archivo | Función |
|---------|---------|
| `web/src/app/asistente/page.tsx` | Server Component; carga planta inicial |
| `web/src/app/asistente/layout.tsx` | Layout pantalla completa |
| `web/src/components/ChatAssistant.tsx` | UI del chat |
| `web/src/components/AssistantMessage.tsx` | Renderizado markdown de respuestas |
| `web/src/components/MedicoVirtualPlantas.tsx` | Tarjetas con imagen y enlace a ficha |

### 1.3 Elementos de la interfaz

| Elemento | Descripción |
|----------|-------------|
| Hero | Cabecera verde/dorada «Médico Virtual · Farmacia Viva» |
| Área de mensajes | Burbujas usuario / asistente con scroll |
| Sugerencias | Chips clicables (genéricas o personalizadas por planta) |
| Bloque planta inicial | Si viene de ficha: tarjeta + enlace «Ver ficha completa» |
| Indicador de carga | «El Médico Virtual está consultando el catálogo…» |
| Formulario | Input + botón Enviar (deshabilitado mientras carga) |

---

## Entregable 2 — Integración con el endpoint RAG

### 2.1 Conexión frontend ↔ backend

```text
ChatAssistant.tsx
  ├── useChat({ transport: DefaultChatTransport({ api: "/api/chat" }) })
  └── fetch("/api/chat/plantas") → tarjetas con imagen tras cada respuesta
```

| Endpoint | Método | Uso en UI |
|----------|--------|-----------|
| `/api/chat` | POST | Streaming de respuestas del asistente |
| `/api/chat/plantas` | POST | Plantas mencionadas para tarjetas visuales |

### 2.2 Flujo de datos

```
Usuario escribe pregunta
  → POST /api/chat (mensajes completos)
  → Servidor: buscarContextoRAG() + DeepSeek
  → Stream SSE a la UI
  → Paralelo: POST /api/chat/plantas
  → MedicoVirtualPlantas bajo el mensaje del asistente
```

### 2.3 Manejo de errores en UI

| Situación | Mensaje al usuario |
|-----------|-------------------|
| Sin `DEEPSEEK_API_KEY` | Aviso para configurar `.env.local` |
| Error de API / cuota | Mensaje amigable en el stream |

---

## Entregable 3 — Visualización de respuestas

### 3.1 Formato de respuestas

`AssistantMessage.tsx` procesa la salida del modelo:

- Limpieza de referencias técnicas (`[1]`, `Especie #`, etc.)
- Markdown: negritas, listas con viñetas doradas
- Varias plantas: tarjetas con encabezado `## Nombre común`

### 3.2 Tarjetas de plantas

`plantasVisibles()` muestra tarjetas solo cuando:

- La planta aparece en la **consulta del usuario**, o
- La planta se menciona en la **respuesta completada** del asistente

Evita imágenes irrelevantes en preguntas genéricas.

---

## Entregable 4 — Disclaimers sanitarios

### 4.1 En la interfaz (pie fijo)

Texto visible en todo momento bajo el formulario:

> **Información educativa — no sustituye consejo médico profesional.** [Ver catálogo]

Ubicación: `ChatAssistant.tsx` (footer del panel de chat).

### 4.2 En el prompt del sistema

`construirPromptSistema()` en `rag.ts` incluye la regla:

> Incluye una breve advertencia de consultar a un profesional de salud.

### 4.3 Texto introductorio

Al abrir el asistente sin mensajes:

> Pregunta sobre usos, propiedades, preparaciones o ubicación. Las respuestas incluyen la imagen y datos de las plantas del catálogo.

---

## Entregable 5 — Flujo de consulta validado

### 5.1 Rutas de acceso

| Origen | Destino |
|--------|---------|
| Header «Médico Virtual» | `/asistente` |
| Home → CTA | `/asistente` |
| Ficha → «Consultar al Médico Virtual» | `/asistente?planta=[id]&nombre=[nombre]` |
| Catálogo → Header | `/asistente` |

### 5.2 Flujos probados

| # | Flujo | Estado |
|---|-------|--------|
| 1 | Abrir asistente → sugerencia → respuesta | ✅ |
| 2 | Escribir pregunta manual → Enviar → respuesta | ✅ |
| 3 | Pregunta con planta del catálogo (achiote) | ✅ |
| 4 | Pregunta por síntoma (digestivos) | ✅ |
| 5 | Ficha Ajonjolí → asistente con contexto | ✅ |
| 6 | Tarjeta planta → enlace a ficha | ✅ |
| 7 | Disclaimer visible durante la consulta | ✅ |

---

## Entregable 6 — Despliegue

| Elemento | Estado |
|----------|--------|
| Local `npm run dev` | ✅ `/asistente` HTTP 200 |
| Vercel producción | ✅ `project-gzlfs.vercel.app` — deploy `fb96c7d` Listo |
| `DEEPSEEK_API_KEY` en Vercel | ✅ Configurada |
| Demo achiote + seguimiento | ✅ Verificado en producción |

---

## Cierre de entrega

| Elemento | Estado |
|----------|--------|
| Interfaz + integración RAG | ✅ |
| Disclaimers | ✅ |
| Producción | ✅ |
| Evidencia visual | ⚠️ Ver [`evidencia/MAPEO_CAPTURAS.md`](../evidencia/MAPEO_CAPTURAS.md) |

---

## Lista de capturas — Alumno A (Semana 5)

| # | Archivo | Qué capturar |
|---|---------|--------------|
| S5-A1 | `01_asistente_vacio.png` | `/asistente` con hero, sugerencias y disclaimer |
| S5-A2 | `02_pregunta_respuesta.png` | Pregunta enviada + respuesta visible |
| S5-A3 | `03_tarjetas_planta.png` | Tarjetas con imagen bajo la respuesta |
| S5-A4 | `04_desde_ficha.png` | Flujo ficha → asistente con `?planta=` en URL |
| S5-A5 | `05_disclaimer.png` | Pie con texto sanitario legible |
| S5-A6 | `06_sesion_integracion.jpg` | Foto sesión de integración con el equipo |

### Checklist evidencia S5 — Alumno A

- [ ] S5-A1 — Asistente vacío + disclaimer  
- [x] S5-A2 — Pregunta + respuesta (achiote en Vercel)  
- [x] S5-A3 — Tarjetas con imagen  
- [ ] S5-A4 — Flujo desde ficha  
- [ ] S5-A5 — Disclaimer pie legible  
- [ ] S5-A6 — Foto sesión  

> Guía: [`evidencia/MAPEO_CAPTURAS.md`](../evidencia/MAPEO_CAPTURAS.md)

---

## Firma / responsable

| Campo | Valor |
|-------|-------|
| Alumno A | _[nombre]_ |
| Fecha | 12 / 07 / 2026 |
