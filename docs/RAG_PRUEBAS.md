# Pruebas RAG — Farmacia Viva

**Proyecto:** Farmacia Viva · VIC 2026  
**Periodo:** Semana 5 (validación inicial)  
**Última ejecución:** ver `rag-pruebas-resultado.json`  
**Comando:** `cd web && npm run rag:pruebas`

---

## Objetivo

Validar que la **recuperación de contexto** (`buscarContextoRAG`) devuelve plantas relevantes del catálogo real de Supabase **antes** de que DeepSeek redacte la respuesta.

> Estas pruebas no llaman al LLM; miden si el pipeline encuentra las especies correctas en la base de datos.

---

## Cómo ejecutar

```bash
cd web
npm run rag:pruebas
```

**Requisitos:** `web/.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

**Salida:**
- Resumen en consola (✅ / ❌ por prueba)
- Archivo `docs/rag-pruebas-resultado.json` con detalle

---

## Nota sobre el catálogo

El cronograma VIC usa ejemplos como «manzanilla», pero **esa especie no está en nuestro catálogo** (`nombre_comun` / `especie` sin coincidencias).  
Las pruebas usan plantas **verificadas en Supabase**: Achiote, Ruda, Ajonjolí, Sábila, Margarita, etc.

Para demostraciones en UI se puede seguir usando preguntas genéricas; para pruebas de recuperación conviene citar nombres del catálogo real.

---

## Conjunto de pruebas (15)

| ID | Consulta | Tipo | Criterio de éxito |
|----|----------|------|-------------------|
| **P01** | ¿Para qué sirve el achiote? | Planta concreta | Recupera Achiote / *Bixa* |
| **P02** | Plantas para problemas digestivos | Síntoma | ≥ 1 planta con usos digestivos |
| **P03** | ¿Qué plantas tienen propiedades antiinflamatorias? | Propiedad | ≥ 1 planta |
| **P04** | ¿Para qué se usa la ruda? | Planta concreta | Recupera Ruda |
| **P05** | ¿Dónde crece el ajonjolí en Tabasco? | Planta + ubicación | Recupera Ajonjolí |
| **P06** | ¿Cuáles son los usos medicinales de la sábila? | Planta concreta | Recupera Sábila |
| **P07** | plantas para la tos | Síntoma | ≥ 1 planta |
| **P08** | ¿La ruda tiene contraindicaciones? | Planta + riesgos | Recupera Ruda |
| **P09** | ¿Cómo se prepara el achiote en decocción? | Preparación | Recupera Achiote |
| **P10** | ¿Qué es Bixa orellana? | Nombre científico | Recupera Achiote |
| **P11** | plantas para quemaduras de la piel | Síntoma | ≥ 1 planta (ej. Sábila) |
| **P12** | ¿Para qué sirve la margarita? | Planta concreta | Recupera Margarita |
| **P13** | ¿Y sus contraindicaciones? *(tras hablar del achiote)* | Seguimiento | Recupera Achiote del historial |
| **P14** | ¿Qué compuestos activos tiene el achiote? | Compuestos | Recupera Achiote |
| **P15** | plantas medicinales para el insomnio o nervios | Síntoma | ≥ 1 planta |

### Historial para P13

```
Usuario:    ¿Para qué sirve el achiote?
Asistente:  El achiote se usa en la región para usos medicinales tradicionales.
Usuario:    ¿Y sus contraindicaciones?
```

---

## Resultado de la última validación local

| Métrica | Valor |
|---------|-------|
| Total pruebas | 15 |
| OK | **15** |
| Fallos | **0** |
| Fecha | 2026-06-24 (tras fix P13) |

### Detalle por prueba

| ID | Estado | Plantas recuperadas |
|----|--------|---------------------|
| P01 | ✅ | Achiote |
| P02 | ✅ | Incienso verde estafiate, Margarita, Anís de estrella |
| P03 | ✅ | Quiebradacha / jaboncillo, Guaco, Incienso verde estafiate |
| P04 | ✅ | Ruda |
| P05 | ✅ | Ajonjolí |
| P06 | ✅ | Sábila |
| P07 | ✅ | Cinco negritos |
| P08 | ✅ | Ruda |
| P09 | ✅ | Achiote |
| P10 | ✅ | Bonxan guano redondo o yucateco, Achiote, Uvita o parra |
| P11 | ✅ | Sábila, Hoja de sapo hierba del topo, Achiote |
| P12 | ✅ | Margarita |
| P13 | ✅ | Achiote (+ otras por búsqueda medicinal en historial) |
| P14 | ✅ | Achiote |
| P15 | ✅ | Zacate limón, Té de la abuela |

### Corrección aplicada (P13)

En consultas de **seguimiento** (`esConsultaDeSeguimiento`), `buscarContextoRAG` ya **no** ejecuta `buscarPlantasPorTexto` sobre el mensaje actual (evita falsos positivos como «con» en «contraindicaciones» → «Chorizo con huevo»). Se consulta primero el **historial** de la conversación, igual que `buscarPlantasParaTarjetas`.

Archivo: `web/src/lib/rag.ts`

---

## Pruebas manuales en interfaz (complementarias)

Después de `npm run dev`, validar en `/asistente` que DeepSeek responde con datos del catálogo:

| # | Pregunta en UI | Qué verificar |
|---|----------------|---------------|
| M1 | ¿Para qué sirve el achiote? | Respuesta con usos; tarjeta Achiote con imagen |
| M2 | Plantas para problemas digestivos | Lista de plantas del catálogo |
| M3 | ¿Y sus contraindicaciones? *(tras M1)* | Mantiene contexto del achiote |
| M4 | Abrir desde ficha `/planta/283?nombre=Ajonjolí` | Sugerencias personalizadas + respuesta sobre Ajonjolí |
| M5 | Pie de página | Disclaimer sanitario visible |

---

## Archivos relacionados

| Archivo | Rol |
|---------|-----|
| `supabase/scripts/rag-pruebas.mjs` | Script de validación |
| `docs/rag-pruebas-resultado.json` | Último resultado JSON |
| `web/src/lib/rag.ts` | Pipeline RAG en producción |
| `docs/DECISION_RAG.md` | Decisión técnica del stack |

---

## Firma / responsable

| Campo | Valor |
|-------|-------|
| Alumno B | _[nombre]_ |
| Fecha validación | 24 / 06 / 2026 |
