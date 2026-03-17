import type { ExportRequestPayload, ProjectExportEstimate } from "@/lib/project-export";
import { generateProjectsZip } from "@/lib/project-export";

type ExportJobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export type ExportJobSnapshot = {
  id: string;
  status: ExportJobStatus;
  mode: ExportRequestPayload["mode"];
  sortBy: ExportRequestPayload["sortBy"];
  sortOrder: ExportRequestPayload["sortOrder"];
  totalProjects: number;
  processedProjects: number;
  progressPercent: number;
  currentBatch: number;
  totalBatches: number;
  estimatedSeconds: number;
  etaSeconds: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  fileName: string | null;
  errorMessage: string | null;
};

type ExportJob = {
  snapshot: ExportJobSnapshot;
  payload: ExportRequestPayload;
  estimate: ProjectExportEstimate;
  zipBuffer: Buffer | null;
};

const JOB_TTL_MS = 20 * 60 * 1000;
const BATCH_SIZE = 20;

const globalJobs = globalThis as typeof globalThis & {
  __projectExportJobs?: Map<string, ExportJob>;
};

if (!globalJobs.__projectExportJobs) {
  globalJobs.__projectExportJobs = new Map<string, ExportJob>();
}

function cleanupExpiredJobs() {
  const jobs = globalJobs.__projectExportJobs!;
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    const completedAt = job.snapshot.completedAt ? new Date(job.snapshot.completedAt).getTime() : 0;
    if (completedAt > 0 && now - completedAt > JOB_TTL_MS) {
      jobs.delete(id);
    }
  }
}

function buildId() {
  return `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createExportJob(payload: ExportRequestPayload, estimate: ProjectExportEstimate) {
  cleanupExpiredJobs();
  const id = buildId();
  const totalBatches = Math.max(1, Math.ceil(Math.max(estimate.totalProjects, 1) / BATCH_SIZE));
  const snapshot: ExportJobSnapshot = {
    id,
    status: "PENDING",
    mode: payload.mode,
    sortBy: payload.sortBy,
    sortOrder: payload.sortOrder,
    totalProjects: estimate.totalProjects,
    processedProjects: 0,
    progressPercent: 0,
    currentBatch: 0,
    totalBatches,
    estimatedSeconds: estimate.estimatedSeconds,
    etaSeconds: estimate.estimatedSeconds,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    fileName: null,
    errorMessage: null
  };
  globalJobs.__projectExportJobs!.set(id, {
    snapshot,
    payload,
    estimate,
    zipBuffer: null
  });
  return snapshot;
}

export function getExportJob(id: string) {
  cleanupExpiredJobs();
  return globalJobs.__projectExportJobs!.get(id) ?? null;
}

export function getExportJobSnapshot(id: string) {
  const job = getExportJob(id);
  if (!job) return null;
  return job.snapshot;
}

export async function runExportJob(id: string) {
  const job = getExportJob(id);
  if (!job) return;
  if (job.snapshot.status === "RUNNING" || job.snapshot.status === "COMPLETED") return;
  job.snapshot.status = "RUNNING";
  job.snapshot.startedAt = new Date().toISOString();
  try {
    const { buffer, fileName } = await generateProjectsZip(job.payload, (progress) => {
      const ratio =
        progress.totalProjects > 0 ? Math.min(1, progress.processedProjects / progress.totalProjects) : 1;
      const weighted = ratio * 0.8 + (progress.compressionPercent / 100) * 0.2;
      const rounded = Math.min(99, Math.floor(weighted * 100));
      job.snapshot.processedProjects = progress.processedProjects;
      job.snapshot.progressPercent = rounded;
      job.snapshot.currentBatch = Math.min(
        job.snapshot.totalBatches,
        Math.max(1, Math.ceil(Math.max(progress.processedProjects, 1) / BATCH_SIZE))
      );
      job.snapshot.etaSeconds = Math.max(
        1,
        Math.ceil(((100 - Math.max(1, rounded)) / 100) * Math.max(job.estimate.estimatedSeconds, 1))
      );
    });
    job.zipBuffer = buffer;
    job.snapshot.fileName = fileName;
    job.snapshot.progressPercent = 100;
    job.snapshot.processedProjects = job.snapshot.totalProjects;
    job.snapshot.currentBatch = job.snapshot.totalBatches;
    job.snapshot.etaSeconds = 0;
    job.snapshot.completedAt = new Date().toISOString();
    job.snapshot.status = "COMPLETED";
  } catch (error) {
    job.snapshot.status = "FAILED";
    job.snapshot.errorMessage = error instanceof Error ? error.message : "导出失败";
    job.snapshot.completedAt = new Date().toISOString();
  }
}
