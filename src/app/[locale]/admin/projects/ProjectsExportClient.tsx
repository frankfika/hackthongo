"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProjectRow = {
  id: string;
  receiptNumber: string;
  name: string;
  status: string;
  createdAt: string;
  registrationData: unknown;
  submissionData: unknown;
};

type ExportMode = "single" | "selected" | "all";
type SortBy = "createdAt" | "projectName" | "fileSize";
type SortOrder = "asc" | "desc";

type Estimate = {
  totalProjects: number;
  totalAttachments: number;
  estimatedBytes: number;
  estimatedSeconds: number;
  averageProjectBytes: number;
};

type JobSnapshot = {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  totalProjects: number;
  processedProjects: number;
  progressPercent: number;
  currentBatch: number;
  totalBatches: number;
  estimatedSeconds: number;
  etaSeconds: number;
  fileName: string | null;
  errorMessage: string | null;
};

type ProjectsExportClientProps = {
  projects: ProjectRow[];
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} 秒`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min < 60) return `${min} 分 ${sec} 秒`;
  const hour = Math.floor(min / 60);
  return `${hour} 小时 ${min % 60} 分`;
}

function parseFileName(disposition: string | null) {
  if (!disposition) return `projects_export_${Date.now()}.zip`;
  const matched = disposition.match(/filename="([^"]+)"/);
  return matched?.[1] || `projects_export_${Date.now()}.zip`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(href);
}

function renderFieldRows(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return <div className="text-slate-500">无数据</div>;
  }
  const entries = Object.entries(data as Record<string, unknown>);
  if (entries.length === 0) {
    return <div className="text-slate-500">无数据</div>;
  }
  return (
    <div className="space-y-1">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-2 text-sm">
          <div className="font-medium min-w-[140px] text-slate-600 break-all">{key}</div>
          <div className="text-slate-900 break-all">
            {typeof value === "string" || typeof value === "number" || typeof value === "boolean"
              ? String(value)
              : JSON.stringify(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectsExportClient(props: ProjectsExportClientProps) {
  const [mode, setMode] = useState<ExportMode>("single");
  const [singleProjectId, setSingleProjectId] = useState(props.projects[0]?.id ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [job, setJob] = useState<JobSnapshot | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const payload = useMemo(() => {
    const projectIds =
      mode === "single" ? (singleProjectId ? [singleProjectId] : []) : mode === "selected" ? selectedIds : [];
    return {
      mode,
      projectIds,
      sortBy,
      sortOrder,
    };
  }, [mode, singleProjectId, selectedIds, sortBy, sortOrder]);

  const exportDisabled =
    exporting ||
    props.projects.length === 0 ||
    (mode === "single" && payload.projectIds.length !== 1) ||
    (mode === "selected" && payload.projectIds.length === 0);

  const requestEstimate = useCallback(async (input: typeof payload, silent = false) => {
    if ((input.mode === "single" || input.mode === "selected") && input.projectIds.length === 0) {
      setEstimate(null);
      return null;
    }
    setEstimating(true);
    const response = await fetch("/api/admin/projects/export/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    setEstimating(false);
    const result = await response.json();
    if (!response.ok) {
      if (!silent) toast.error(result.error ?? "预估失败");
      return null;
    }
    setEstimate(result.estimate);
    return result.estimate as Estimate;
  }, []);

  async function onStartExport() {
    const latestEstimate = estimate ?? (await requestEstimate(payload));
    if (!latestEstimate) return;
    setExporting(true);
    const response = await fetch("/api/admin/projects/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.status === 202) {
      const result = await response.json();
      setJob(result.job);
      setExporting(false);
      toast.success("已创建异步导出任务，系统正在后台打包");
      return;
    }
    if (!response.ok) {
      const result = await response.json();
      setExporting(false);
      toast.error(result.error ?? "导出失败");
      return;
    }
    const blob = await response.blob();
    downloadBlob(blob, parseFileName(response.headers.get("Content-Disposition")));
    toast.success("导出完成，ZIP 已开始下载");
    setExporting(false);
  }

  async function onDownloadAsyncResult() {
    if (!job) return;
    const response = await fetch(`/api/admin/projects/export/jobs/${job.id}/download`);
    if (!response.ok) {
      const result = await response.json();
      toast.error(result.error ?? "下载失败");
      return;
    }
    const blob = await response.blob();
    downloadBlob(blob, parseFileName(response.headers.get("Content-Disposition")));
    toast.success("下载完成");
  }

  useEffect(() => {
    if (!job) return;
    if (job.status === "COMPLETED" || job.status === "FAILED") return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/admin/projects/export/jobs/${job.id}`);
      if (!response.ok) return;
      const result = await response.json();
      setJob(result.job as JobSnapshot);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [job]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-4 space-y-4 bg-white/80">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-slate-500">导出模式</div>
            <Select value={mode} onValueChange={(value) => setMode(value as ExportMode)}>
              <SelectTrigger>
                <SelectValue placeholder="选择导出模式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">单个项目导出</SelectItem>
                <SelectItem value="selected">多选项目导出</SelectItem>
                <SelectItem value="all">全部项目导出</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-slate-500">排序字段</div>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
              <SelectTrigger>
                <SelectValue placeholder="排序字段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">创建时间</SelectItem>
                <SelectItem value="projectName">项目名称</SelectItem>
                <SelectItem value="fileSize">文件大小</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-slate-500">排序方向</div>
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
              <SelectTrigger>
                <SelectValue placeholder="排序方向" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">降序</SelectItem>
                <SelectItem value="asc">升序</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" onClick={() => void requestEstimate(payload)} disabled={estimating}>
              {estimating ? "预估中..." : "刷新预估"}
            </Button>
            <Button type="button" onClick={() => void onStartExport()} disabled={exportDisabled}>
              {exporting ? "导出中..." : "开始导出 ZIP"}
            </Button>
          </div>
        </div>

        {mode === "single" && (
          <div className="space-y-2">
            <div className="text-sm font-medium">选择项目</div>
            <Select value={singleProjectId} onValueChange={(value) => setSingleProjectId(value ?? "")}>
              <SelectTrigger className="max-w-[480px]">
                <SelectValue placeholder="选择一个项目" />
              </SelectTrigger>
              <SelectContent>
                {props.projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.receiptNumber} · {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {mode === "selected" && (
          <div className="text-sm text-slate-600">当前已选择 {selectedIds.length} 个项目</div>
        )}

        {estimate && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <div className="text-slate-500">项目数量</div>
              <div className="font-semibold">{estimate.totalProjects}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-slate-500">附件条目</div>
              <div className="font-semibold">{estimate.totalAttachments}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-slate-500">预估大小</div>
              <div className="font-semibold">{formatBytes(estimate.estimatedBytes)}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-slate-500">预估耗时</div>
              <div className="font-semibold">{formatDuration(estimate.estimatedSeconds)}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-slate-500">单项目均值</div>
              <div className="font-semibold">{formatBytes(estimate.averageProjectBytes)}</div>
            </div>
          </div>
        )}
      </div>

      {job && (
        <div className="rounded-xl border p-4 space-y-3 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="font-semibold">全部项目异步导出任务</div>
            <div className="text-sm text-slate-600">{job.status}</div>
          </div>
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all" style={{ width: `${job.progressPercent}%` }} />
          </div>
          <div className="text-sm text-slate-700">
            进度 {job.progressPercent}% · 已处理 {job.processedProjects}/{job.totalProjects} · 当前批次 {job.currentBatch}/
            {job.totalBatches}
          </div>
          <div className="text-sm text-slate-700">
            预计剩余 {formatDuration(job.etaSeconds)} · 预计完成时间为当前时间后约 {formatDuration(job.etaSeconds)}
          </div>
          {job.status === "FAILED" && <div className="text-sm text-red-600">{job.errorMessage ?? "任务失败"}</div>}
          {job.status === "COMPLETED" && (
            <Button type="button" onClick={() => void onDownloadAsyncResult()}>
              下载异步导出结果
            </Button>
          )}
        </div>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[44px]">
                <input
                  type="checkbox"
                  checked={props.projects.length > 0 && selectedIds.length === props.projects.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(props.projects.map((item) => item.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Receipt No.</TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead>详情</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No projects submitted yet.
                </TableCell>
              </TableRow>
            ) : (
              props.projects.map((project) => (
                <Fragment key={project.id}>
                  <TableRow>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedSet.has(project.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds((prev) => [...prev, project.id]);
                          } else {
                            setSelectedIds((prev) => prev.filter((id) => id !== project.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-mono">{project.receiptNumber}</TableCell>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.status}</TableCell>
                    <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedProjectId((prev) => (prev === project.id ? null : project.id))
                        }
                      >
                        {expandedProjectId === project.id ? "收起" : "查看"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedProjectId === project.id && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="grid md:grid-cols-2 gap-4 rounded-lg border bg-slate-50 p-3">
                          <div>
                            <div className="font-semibold mb-2">报名表单数据</div>
                            {renderFieldRows(project.registrationData)}
                          </div>
                          <div>
                            <div className="font-semibold mb-2">项目提交流水数据</div>
                            {renderFieldRows(project.submissionData)}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
