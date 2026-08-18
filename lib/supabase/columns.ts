// Phase 5 (slice 2 follow-up — bandwidth audit): dating select("*") ang
// mga listing page at dashboard widgets na kailangan ng buong `Article`
// shape, na awtomatikong kasama ang `embedding` column (768 floats bawat
// row, idinagdag sa migration 0009) kahit hindi naman ginagamit doon ang
// embedding — naka-flag ito bilang "Known follow-up" sa docs/03-roadmap.md
// mula pa sa slice 2.
//
// ARTICLE_COLUMNS ay ang explicit column list na tumutugma sa `Article`
// interface (types/database.ts) MINUS `embedding` — gamitin ito sa halip
// ng "*" saan man kailangan ang buong article row (hindi partial column
// list). Isang lugar na lang ito papalitan kung magdadagdag pa ng column
// sa `articles` sa hinaharap, sa halip na hanapin isa-isa ang bawat
// `.select("*")` call ulit.
export const ARTICLE_COLUMNS =
  "id, user_id, type, title, slug, subcategory, excerpt, content, cover_image, status, is_favorite, last_viewed_at, created_at, updated_at";
