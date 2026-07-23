# Comentarios de fase de prueba

Los usuarios envían feedback desde **Catálogo** → sección **Enviar comentarios**.

## Dónde los vemos (equipo VIC)

1. Entra a [Supabase Dashboard](https://supabase.com/dashboard) con la cuenta del proyecto **PlantasMedicinales**.
2. Abre el proyecto (`kkdotmmurqpkrpvrmenr`).
3. Menú izquierdo → **Table Editor**.
4. Tabla: **`comentarios_prueba`**.

Ahí verán: nombre, correo, tipo (bug/mejora/duda/otro), comentario, página y fecha (`created_at`).

> Solo ustedes (dueños del proyecto) pueden leer la tabla. El público solo puede **enviar**, no listar.

## Activar la tabla (una sola vez)

En Supabase → **SQL Editor** → New query → pegar y ejecutar:

`supabase/migrations/002_comentarios_prueba.sql`

## API

`POST /api/comentarios` — usada por el formulario en `/catalogo`.
