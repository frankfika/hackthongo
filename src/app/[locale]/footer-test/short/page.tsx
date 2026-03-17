export default function FooterShortTestPage() {
  return (
    <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-2xl md:text-4xl font-semibold text-slate-900">Fixed Footer 短页面测试</h1>
      <p className="mt-4 text-[14px] md:text-[16px] text-slate-600 leading-relaxed">
        当前页面内容较少，用于验证内容不足一屏时 Footer 是否固定悬浮在视口底部。
      </p>
    </div>
  );
}
