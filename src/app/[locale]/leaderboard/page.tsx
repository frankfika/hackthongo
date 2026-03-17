import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PageTitleBar } from "@/components/PageTitleBar";

export default async function LeaderboardPage() {
  const t = await getTranslations("Leaderboard");
  
  // Fetch only PROMOTED projects for the leaderboard
  const promotedProjects = await prisma.projectRound.findMany({
    where: { promotionStatus: "PROMOTED" },
    include: {
      project: true,
      round: true
    },
    orderBy: {
      avgScore: 'desc'
    }
  });

  return (
    <div className="mx-auto max-w-[800px] px-6 py-12 md:py-20 fade-in slide-up">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t("title")}
        </h1>
        <p className="mx-auto max-w-[600px] text-lg text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {promotedProjects.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/30 py-20 text-center fade-in stagger-2">
          <p className="text-lg font-medium text-foreground">The leaderboard is currently empty.</p>
          <p className="mt-2 text-muted-foreground">Results will be published after judging is complete.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {promotedProjects.map((pr, index) => (
            <div 
              key={pr.id} 
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-sm md:p-8 group"
            >
              <div className="flex items-center gap-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold transition-colors ${
                  index === 0 ? 'bg-primary/10 text-primary border border-primary/20' :
                  index === 1 ? 'bg-slate-500/10 text-slate-500 border border-slate-500/20' :
                  index === 2 ? 'bg-amber-600/10 text-amber-600 border border-amber-600/20' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {pr.project.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {pr.round.name}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold tracking-tight text-foreground md:text-4xl tabular-nums">
                  {pr.avgScore?.toFixed(2) || '-.--'}
                </div>
                <div className="mt-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Avg Score
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
