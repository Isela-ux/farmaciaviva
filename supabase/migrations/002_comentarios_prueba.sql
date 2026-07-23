-- Comentarios de fase de prueba (feedback de usuarios en /catalogo)
-- Lectura: solo desde Dashboard Supabase (equipo VIC).
-- Escritura: insert público con anon key (formulario web).

create table if not exists public.comentarios_prueba (
  id bigserial primary key,
  nombre text,
  correo text,
  tipo text not null check (tipo in ('bug', 'mejora', 'duda', 'otro')),
  comentario text not null,
  pagina text default '/catalogo',
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists comentarios_prueba_created_at_idx
  on public.comentarios_prueba (created_at desc);

alter table public.comentarios_prueba enable row level security;

-- Cualquiera puede enviar un comentario (fase de prueba)
create policy "Insert público de comentarios de prueba"
  on public.comentarios_prueba
  for insert
  to anon, authenticated
  with check (
    char_length(trim(comentario)) >= 10
    and char_length(comentario) <= 2000
    and tipo in ('bug', 'mejora', 'duda', 'otro')
  );

-- No hay política SELECT para anon: el público no lista comentarios.
-- El equipo los ve en Supabase Dashboard → Table Editor (acceso de proyecto).
