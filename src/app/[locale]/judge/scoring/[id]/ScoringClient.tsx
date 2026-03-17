"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Criterion = {
  id: string;
  name: string;
  description: string | null;
  minScore: number;
  maxScore: number;
};

type AssignmentInfo = {
  id: string;
  projectName: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  criteria: Criterion[];
  savedScores: Record<string, number>;
  feedback: string;
};

type ScoringClientProps = {
  assignment: AssignmentInfo;
};

export function ScoringClient(props: ScoringClientProps) {
  const [scores, setScores] = useState<Record<string, number>>(props.assignment.savedScores);
  const [feedback, setFeedback] = useState(props.assignment.feedback);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const storageKey = useMemo(() => `judge-draft-${props.assignment.id}`, [props.assignment.id]);

  useEffect(() => {
    const fromLocal = localStorage.getItem(storageKey);
    if (!fromLocal) return;
    try {
      const parsed = JSON.parse(fromLocal);
      if (parsed?.scores) setScores(parsed.scores);
      if (parsed?.feedback) setFeedback(parsed.feedback);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void saveDraft();
    }, 30000);
    return () => window.clearInterval(timer);
  });

  async function saveDraft() {
    setSaving(true);
    const payload = { scores, feedback };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    const response = await fetch(`/api/judge/assignments/${props.assignment.id}/draft`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (!response.ok) {
      toast.error("自动保存失败");
      return;
    }
    toast.success("评分已暂存");
  }

  async function submitFinal() {
    setSubmitting(true);
    const response = await fetch(`/api/judge/assignments/${props.assignment.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scores, feedback })
    });
    const result = await response.json();
    setSubmitting(false);
    setConfirming(false);
    if (!response.ok) {
      toast.error(result.error ?? "提交失败");
      return;
    }
    localStorage.removeItem(storageKey);
    toast.success("评分已提交");
    window.location.href = "/judge/dashboard";
  }

  return (
    <div className="space-y-6">
      <div className="page-title-bar rounded-xl border border-[var(--color-tech-border)] bg-[var(--color-tech-surface)]">
        <div className="page-title-inner px-4">
          <h1 className="page-title-heading text-2xl">{props.assignment.projectName}</h1>
          <p className="page-title-description text-sm">评分状态：{props.assignment.status}</p>
        </div>
      </div>

      <details className="rounded-xl border border-[var(--color-tech-border)] bg-[var(--color-tech-surface-light)] p-4" open>
        <summary className="cursor-pointer text-sm font-medium text-[var(--color-tech-text-primary)]">评分标准（可折叠）</summary>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {props.assignment.criteria.map((criterion) => (
            <div key={criterion.id} className="rounded-lg border border-[var(--color-tech-border)] bg-[var(--color-tech-surface)] p-3">
              <div className="text-sm font-semibold text-[var(--color-tech-text-primary)]">{criterion.name}</div>
              <div className="mt-1 text-xs text-[var(--color-tech-text-secondary)]">{criterion.description ?? "无描述"}</div>
              <div className="mt-1 text-xs text-[var(--color-tech-text-muted)]">范围 {criterion.minScore} - {criterion.maxScore}</div>
            </div>
          ))}
        </div>
      </details>

      <div className="space-y-3">
        {props.assignment.criteria.map((criterion) => (
          <div key={criterion.id} className="rounded-xl border border-[var(--color-tech-border)] bg-[var(--color-tech-surface)] p-4">
            <div className="text-base font-semibold text-[var(--color-tech-text-primary)]">{criterion.name}</div>
            <input
              type="number"
              min={criterion.minScore}
              max={criterion.maxScore}
              value={scores[criterion.id] ?? ""}
              onChange={(event) => {
                const value = Number(event.target.value);
                setScores((prev) => ({ ...prev, [criterion.id]: Number.isNaN(value) ? 0 : value }));
              }}
              className="mt-3 w-full h-11 bg-[var(--color-tech-surface-light)] border border-[var(--color-tech-border)] rounded-lg px-3 text-sm text-[var(--color-tech-text-primary)] focus:ring-2 focus:ring-[var(--color-electric-blue)] outline-none"
            />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-tech-border)] bg-[var(--color-tech-surface)] p-4">
        <div className="text-sm font-medium text-[var(--color-tech-text-primary)]">评语</div>
        <textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          className="mt-2 w-full min-h-[140px] bg-[var(--color-tech-surface-light)] border border-[var(--color-tech-border)] rounded-lg p-3 text-sm text-[var(--color-tech-text-primary)] focus:ring-2 focus:ring-[var(--color-electric-blue)] outline-none"
          placeholder="请输入评语"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <button type="button" onClick={saveDraft} className="min-h-11 px-4 rounded-lg border border-[var(--color-tech-border)] text-[var(--color-tech-text-secondary)] hover:bg-[var(--color-tech-surface-light)] tech-transition">
          {saving ? "保存中..." : "暂存评分"}
        </button>
        <button type="button" onClick={() => setConfirming(true)} className="min-h-11 px-4 rounded-lg bg-[var(--color-electric-blue)] text-[var(--color-tech-bg)] hover:opacity-90 tech-transition">
          提交最终评分
        </button>
      </div>

      {confirming ? (
        <div className="fixed inset-0 bg-[var(--color-tech-bg)]/80 backdrop-blur-md z-50 p-4 flex items-center justify-center">
          <div className="app-overlay-panel rounded-xl bg-[var(--color-tech-surface)] border border-[var(--color-tech-border)] p-6 shadow-tech">
            <div className="text-lg font-semibold text-[var(--color-tech-text-primary)]">确认提交评分？</div>
            <p className="mt-2 text-sm text-[var(--color-tech-text-secondary)]">提交后将标记为已完成，不建议继续修改。</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setConfirming(false)} className="flex-1 min-h-11 px-4 rounded-lg border border-[var(--color-tech-border)] text-[var(--color-tech-text-secondary)] hover:bg-[var(--color-tech-surface-light)] tech-transition">取消</button>
              <button type="button" onClick={submitFinal} disabled={submitting} className="flex-1 min-h-11 px-4 rounded-lg bg-[var(--color-electric-blue)] text-[var(--color-tech-bg)] hover:opacity-90 tech-transition disabled:opacity-50">
                {submitting ? "提交中..." : "确认提交"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>

  );
}
