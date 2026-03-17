import { z } from "zod";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const passwordSchema = z.string().min(8).max(128);

export function hashPassword(password: string) {
  const validated = passwordSchema.parse(password);
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(validated, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(storedPasswordHash: string, inputPassword: string) {
  if (storedPasswordHash.startsWith("scrypt$")) {
    const parts = storedPasswordHash.split("$");
    if (parts.length !== 3) return false;
    const [, salt, storedHashHex] = parts;
    const derived = scryptSync(inputPassword, salt, 64);
    const stored = Buffer.from(storedHashHex, "hex");
    if (derived.length !== stored.length) return false;
    return timingSafeEqual(derived, stored);
  }
  return false;
}

const primitiveValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const mapSchema = z.record(z.string(), primitiveValueSchema);

export const projectSubmitSchema = z.object({
  registrationData: mapSchema.default({}),
  submissionData: mapSchema.default({}),
});

export const assignSchema = z.object({
  roundId: z.string().min(1).max(64),
  judgesPerProject: z.number().int().min(1).max(20).default(3),
});

export const promoteSchema = z.object({
  roundId: z.string().min(1).max(64),
  ruleType: z.enum(["TOP_N", "TOP_PERCENT", "SCORE_THRESHOLD"]),
  ruleValue: z.number().positive(),
  minReviewsRequired: z.number().int().min(1).max(20).default(3),
});

export const judgeDraftSchema = z.object({
  scores: z.record(z.string(), z.number()).default({}),
  feedback: z.string().max(5000).default(""),
});

export const judgeSubmitSchema = z.object({
  scores: z.record(z.string(), z.number()).default({}),
  feedback: z.string().max(5000).default(""),
});

export const judgeBatchSubmitSchema = z.object({
  assignmentIds: z.array(z.string().min(1)).max(200).default([]),
});

const exportModeSchema = z.enum(["single", "selected", "all"]);
const exportSortBySchema = z.enum(["createdAt", "projectName", "fileSize"]);
const exportSortOrderSchema = z.enum(["asc", "desc"]);

export const projectExportSchema = z
  .object({
    mode: exportModeSchema,
    projectIds: z.array(z.string().min(1)).max(500).default([]),
    sortBy: exportSortBySchema.default("createdAt"),
    sortOrder: exportSortOrderSchema.default("desc"),
  })
  .superRefine((value, ctx) => {
    if (value.mode !== "all" && value.projectIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "projectIds is required for single/selected export",
      });
    }
    if (value.mode === "single" && value.projectIds.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "single export requires exactly one projectId",
      });
    }
  });

export function sanitizeText(value: string, maxLength = 5000) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeMap(data: Record<string, string | number | boolean | null>) {
  return Object.entries(data).reduce<Record<string, string | number | boolean | null>>((acc, [key, value]) => {
    const cleanKey = sanitizeText(key, 120);
    if (!cleanKey) return acc;
    if (typeof value === "string") {
      acc[cleanKey] = sanitizeText(value, 5000);
      return acc;
    }
    acc[cleanKey] = value;
    return acc;
  }, {});
}

export function isTrustedOrigin(headers: Headers, requestUrl: string) {
  const origin = headers.get("origin");
  if (!origin) return true;
  const target = new URL(requestUrl);
  let source: URL;
  try {
    source = new URL(origin);
  } catch {
    return false;
  }
  if (source.protocol !== "https:" && process.env.NODE_ENV === "production") return false;
  if (source.host === target.host) return true;
  const extraOrigins = `${process.env.TRUSTED_ORIGINS || ""},${process.env.ALLOWED_ORIGINS || ""}`
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return extraOrigins.includes(source.origin);
}

export function isAllowedEmbedUrl(urlValue: string) {
  try {
    const url = new URL(urlValue);
    if (!["https:"].includes(url.protocol)) return false;
    const allowedHosts = (process.env.ALLOWED_DOC_EMBED_HOSTS || "docs.google.com,*.gitbook.io")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean);
    return allowedHosts.some((hostRule) => {
      if (hostRule.startsWith("*.")) {
        const suffix = hostRule.slice(1);
        return url.hostname.toLowerCase().endsWith(suffix);
      }
      return url.hostname.toLowerCase() === hostRule;
    });
  } catch {
    return false;
  }
}
