import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTrustedOrigin, promoteSchema } from "@/lib/security";
import { requireApiRole } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { createRequestId, logError, logPerf, logSecurityEvent } from "@/lib/observability";
import type { PromotionStatus } from "@prisma/client";

export async function POST(req: Request) {
  const startedAt = Date.now();
  const requestId = createRequestId(req.headers);
  try {
    if (!isTrustedOrigin(req.headers, req.url)) {
      logSecurityEvent("forbidden_origin_admin_promote", { route: "/api/admin/promote", requestId });
      const response = NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
      response.headers.set("X-Request-Id", requestId);
      logPerf("/api/admin/promote", "POST", Date.now() - startedAt, 403, requestId);
      return response;
    }
    const auth = await requireApiRole("ADMIN");
    if (!auth.ok) {
      const response = auth.response;
      response.headers.set("X-Request-Id", requestId);
      logPerf("/api/admin/promote", "POST", Date.now() - startedAt, 401, requestId);
      return response;
    }

    const { roundId, ruleType, ruleValue, minReviewsRequired } = promoteSchema.parse(await req.json());

    if (!roundId || !ruleType || ruleValue === undefined) {
      const response = NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
      response.headers.set("X-Request-Id", requestId);
      logPerf("/api/admin/promote", "POST", Date.now() - startedAt, 400, requestId);
      return response;
    }

    const round = await prisma.round.findUnique({ where: { id: roundId } });
    if (!round || round.status !== "JUDGING_CLOSED") {
      const response = NextResponse.json({ error: "Round must be JUDGING_CLOSED before promotion" }, { status: 400 });
      response.headers.set("X-Request-Id", requestId);
      logPerf("/api/admin/promote", "POST", Date.now() - startedAt, 400, requestId);
      return response;
    }

    const projectRounds = await prisma.projectRound.findMany({
      where: { roundId },
      include: {
        assignments: {
          where: { status: "COMPLETED" }
        },
        project: true
      }
    });

    const results = [];

    // 2. Calculate average score for each project
    for (const pr of projectRounds) {
      const validReviewsCount = pr.assignments.length;
      
      if (validReviewsCount < minReviewsRequired) {
        results.push({
          ...pr,
          avgScore: 0,
          validReviewsCount,
          status: "INSUFFICIENT_REVIEWS"
        });
        continue;
      }

      // Sum total scores from all valid assignments
      const totalScoreSum = pr.assignments.reduce((sum, a) => sum + (a.totalScore || 0), 0);
      const avgScore = totalScoreSum / validReviewsCount;

      results.push({
        ...pr,
        avgScore,
        validReviewsCount,
        status: "EVALUATED" // Temporary status for sorting
      });
    }

    // 3. Sort evaluated projects by avgScore (descending)
    const evaluatedProjects = results.filter(r => r.status === "EVALUATED");
    evaluatedProjects.sort((a, b) => {
      // Primary: Score
      if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
      // Secondary: More valid reviews
      if (b.validReviewsCount !== a.validReviewsCount) return b.validReviewsCount - a.validReviewsCount;
      // Tertiary: Submission time
      return a.project.createdAt.getTime() - b.project.createdAt.getTime();
    });

    // 4. Apply Promotion Rule (Global Pool)
    let promotedIds = new Set<string>();

    if (ruleType === "TOP_N") {
      promotedIds = new Set(evaluatedProjects.slice(0, ruleValue).map(p => p.id));
    } else if (ruleType === "TOP_PERCENT") {
      const count = Math.ceil((evaluatedProjects.length * ruleValue) / 100);
      promotedIds = new Set(evaluatedProjects.slice(0, count).map(p => p.id));
    } else if (ruleType === "SCORE_THRESHOLD") {
      promotedIds = new Set(evaluatedProjects.filter(p => p.avgScore >= ruleValue).map(p => p.id));
    }

    // 5. Update Database
    const updatePromises = results.map(r => {
      let finalStatus: PromotionStatus = "PENDING";
      if (r.status === "INSUFFICIENT_REVIEWS") {
        finalStatus = "INSUFFICIENT_REVIEWS";
      } else {
        finalStatus = promotedIds.has(r.id) ? "PROMOTED" : "ELIMINATED";
      }

      return prisma.projectRound.update({
        where: { id: r.id },
        data: {
          avgScore: r.avgScore,
          promotionStatus: finalStatus
        }
      });
    });

    await prisma.$transaction(updatePromises);

    writeAuditLog({
      actorId: auth.session.user.id,
      actorRole: auth.session.user.role,
      action: "ADMIN_PROMOTE_PROJECTS",
      target: roundId,
      detail: { processed: results.length, promoted: promotedIds.size }
    });

    const response = NextResponse.json({ 
      success: true, 
      processed: results.length,
      promoted: promotedIds.size
    });
    response.headers.set("X-Request-Id", requestId);
    logPerf("/api/admin/promote", "POST", Date.now() - startedAt, 200, requestId);
    return response;

  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const response = NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
      response.headers.set("X-Request-Id", requestId);
      logPerf("/api/admin/promote", "POST", Date.now() - startedAt, 400, requestId);
      return response;
    }
    logError("/api/admin/promote", "POST", error, requestId);
    const response = NextResponse.json({ error: "Internal server error" }, { status: 500 });
    response.headers.set("X-Request-Id", requestId);
    logPerf("/api/admin/promote", "POST", Date.now() - startedAt, 500, requestId);
    return response;
  }
}
