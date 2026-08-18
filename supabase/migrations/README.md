# Supabase Migrations

Sundin ang phase-by-phase na build order sa `docs/03-roadmap.md`. Huwag
gawin lahat ng tables agad — bawat phase, dagdagan lang ng bagong migration
file.

| File | Phase | Tables |
|---|---|---|
| `0001_phase1_articles.sql` | Phase 1 | `articles` (base fields) |
| `0002_phase2_knowledge_system.sql` (TODO) | Phase 2 | `tags`, `article_tags`, `article_relations`, `article_references`, `errors`, `projects`, `search_vector` column |
| `0003_phase3_versions.sql` (TODO) | Phase 3 | `article_versions` |
| `0009_phase5_embeddings.sql` | Phase 5 | `pgvector` extension, `articles.embedding` column, `match_articles()` RPC |

## Paano i-apply (kapag may Supabase CLI na naka-link)

```bash
supabase db push
```

o kaya i-paste directly sa Supabase Dashboard → SQL Editor kung wala pang
CLI link.
