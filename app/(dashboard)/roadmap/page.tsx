import Link from "next/link";
import { getSkillRoadmap } from "@/lib/actions/skill-roadmap";
import { articleTypePath } from "@/lib/utils";
import type { RoadmapStepState } from "@/lib/actions/skill-roadmap";

// Phase 5 (slice 4): Skill roadmap page. Bawat "path" (connected
// component ng depends-on edges) ay isang vertical step list — hindi
// pa masyadong ambisyoso ang layout (walang branching visualization,
// straight na listahan kahit magka-branch ang dependencies) dahil
// sapat na ito sa scale ng personal na encyclopedia; kung lalaki pa ito
// balang araw (maraming branch bawat path), doon pa lang worth i-upgrade
// sa tunay na tree/DAG na layout gaya ng KnowledgeGraph.

const STATE_STYLES: Record<
  RoadmapStepState,
  { dot: string; label: string; text: string }
> = {
  done: {
    dot: "bg-emerald-500",
    label: "Done",
    text: "text-foreground",
  },
  next: {
    dot: "bg-amber-500",
    label: "Next up",
    text: "text-foreground",
  },
  locked: {
    dot: "bg-muted-foreground/30",
    label: "Locked",
    text: "text-muted-foreground",
  },
};

export default async function RoadmapPage() {
  const paths = await getSkillRoadmap();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Skill Roadmap</h1>
        <p className="text-sm text-muted-foreground">
          Visual na progress path base sa "depends-on" relations sa
          pagitan ng mga article (hal. React → Next.js → Auth →
          Deployment). Gawa ito sa "Related Concepts" editor ng bawat
          article — piliin ang "depends-on" bilang relation type.
        </p>
      </div>

      {paths.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Wala pang roadmap na makikita. Gumawa ng "depends-on" relation
          sa pagitan ng dalawang article (sa Related Concepts editor) para
          lumabas dito bilang isang path.
        </p>
      ) : (
        <div className="space-y-10">
          {paths.map((path, pathIndex) => {
            const doneCount = path.steps.filter(
              (s) => s.state === "done"
            ).length;

            return (
              <div key={pathIndex} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    Path {pathIndex + 1}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {doneCount} / {path.steps.length} done
                  </span>
                </div>

                {path.hasCycle && (
                  <p className="rounded-md bg-warning/15 px-3 py-2 text-xs text-warning">
                    May circular na "depends-on" relations sa path na ito
                    — hindi na-guarantee ang pagkakasunod-sunod sa ibaba
                    para sa mga apektadong steps.
                  </p>
                )}

                <ol className="space-y-0">
                  {path.steps.map((step, stepIndex) => {
                    const style = STATE_STYLES[step.state];
                    const isLast = stepIndex === path.steps.length - 1;

                    return (
                      <li key={step.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`}
                          />
                          {!isLast && (
                            <span className="w-px flex-1 bg-border" />
                          )}
                        </div>
                        <div className="pb-6">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/${articleTypePath(step.type)}/${step.slug}`}
                              className={`font-medium hover:underline ${style.text}`}
                            >
                              {step.title}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {style.label}
                            </span>
                          </div>
                          {step.requiresTitles.length > 0 && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Requires: {step.requiresTitles.join(", ")}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
