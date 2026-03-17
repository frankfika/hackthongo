import JSZip from "jszip";
import { prisma } from "@/lib/prisma";

export type ExportMode = "single" | "selected" | "all";
export type ExportSortBy = "createdAt" | "projectName" | "fileSize";
export type ExportSortOrder = "asc" | "desc";

export type ExportRequestPayload = {
  mode: ExportMode;
  projectIds: string[];
  sortBy: ExportSortBy;
  sortOrder: ExportSortOrder;
};

export type ProjectExportEstimate = {
  totalProjects: number;
  totalAttachments: number;
  estimatedBytes: number;
  estimatedSeconds: number;
  averageProjectBytes: number;
};

export type AttachmentRecord = {
  keyPath: string;
  name: string;
  url: string;
  sizeBytes: number | null;
  source: "registrationData" | "submissionData";
};

type ProjectWithPayload = {
  id: string;
  name: string;
  receiptNumber: string;
  status: string;
  createdAt: Date;
  registrationData: unknown;
  submissionData: unknown;
};

type EnrichedProject = ProjectWithPayload & {
  attachments: AttachmentRecord[];
  calculatedBytes: number;
};

const DEFAULT_ATTACHMENT_ESTIMATE_BYTES = 180 * 1024;
const BYTES_PER_SECOND = 2 * 1024 * 1024;

function normalizeText(input: unknown) {
  if (typeof input !== "string") return "";
  return input.trim();
}

function looksLikeUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function sanitizeSegment(value: string) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function estimatePrimitiveBytes(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function parseAttachmentSize(input: unknown) {
  if (typeof input === "number" && Number.isFinite(input) && input >= 0) {
    return Math.floor(input);
  }
  if (typeof input === "string") {
    const parsed = Number(input);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.floor(parsed);
    }
  }
  return null;
}

function appendAttachmentFromObject(
  source: "registrationData" | "submissionData",
  keyPath: string,
  value: Record<string, unknown>,
  attachments: AttachmentRecord[]
) {
  const urlCandidate = normalizeText(value.url ?? value.link ?? value.href ?? value.downloadUrl ?? value.fileUrl);
  if (!urlCandidate || !looksLikeUrl(urlCandidate)) return;
  const nameCandidate =
    normalizeText(value.name ?? value.fileName ?? value.filename ?? value.title ?? value.label) || "unnamed";
  const sizeBytes =
    parseAttachmentSize(value.sizeBytes) ??
    parseAttachmentSize(value.fileSize) ??
    parseAttachmentSize(value.size);
  attachments.push({
    keyPath,
    name: nameCandidate,
    url: urlCandidate,
    sizeBytes,
    source
  });
}

function collectAttachments(
  source: "registrationData" | "submissionData",
  input: unknown,
  keyPath: string,
  attachments: AttachmentRecord[]
) {
  if (input === null || input === undefined) return;
  if (typeof input === "string") {
    const normalized = normalizeText(input);
    if (looksLikeUrl(normalized)) {
      attachments.push({
        keyPath,
        name: sanitizeSegment(keyPath.split(".").at(-1) || "attachment"),
        url: normalized,
        sizeBytes: null,
        source
      });
    }
    return;
  }
  if (Array.isArray(input)) {
    input.forEach((item, index) => collectAttachments(source, item, `${keyPath}[${index}]`, attachments));
    return;
  }
  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;
    appendAttachmentFromObject(source, keyPath, obj, attachments);
    Object.entries(obj).forEach(([key, value]) => {
      collectAttachments(source, value, keyPath ? `${keyPath}.${key}` : key, attachments);
    });
  }
}

