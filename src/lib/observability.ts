import { randomUUID } from "node:crypto";

type LogLevel = "info" | "warn" | "error";

function write(level: LogLevel, payload: Record<string, unknown>) {
  const message = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    ...payload,
  });
  if (level === "error") {
    console.error(message);
    return;
  }
  if (level === "warn") {
    console.warn(message);
    return;
  }
  console.info(message);
}

export function createRequestId(headers: Headers) {
  return headers.get("x-request-id") || randomUUID();
}

export function logSecurityEvent(event: string, payload: Record<string, unknown>) {
  write("warn", { type: "security", event, ...payload });
}

export function logPerf(route: string, method: string, elapsedMs: number, status: number, requestId: string) {
  write("info", { type: "perf", route, method, elapsedMs, status, requestId });
}

export function logError(route: string, method: string, error: unknown, requestId: string) {
  const message = error instanceof Error ? error.message : "unknown";
  write("error", { type: "error", route, method, requestId, message });
}
