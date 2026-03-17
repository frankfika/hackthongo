export default function FooterLongTestPage() {
  return (
    <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-8 md:py-12 space-y-6">
      <h1 className="text-2xl md:text-4xl font-semibold text-slate-900">Fixed Footer 长页面测试</h1>
      {Array.from({ length: 28 }).map((_, index) => (
        <p key={index} className="text-[14px] md:text-[16px] text-slate-600 leading-relaxed">
          这是第 {index + 1} 段测试内容。用于模拟页面内容超过一屏时，Footer 始终固定在视口底部，正文与交互不被遮挡。
        </p>
      ))}
    </div>
  );
}