function uniqueAttachments(attachments: AttachmentRecord[]) {
  const seen = new Set<string>();
  return attachments.filter((item) => {
    const key = `${item.url}::${item.keyPath}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function enrichProject(project: ProjectWithPayload): EnrichedProject {
  const attachments: AttachmentRecord[] = [];
  collectAttachments("registrationData", project.registrationData, "registrationData", attachments);
  collectAttachments("submissionData", project.submissionData, "submissionData", attachments);
  const deduped = uniqueAttachments(attachments);
  const jsonBytes = estimatePrimitiveBytes(project.registrationData) + estimatePrimitiveBytes(project.submissionData);
  const attachmentBytes = deduped.reduce((sum, item) => sum + (item.sizeBytes ?? DEFAULT_ATTACHMENT_ESTIMATE_BYTES), 0);
  return {
    ...project,
    attachments: deduped,
    calculatedBytes: jsonBytes + attachmentBytes
  };
}

export function estimateFromProjects(projects: ProjectWithPayload[]): ProjectExportEstimate {
  const enriched = projects.map(enrichProject);
  const totalProjects = enriched.length;
  const totalAttachments = enriched.reduce((sum, item) => sum + item.attachments.length, 0);
  const estimatedBytes = enriched.reduce((sum, item) => sum + item.calculatedBytes, 0);
  const averageProjectBytes = totalProjects > 0 ? Math.floor(estimatedBytes / totalProjects) : 0;
  const estimatedSeconds = Math.max(1, Math.ceil(estimatedBytes / BYTES_PER_SECOND) + Math.ceil(totalProjects / 8));
  return {
    totalProjects,
    totalAttachments,
    estimatedBytes,
    estimatedSeconds,
    averageProjectBytes
  };
}

function sortProjects(projects: EnrichedProject[], sortBy: ExportSortBy, sortOrder: ExportSortOrder) {
  const direction = sortOrder === "asc" ? 1 : -1;
  return [...projects].sort((a, b) => {
    if (sortBy === "createdAt") {
      return direction * (a.createdAt.getTime() - b.createdAt.getTime());
    }
    if (sortBy === "projectName") {
      return direction * a.name.localeCompare(b.name, "zh-Hans-CN");
    }
    return direction * (a.calculatedBytes - b.calculatedBytes);
  });
}

function buildCsv(projects: EnrichedProject[]) {
  const lines = [
    "receiptNumber,projectName,status,createdAt,estimatedProjectBytes,attachmentCount",
    ...projects.map((item) =>
      [
        item.receiptNumber,
        item.name.replaceAll('"', '""'),
        item.status,
        item.createdAt.toISOString(),
        String(item.calculatedBytes),
        String(item.attachments.length)
      ]
        .map((part) => `"${part}"`)
        .join(",")
    )
  ];
  return lines.join("\n");
}

export async function loadProjectsForExport(input: ExportRequestPayload) {
  const where =
    input.mode === "all"
      ? {}
      : {
          id: {
            in: input.projectIds
          }
        };
  const projects = await prisma.project.findMany({
    where,
    select: {
      id: true,
      name: true,
      receiptNumber: true,
      status: true,
      createdAt: true,
      registrationData: true,
      submissionData: true
    }
  });
  const enriched = projects.map(enrichProject);
  return sortProjects(enriched, input.sortBy, input.sortOrder);
}

export async function generateProjectsZip(
  input: ExportRequestPayload,
  onProgress?: (progress: {
    processedProjects: number;
    totalProjects: number;
    compressionPercent: number;
  }) => void
) {
  const projects = await loadProjectsForExport(input);
  const estimate = estimateFromProjects(projects);
  const zip = new JSZip();
  const generatedAt = new Date().toISOString();

  zip.file(
    "metadata.json",
    JSON.stringify(
      {
        generatedAt,
        mode: input.mode,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
        estimate
      },
      null,
      2
    )
  );

  projects.forEach((project, index) => {
    const folderName = `${project.receiptNumber}_${sanitizeSegment(project.name || project.id)}`;
    const folder = zip.folder(`projects/${folderName}`);
    folder?.file(
      "project.json",
      JSON.stringify(
        {
          id: project.id,
          name: project.name,
          receiptNumber: project.receiptNumber,
          status: project.status,
          createdAt: project.createdAt.toISOString(),
          registrationData: project.registrationData,
          submissionData: project.submissionData
        },
        null,
        2
      )
    );
    folder?.file("attachments.json", JSON.stringify(project.attachments, null, 2));
    onProgress?.({
      processedProjects: index + 1,
      totalProjects: projects.length,
      compressionPercent: 0
    });
  });

  zip.file("projects/index.csv", buildCsv(projects));

  const buffer = await zip.generateAsync(
    { type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } },
    (metadata) => {
      onProgress?.({
        processedProjects: projects.length,
        totalProjects: projects.length,
        compressionPercent: metadata.percent
      });
    }
  );

  const fileName = `projects_export_${generatedAt.replaceAll(":", "-")}.zip`;
  return {
    buffer,
    fileName,
    projects,
    estimate
  };
}
