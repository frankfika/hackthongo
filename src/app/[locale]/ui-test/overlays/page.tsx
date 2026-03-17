import { OverlayPlayground } from "@/components/ui/overlay-playground";

export default function OverlayTestPage() {
  return (
    <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-2xl md:text-4xl font-semibold text-slate-900">提示与弹窗适配测试页</h1>
      <p className="mt-3 text-[14px] md:text-[16px] text-slate-600 leading-relaxed">
        本页用于验证 Toast、Tooltip、Modal 在不同分辨率下是否超出屏幕。
      </p>
      <div className="mt-6">
        <OverlayPlayground />
      </div>
    </div>
  );
}
