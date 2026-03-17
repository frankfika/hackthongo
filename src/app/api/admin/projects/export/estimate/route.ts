import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/authz";
import { isTrustedOrigin, projectExportSchema } from "@/lib/security";
import { estimateFromProjects, loadProjectsForExport } from "@/lib/project-export";

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
    return NextResponse.json({
      success: true,
      estimate
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
