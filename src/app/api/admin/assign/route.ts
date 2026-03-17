import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignSchema, isTrustedOrigin } from "@/lib/security";
import { requireApiRole } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { createRequestId, logError, logPerf, logSecurityEvent } from "@/lib/observability";
import type { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  const startedAt = Date.now();
  const requestId = createRequestId(req.headers);
  try {
    if (!isTrustedOrigin(req.headers, req.url)) {
      logSecurityEvent("forbidden_origin_admin_assign", { route: "/api/admin/assign", requestId });
      const response = NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
      response.headers.set("X-Request-Id", requestId);
      logPerf("/api/admin/assign", "POST", Date.now() - startedAt, 403, requestId);
      return response;
    }
    const auth = await requireApiRole("ADMIN");
    if (!auth.ok) {
      const response = auth.response;
      response.headers.set("X-Request-Id", requestId);
      logPerf("/api/admin/assign", "POST", Date.now() - startedAt, 401, requestId);
      return response;
    }

    const { roundId, judgesPerProject } = assignSchema.parse(await req.json());

    if (!roundId) {
      const response = NextResponse.json({ error: "roundId is required" }, { status: 400 });
      response.headers.set("X-Request-Id", requestId);
      logPerf("/api/admin/assign", "POST", Date.now() - startedAt, 400, requestId);
      return response;
    }

    // 1. Get all active judges
    const judges = await prisma.user.findMany({
      where: { role: "JUDGE", isActive: true }
    });

    if (judges.length === 0) {
      const response = NextResponse.json({ error: "No active judges found" }, { status: 400 });
      response.headers.set("X-Request-Id", requestId);
      logPerf("/api/admin/assign", "POST", Date.now() - startedAt, 400, requestId);
      return response;
    }

    // 2. Get all project rounds for this round
    const projectRounds = await prisma.projectRound.findMany({
      where: { roundId }
    });

    if (projectRounds.length === 0) {
      const response = NextResponse.json({ error: "No projects in this round" }, { status: 400 });
      response.headers.set("X-Request-Id", requestId);
      logPerf("/api/admin/assign", "POST", Date.now() - startedAt, 400, requestId);
      return response;
    }

    // 3. Assignment Algorithm (Balanced Random)
    // For each project, assign `judgesPerProject` unique judges.
    // Keep track of judge loads to balance them.
    const assignmentsToCreate: Prisma.JudgeAssignmentCreateManyInput[] = [];
    const judgeLoad = new Map<string, number>();
    judges.forEach(j => judgeLoad.set(j.id, 0));

    for (const pr of projectRounds) {
      // Sort judges by load (ascending), then shuffle ties
      const sortedJudges = [...judges].sort((a, b) => {
        const loadA = judgeLoad.get(a.id) || 0;
        const loadB = judgeLoad.get(b.id) || 0;
        if (loadA === loadB) return Math.random() - 0.5; // Randomize ties
        return loadA - loadB;
      });

      // Pick top N judges for this project
      const selectedJudges = sortedJudges.slice(0, Math.min(judgesPerProject, judges.length));

      for (const judge of selectedJudges) {
        assignmentsToCreate.push({
          judgeId: judge.id,
          projectRoundId: pr.id,
          roundId: roundId,
          status: "PENDING" as const,
        });
        judgeLoad.set(judge.id, (judgeLoad.get(judge.id) || 0) + 1);
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.judgeAssignment.deleteMany({
        where: { roundId }
      });
      return tx.judgeAssignment.createMany({
        data: assignmentsToCreate
      });
    });

    writeAuditLog({
      actorId: auth.session.user.id,
      actorRole: auth.session.user.role,
      action: "ADMIN_ASSIGN_JUDGES",
      target: roundId,
      detail: { assignedCount: result.count }
    });

    const response = NextResponse.json({ 
      success: true, 
      assignedCount: result.count,
      loadDistribution: Object.fromEntries(judgeLoad)
    });
    response.headers.set("X-Request-Id", requestId);
    logPerf("/api/admin/assign", "POST", Date.now() - startedAt, 200, requestId);
    return response;

  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const response = NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
      response.headers.set("X-Request-Id", requestId);
      logPerf("/api/admin/assign", "POST", Date.now() - startedAt, 400, requestId);
      return response;
    }
    logError("/api/admin/assign", "POST", error, requestId);
    const response = NextResponse.json({ error: "Internal server error" }, { status: 500 });
    response.headers.set("X-Request-Id", requestId);
    logPerf("/api/admin/assign", "POST", Date.now() - startedAt, 500, requestId);
    return response;
  }
}
