-- Phase 5 (slice 2): Semantic search — pgvector extension + embedding
-- column sa articles, at isang match_articles() RPC function para magamit
-- ng semantic-search.ts (supabase-js ay hindi direktang sumusuporta sa
-- `<=>` distance operator sa loob ng .select(), kaya kailangan ng SQL
-- function na tatawagin via .rpc()).
--
-- Model: Gemini "text-embedding-004" — 768 dimensions, task type
-- RETRIEVAL_DOCUMENT para sa articles, RETRIEVAL_QUERY para sa search
-- queries (see lib/ai/gemini.ts). Kung magpalit ng model/dimension sa
-- hinaharap, kailangang i-drop at i-recreate ang column (iba ang fixed
-- dimension ng bawat pgvector column) at i-backfill ulit ang lahat.

create extension if not exists vector;

alter table articles add column embedding vector(768);

-- HNSW sa halip na IVFFlat — hindi kailangan ng manual "lists" tuning at
-- gumagana nang maayos kahit maliit pa ang dataset (personal na
-- encyclopedia, hindi millions of rows). cosine distance dahil normalized
-- naman ang Gemini embeddings.
create index idx_articles_embedding on articles
  using hnsw (embedding vector_cosine_ops);

-- match_articles: ibinabalik ang mga article na pinaka-malapit (cosine
-- similarity) sa ibinigay na query embedding. Hindi ito SECURITY DEFINER,
-- kaya normal na na-a-apply ang existing `owner_only_articles` RLS policy
-- batay sa authenticated caller. Dagdag pa rin ang explicit
-- `match_owner_id` filter bilang defense-in-depth sa halip na umasa lang
-- sa RLS — mas malinaw din agad sa signature ng function kung sino ang
-- pinagmumulan ng resulta.
create or replace function match_articles(
  query_embedding vector(768),
  match_owner_id uuid,
  match_count int default 10,
  match_types text[] default null
)
returns table (
  id uuid,
  type text,
  title text,
  slug text,
  excerpt text,
  status text,
  similarity float
)
language sql stable
as $$
  select
    articles.id,
    articles.type,
    articles.title,
    articles.slug,
    articles.excerpt,
    articles.status,
    1 - (articles.embedding <=> query_embedding) as similarity
  from articles
  where articles.user_id = match_owner_id
    and articles.embedding is not null
    and (match_types is null or articles.type::text = any(match_types))
  order by articles.embedding <=> query_embedding
  limit match_count;
$$;
