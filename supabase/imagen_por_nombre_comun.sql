-- Enlaza cada foto a UNA tarjeta de la lista (evita que la misma imagen salga en varias plantas).
-- Supabase → SQL Editor → Run

ALTER TABLE public.imagen_especie
  ADD COLUMN IF NOT EXISTS id_nombre_comun integer REFERENCES public.nombre_comun (id_nombre_comun);

-- Ejemplo: solo Chapulí (id_nombre_comun = 1) muestra la foto de Astrocaryum
-- UPDATE public.imagen_especie
-- SET id_nombre_comun = 1
-- WHERE id_especie = 1;

COMMENT ON COLUMN public.imagen_especie.id_nombre_comun IS
  'Si tiene valor, la app muestra la foto solo en esa fila de nombre_comun.';
