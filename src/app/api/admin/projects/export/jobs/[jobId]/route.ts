import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/authz";
import { getExportJobSnapshot } from "@/lib/project-export-jobs";

type Params = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireApiRole("ADMIN");
  if (!auth.ok) return auth.response;
  const { jobId } = await params;
  const snapshot = getExportJobSnapshot(jobId);
  if (!snapshot) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    job: snapshot
  });
}
