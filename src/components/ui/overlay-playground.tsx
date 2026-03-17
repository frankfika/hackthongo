"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export function OverlayPlayground() {
  const [open, setOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button
          id="open-overlay-modal"
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-11 px-4 rounded-md bg-indigo-600 text-white text-[14px] md:text-[16px] hover:bg-indigo-700 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
        >
          打开弹窗
        </button>
        <button
          type="button"
          onClick={() =>
            toast.error("这是一个用于适配测试的提示消息，已限制最大宽高并自动保持在可视区。")
          }
          className="min-h-11 px-4 rounded-md border border-slate-300 text-slate-700 text-[14px] md:text-[16px] hover:bg-slate-50 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
        >
          触发 Toast
        </button>
        <button
          type="button"
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onFocus={() => setShowTip(true)}
          onBlur={() => setShowTip(false)}
          className="min-h-11 px-4 rounded-md border border-slate-300 text-slate-700 text-[14px] md:text-[16px] relative hover:bg-slate-50 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
        >
          悬停查看 Tooltip
          {showTip ? (
            <span className="app-tooltip absolute z-40 left-1/2 -translate-x-1/2 max-[320px]:left-0 max-[320px]:translate-x-0 top-full mt-2 px-3 py-2 rounded-md bg-slate-900 text-white text-xs shadow-lg">
              Tooltip 会在小屏下自动限制宽度，避免超出可视区域。
            </span>
          ) : null}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div role="dialog" aria-modal="true" className="app-overlay-panel rounded-xl bg-white border border-slate-200 p-4 md:p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900">响应式弹窗规范验证</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 px-3 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
              >
                关闭
              </button>
            </div>
            <div className="mt-4 space-y-3 text-[14px] md:text-[16px] text-slate-600 leading-relaxed">
              {Array.from({ length: 20 }).map((_, index) => (
                <p key={index}>
                  这是第 {index + 1} 行内容，用于验证弹窗最大宽度不超过视口 90%，最大高度不超过视口 85%，并且超出内容可内部滚动。
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
