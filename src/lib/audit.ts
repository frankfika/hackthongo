type AuditPayload = {
  actorId: string;
  actorRole: string;
  action: string;
  target: string;
  detail?: Record<string, unknown>;
};

export function writeAuditLog(payload: AuditPayload) {
  const log = {
    ts: new Date().toISOString(),
    ...payload
  };
  console.info("[AUDIT]", JSON.stringify(log));
}
