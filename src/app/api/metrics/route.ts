import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/authz";

export async function GET() {
  const auth = await requireApiRole("ADMIN");
  if (!auth.ok) {
    return auth.response;
  }
  const mem = process.memoryUsage();
  return NextResponse.json({
    process: {
      uptimeSec: Math.floor(process.uptime()),
      rssBytes: mem.rss,
      heapUsedBytes: mem.heapUsed,
      heapTotalBytes: mem.heapTotal,
      externalBytes: mem.external,
    },
    timestamp: new Date().toISOString(),
  });
}
