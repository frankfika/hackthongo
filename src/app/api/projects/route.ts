import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendSubmissionReceipt } from "@/lib/email";
import { projectSubmitSchema, sanitizeMap, sanitizeText, isTrustedOrigin } from "@/lib/security";
import { createRequestId, logError, logPerf, logSecurityEvent } from "@/lib/observability";

export async function POST(req: Request) {
  const startedAt = Date.now();
  const requestId = createRequestId(req.headers);
  try {
    if (!isTrustedOrigin(req.headers, req.url)) {
      logSecurityEvent("forbidden_origin_submit", { route: "/api/projects", requestId });
      const response = NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
      response.headers.set("X-Request-Id", requestId);
      logPerf("/api/projects", "POST", Date.now() - startedAt, 403, requestId);
      return response;
    }
    const payload = projectSubmitSchema.parse(await req.json());
    const registrationData = sanitizeMap(payload.registrationData);
    const submissionData = sanitizeMap(payload.submissionData);
    const receiptNumber = `HTG-${randomBytes(6).toString("hex").toUpperCase()}`;
    const projectName = sanitizeText(String(submissionData.projectName || "Unnamed Project"), 200);

    const project = await prisma.project.create({
      data: {
        name: projectName,
        description: sanitizeText(String(submissionData.description || ""), 5000),
        receiptNumber,
        registrationData,
        submissionData,
        status: "SUBMITTED",
      },
    });

    const email = typeof registrationData.email === "string" ? registrationData.email : "";
    if (email) {
      await sendSubmissionReceipt(email, receiptNumber, projectName);
    }

    const response = NextResponse.json({ success: true, receiptNumber: project.receiptNumber });
    response.headers.set("X-Request-Id", requestId);
    logPerf("/api/projects", "POST", Date.now() - startedAt, 200, requestId);
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const response = NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
      response.headers.set("X-Request-Id", requestId);
      logPerf("/api/projects", "POST", Date.now() - startedAt, 400, requestId);
      return response;
    }
    logError("/api/projects", "POST", error, requestId);
    const response = NextResponse.json({ error: "Failed to submit" }, { status: 500 });
    response.headers.set("X-Request-Id", requestId);
    logPerf("/api/projects", "POST", Date.now() - startedAt, 500, requestId);
    return response;
  }
}
