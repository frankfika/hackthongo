import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/authz";
import { judgeSubmitSchema, sanitizeText } from "@/lib/security";
import { writeAuditLog } from "@/lib/audit";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, props: RouteProps) {
  const auth = await requireApiRole("JUDGE");
  if (!auth.ok) return auth.response;
  try {
    const { id } = await props.params;
    const assignment = await prisma.judgeAssignment.findUnique({
      where: { id },
      include: { round: true }
    });
    if (!assignment || assignment.judgeId !== auth.session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (assignment.round.status !== "JUDGING_OPEN") {
      return NextResponse.json({ error: "当前轮次不允许提交评分" }, { status: 400 });
    }

    const body = judgeSubmitSchema.parse(await request.json());
    const scores = body.scores ?? {};
    const feedback = sanitizeText(body.feedback ?? "", 5000);
    const criteria = await prisma.scoringCriterion.findMany();
    const scoreUpserts = [];
    let totalScore = 0;

    for (const criterion of criteria) {
      const raw = Number(scores[criterion.id]);
      if (Number.isNaN(raw)) continue;
      const bounded = Math.min(criterion.maxScore, Math.max(criterion.minScore, raw));
      totalScore += bounded * criterion.weight;
      scoreUpserts.push(
        prisma.score.upsert({
          where: { assignmentId_criterionId: { assignmentId: id, criterionId: criterion.id } },
          update: { value: bounded },
          create: {
            assignmentId: id,
            criterionId: criterion.id,
            value: bounded
          }
        })
      );
    }

    if (scoreUpserts.length === 0) {
      return NextResponse.json({ error: "至少填写一项评分后才能提交" }, { status: 400 });
    }

    await prisma.$transaction([
      ...scoreUpserts,
      prisma.judgeAssignment.update({
        where: { id },
        data: {
          status: "COMPLETED",
          totalScore,
          feedback
        }
      })
    ]);

    writeAuditLog({
      actorId: auth.session.user.id,
      actorRole: auth.session.user.role,
      action: "JUDGE_SUBMIT_SCORE",
      target: id,
      detail: { totalScore }
    });

    return NextResponse.json({ success: true, totalScore });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
    console.error("Judge submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
