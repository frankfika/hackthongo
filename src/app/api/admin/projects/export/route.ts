import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { isTrustedOrigin, projectExportSchema } from "@/lib/security";
import { createExportJob, runExportJob } from "@/lib/project-export-jobs";
import { estimateFromProjects, generateProjectsZip, loadProjectsForExport } from "@/lib/project-export";

const ASYNC_ALL_THRESHOLD = 40;

export async function POST(req: Request) {
  try {
    if (!isTrustedOrigin(req.headers, req.url)) {
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }
    const auth = await requireApiRole("ADMIN");
    if (!auth.ok) return auth.response;

    const payload = projectExportSchema.parse(await req.json());
    const projects = await loadProjectsForExport(payload);
    const estimate = estimateFromProjects(projects);

    if (payload.mode === "all" && projects.length >= ASYNC_ALL_THRESHOLD) {
      const snapshot = createExportJob(payload, estimate);
      void runExportJob(snapshot.id);
      writeAuditLog({
        actorId: auth.session.user.id,
        actorRole: auth.session.user.role,
        action: "ADMIN_EXPORT_PROJECTS_ASYNC",
        target: snapshot.id,
        detail: {
          mode: payload.mode,
          totalProjects: projects.length
        }
      });
      return NextResponse.json(
        {
          success: true,
          async: true,
          job: snapshot,
          estimate
        },
        { status: 202 }
      );
    }

    const result = await generateProjectsZip(payload);
    writeAuditLog({
      actorId: auth.session.user.id,
      actorRole: auth.session.user.role,
      action: "ADMIN_EXPORT_PROJECTS_SYNC",
      target: payload.mode,
      detail: {
        mode: payload.mode,
        totalProjects: result.projects.length
      }
    });
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${result.fileName.replace(/["\r\n]/g, "_")}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
