import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/authz";
import { judgeDraftSchema, sanitizeText } from "@/lib/security";
import { writeAuditLog } from "@/lib/audit";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, props: RouteProps) {
  const auth = await requireApiRole("JUDGE");
  if (!auth.ok) return auth.response;
  try {
    const { id } = await props.params;
    const assignment = await prisma.judgeAssignment.findUnique({ where: { id } });
    if (!assignment || assignment.judgeId !== auth.session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = judgeDraftSchema.parse(await request.json());
    const draftPayload = JSON.stringify({
      type: "draft",
      scores: body.scores ?? {},
      feedback: sanitizeText(body.feedback ?? "", 5000),
      savedAt: new Date().toISOString()
    });

    await prisma.judgeAssignment.update({
      where: { id },
      data: {
        status: assignment.status === "PENDING" ? "IN_PROGRESS" : assignment.status,
        feedback: draftPayload
      }
    });

    writeAuditLog({
      actorId: auth.session.user.id,
      actorRole: auth.session.user.role,
      action: "JUDGE_SAVE_DRAFT",
      target: id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
    console.error("Draft save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
