import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isTrustedOrigin } from "@/lib/security";

const handleI18nRouting = createMiddleware(routing);
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_MINUTE = 120;
const AUTH_RATE_LIMIT_PER_MINUTE = 12;
const SUBMISSION_RATE_LIMIT_PER_MINUTE = 25;
const METRICS_RATE_LIMIT_PER_MINUTE = 30;
const HEALTH_RATE_LIMIT_PER_MINUTE = 60;
const API_MAX_CONTENT_LENGTH = 1_000_000;

type RateRecord = { count: number; resetAt: number };

const rateStore = globalThis as typeof globalThis & {
  __htgRateStore?: Map<string, RateRecord>;
};

if (!rateStore.__htgRateStore) {
  rateStore.__htgRateStore = new Map<string, RateRecord>();
}

function createRequestId(headers: Headers) {
  const existing = headers.get("x-request-id");
  if (existing) return existing;
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function logSecurityEvent(type: string, payload: Record<string, unknown>) {
  console.warn("[SECURITY]", type, payload);
}

function withSecurityHeaders(response: NextResponse, requestId?: string) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  if (requestId) {
    response.headers.set("X-Request-Id", requestId);
  }
  return response;
}

function getClientIp(request: NextRequest) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function isMutatingMethod(method: string) {
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

function isCrossSiteRequest(headers: Headers) {
  const value = headers.get("sec-fetch-site");
  if (!value) return false;
  return value === "cross-site";
}

function getRateLimitBucket(pathname: string) {
  if (pathname.startsWith("/api/auth")) return "api-auth";
  if (pathname.startsWith("/api/projects")) return "api-project-submit";
  if (pathname.startsWith("/api/metrics")) return "api-metrics";
  if (pathname.startsWith("/api/health")) return "api-health";
  return "api-general";
}

function applyRateLimit(request: NextRequest) {
  const bucket = getRateLimitBucket(request.nextUrl.pathname);
  const key = `${bucket}:${getClientIp(request)}`;
  const now = Date.now();
  const store = rateStore.__htgRateStore!;
  const existing = store.get(key);
  const max =
    bucket === "api-auth"
      ? AUTH_RATE_LIMIT_PER_MINUTE
      : bucket === "api-project-submit"
        ? SUBMISSION_RATE_LIMIT_PER_MINUTE
        : bucket === "api-metrics"
          ? METRICS_RATE_LIMIT_PER_MINUTE
          : bucket === "api-health"
            ? HEALTH_RATE_LIMIT_PER_MINUTE
            : RATE_LIMIT_PER_MINUTE;
  if (store.size > 12_000) {
    for (const [itemKey, itemValue] of store.entries()) {
      if (itemValue.resetAt <= now) {
        store.delete(itemKey);
      }
    }
  }
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }
  if (existing.count >= max) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    const response = NextResponse.json({ error: "Too many requests" }, { status: 429 });
    response.headers.set("Retry-After", String(retryAfter));
    return withSecurityHeaders(response);
  }
  existing.count += 1;
  store.set(key, existing);
  return null;
}

function getLocaleFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 0 && routing.locales.includes(parts[0] as (typeof routing.locales)[number])) {
    return parts[0];
  }
  return routing.defaultLocale;
}

function stripLocale(pathname: string) {
  const locale = getLocaleFromPath(pathname);
  const localePrefix = `/${locale}`;
  return pathname.startsWith(localePrefix) ? pathname.slice(localePrefix.length) || "/" : pathname;
}

function redirectTo(request: NextRequest, targetPath: string) {
  const locale = getLocaleFromPath(request.nextUrl.pathname);
  const url = new URL(`/${locale}${targetPath}`, request.url);
  return withSecurityHeaders(NextResponse.redirect(url));
}

async function readToken(request: NextRequest) {
  return getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const normalizedPath = stripLocale(pathname);
  const isApiPath = pathname.startsWith("/api/");
  const isMutatingApi = isApiPath && isMutatingMethod(request.method);
  const requestId = createRequestId(request.headers);

  if (isApiPath) {
    if (!isTrustedOrigin(request.headers, request.url) && isMutatingApi) {
      logSecurityEvent("forbidden_origin", { path: pathname, method: request.method, requestId, ip: getClientIp(request) });
      return withSecurityHeaders(NextResponse.json({ error: "Forbidden origin" }, { status: 403 }), requestId);
    }
    if (isMutatingApi && isCrossSiteRequest(request.headers)) {
      logSecurityEvent("forbidden_cross_site_request", { path: pathname, method: request.method, requestId, ip: getClientIp(request) });
      return withSecurityHeaders(NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 }), requestId);
    }
    if (isMutatingApi) {
      const contentLengthHeader = request.headers.get("content-length");
      const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;
      if (Number.isFinite(contentLength) && contentLength > API_MAX_CONTENT_LENGTH) {
        logSecurityEvent("payload_too_large", { path: pathname, method: request.method, requestId, ip: getClientIp(request), contentLength });
        return withSecurityHeaders(NextResponse.json({ error: "Payload too large" }, { status: 413 }), requestId);
      }
    }
    const limited = applyRateLimit(request);
    if (limited) {
      logSecurityEvent("rate_limit_exceeded", { path: pathname, method: request.method, requestId, ip: getClientIp(request) });
      return withSecurityHeaders(limited, requestId);
    }
  }

  if (pathname.startsWith("/api/admin")) {
    const token = await readToken(request);
    if (!token || token.role !== "ADMIN") {
      logSecurityEvent("unauthorized_admin_api", { path: pathname, requestId, ip: getClientIp(request) });
      return withSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), requestId);
    }
    return withSecurityHeaders(NextResponse.next(), requestId);
  }

  if (pathname.startsWith("/api/judge")) {
    const token = await readToken(request);
    if (!token || token.role !== "JUDGE") {
      logSecurityEvent("unauthorized_judge_api", { path: pathname, requestId, ip: getClientIp(request) });
      return withSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), requestId);
    }
    return withSecurityHeaders(NextResponse.next(), requestId);
  }

  if (isApiPath) {
    return withSecurityHeaders(NextResponse.next(), requestId);
  }

  if (normalizedPath.startsWith("/admin")) {
    if (normalizedPath === "/admin/login") {
      return withSecurityHeaders(handleI18nRouting(request), requestId);
    }
    const token = await readToken(request);
    if (!token) return redirectTo(request, "/admin/login");
    if (token.role !== "ADMIN") return redirectTo(request, "/judge/dashboard");
  }

  if (normalizedPath.startsWith("/judge")) {
    if (normalizedPath === "/judge/login") {
      return withSecurityHeaders(handleI18nRouting(request), requestId);
    }
    const token = await readToken(request);
    if (!token) return redirectTo(request, "/judge/login");
    if (token.role !== "JUDGE") return redirectTo(request, "/admin/dashboard");
  }

  return withSecurityHeaders(handleI18nRouting(request), requestId);
}

export const config = {
  matcher: ['/((?!trpc|_next|_vercel|.*\\..*).*)']
};
