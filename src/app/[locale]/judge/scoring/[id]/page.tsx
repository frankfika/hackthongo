import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageRole, parseDraftFeedback } from "@/lib/authz";
import { ScoringClient } from "./ScoringClient";

type ScoringPageProps = {
  params: Promise<{ id: string }>;
};

export default async function JudgeScoringPage(props: ScoringPageProps) {
  const session = await requirePageRole("JUDGE");
  if (!session) {
    redirect("/judge/login");
  }

  const { id } = await props.params;
  const assignment = await prisma.judgeAssignment.findUnique({
    where: { id },
    include: {
      projectRound: {
        include: {
          project: true
        }
      },
      scores: true
    }
  });

  if (!assignment || assignment.judgeId !== session.user.id) {
    redirect("/judge/dashboard");
  }

  const criteria = await prisma.scoringCriterion.findMany({ orderBy: { name: "asc" } });
  const draft = parseDraftFeedback(assignment.feedback);
  const savedScores: Record<string, number> = {};

  for (const score of assignment.scores) {
    savedScores[score.criterionId] = score.value;
  }
  if (draft?.scores) {
    Object.assign(savedScores, draft.scores);
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-10">
      <ScoringClient
        assignment={{
          id: assignment.id,
          projectName: assignment.projectRound.project.name,
          status: assignment.status,
          criteria,
          savedScores,
          feedback: draft?.feedback ?? (assignment.status === "COMPLETED" ? assignment.feedback ?? "" : "")
        }}
      />
    </div>
  );
}
