import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/authz";
import { getExportJob } from "@/lib/project-export-jobs";

type Params = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireApiRole("ADMIN");
  if (!auth.ok) return auth.response;
  const { jobId } = await params;
  const job = getExportJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (job.snapshot.status !== "COMPLETED" || !job.zipBuffer || !job.snapshot.fileName) {
    return NextResponse.json({ error: "Export not ready" }, { status: 409 });
  }
  return new NextResponse(new Uint8Array(job.zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${job.snapshot.fileName.replace(/["\r\n]/g, "_")}"`,
      "Cache-Control": "no-store"
    }
  });
}
