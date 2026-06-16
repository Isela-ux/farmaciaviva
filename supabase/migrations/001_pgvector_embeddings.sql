-- Habilitar extensión pgvector para búsqueda semántica
create extension if not exists vector;

-- Tabla de chunks embeddables por especie
create table if not exists public.plant_embeddings (
  id bigserial primary key,
  id_especie integer not null references public.especie(id_especie) on delete cascade,
  chunk_type text not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding vector(768),
  created_at timestamptz default now(),
  unique (id_especie, chunk_type, content)
);

create index if not exists plant_embeddings_embedding_idx
  on public.plant_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists plant_embeddings_especie_idx
  on public.plant_embeddings (id_especie);

-- Función de búsqueda por similitud coseno
create or replace function public.match_plant_embeddings(
  query_embedding vector(768),
  match_threshold float default 0.5,
  match_count int default 8
)
returns table (
  id bigint,
  id_especie integer,
  chunk_type text,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    pe.id,
    pe.id_especie,
    pe.chunk_type,
    pe.content,
    pe.metadata,
    1 - (pe.embedding <=> query_embedding) as similarity
  from public.plant_embeddings pe
  where pe.embedding is not null
    and 1 - (pe.embedding <=> query_embedding) > match_threshold
  order by pe.embedding <=> query_embedding
  limit match_count;
$$;

-- Lectura pública para el asistente (anon key)
alter table public.plant_embeddings enable row level security;

create policy "Lectura pública de embeddings"
  on public.plant_embeddings
  for select
  to anon, authenticated
  using (true);

-- Solo service role puede escribir (script de indexación)
create policy "Escritura solo service role"
  on public.plant_embeddings
  for all
  to service_role
  using (true)
  with check (true);
