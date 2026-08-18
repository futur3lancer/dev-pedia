import type { ArticleStatus } from "@/types/database";
import { Badge } from "@/components/ui/Badge";

// Phase 3 (slice 4): Draft/Published UI polish. Ito ang parehong badge na
// paulit-ulit na naka-inline sa listing pages (encyclopedia/technologies/
// architecture) — dinadala dito para consistent lagi ang itsura, at para
// magamit din sa article detail pages (kung saan wala pa itong ipinapakita
// dati).
export function StatusBadge({ status }: { status: ArticleStatus }) {
  return (
    <Badge tone={status === "published" ? "success" : "warning"} dot>
      {status}
    </Badge>
  );
}
