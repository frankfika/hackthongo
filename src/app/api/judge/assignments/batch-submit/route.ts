import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseDraftFeedback } from "@/lib/authz";
import { judgeBatchSubmitSchema, sanitizeText } from "@/lib/security";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const auth = await requireApiRole("JUDGE");
  if (!auth.ok) return auth.response;
  try {
    const body = judgeBatchSubmitSchema.parse(await request.json());
    const assignmentIds = body.assignmentIds;
    if (assignmentIds.length === 0) {
      return NextResponse.json({ submittedCount: 0 });
    }

    const assignments = await prisma.judgeAssignment.findMany({
      where: {
        id: { in: assignmentIds },
        judgeId: auth.session.user.id
      },
      include: { round: true }
    });
    const criteria = await prisma.scoringCriterion.findMany();
    let submittedCount = 0;

    for (const assignment of assignments) {
      if (assignment.round.status !== "JUDGING_OPEN") continue;
      const draft = parseDraftFeedback(assignment.feedback);
      if (!draft?.scores) continue;

      const upserts = [];
      let totalScore = 0;

      for (const criterion of criteria) {
        const raw = Number(draft.scores[criterion.id]);
        if (Number.isNaN(raw)) continue;
        const bounded = Math.min(criterion.maxScore, Math.max(criterion.minScore, raw));
        totalScore += bounded * criterion.weight;
        upserts.push(
          prisma.score.upsert({
            where: { assignmentId_criterionId: { assignmentId: assignment.id, criterionId: criterion.id } },
            update: { value: bounded },
            create: { assignmentId: assignment.id, criterionId: criterion.id, value: bounded }
          })
        );
      }

      await prisma.$transaction([
        ...upserts,
        prisma.judgeAssignment.update({
          where: { id: assignment.id },
          data: {
            status: "COMPLETED",
            totalScore,
            feedback: sanitizeText(String(draft.feedback ?? ""), 5000)
          }
        })
      ]);
      submittedCount += 1;
    }

    writeAuditLog({
      actorId: auth.session.user.id,
      actorRole: auth.session.user.role,
      action: "JUDGE_BATCH_SUBMIT",
      target: "assignments",
      detail: { submittedCount }
    });

    return NextResponse.json({ submittedCount });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
    console.error("Batch submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
