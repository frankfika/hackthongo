import { Link } from "@/i18n/routing";

export default function SignInEntryPage() {
  return (
    <div className="min-h-[70vh] px-4 py-10 md:py-16 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">选择登录入口</h1>
        <p className="mt-2 text-sm md:text-base text-slate-600">管理员与评委使用独立认证入口，系统会执行角色校验。</p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/admin/login" className="min-h-12 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium inline-flex items-center justify-center">
            管理员登录
          </Link>
          <Link href="/judge/login" className="min-h-12 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium inline-flex items-center justify-center">
            评委登录
          </Link>
        </div>
      </div>
    </div>
  );
}
