import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import type { Role } from "@prisma/client";

export async function requirePageRole(role: Role) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== role) {
    return null;
  }
  return session;
}

export async function requireApiRole(role: Role) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== role) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }
  return { ok: true as const, session };
}

export function parseDraftFeedback(input: string | null) {
  if (!input) return null;
  try {
    const parsed = JSON.parse(input);
    if (parsed && parsed.type === "draft") {
      return parsed;
    }
  } catch {}
  return null;
}
