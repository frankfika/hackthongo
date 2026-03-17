"use client";

import { useState } from "react";
import { toast } from "sonner";

type BatchSubmitButtonProps = {
  assignmentIds: string[];
};

export function BatchSubmitButton(props: BatchSubmitButtonProps) {
  const [submitting, setSubmitting] = useState(false);

  async function onBatchSubmit() {
    if (props.assignmentIds.length === 0) {
      toast.info("当前没有可批量提交的暂存评分");
      return;
    }
    setSubmitting(true);
    const response = await fetch("/api/judge/assignments/batch-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentIds: props.assignmentIds })
    });
    const result = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      toast.error(result.error ?? "批量提交失败");
      return;
    }
    toast.success(`批量提交完成：${result.submittedCount} 项`);
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={onBatchSubmit}
      disabled={submitting}
      className="min-h-11 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium disabled:opacity-50"
    >
      {submitting ? "批量提交中..." : "提交暂存评分"}
    </button>
  );
}
