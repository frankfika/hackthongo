"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useMemo } from "react";

type AdminShellProps = {
  userName: string;
  children: React.ReactNode;
};

const modules = [
  { href: "/admin/dashboard", label: "控制台" },
  { href: "/admin/projects", label: "项目管理" },
  { href: "/admin/competition", label: "赛事配置" },
  { href: "/admin/judges", label: "评委管理" },
  { href: "/admin/rounds", label: "轮次管理" }
];

export function AdminShell(props: AdminShellProps) {
  const pathname = usePathname();
  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.slice(1);
  }, [pathname]);

  return (
    <div className="min-h-[calc(100dvh-var(--app-header-height))] flex bg-slate-50">
      <aside className="hidden xl:flex xl:w-[280px] 2xl:w-[300px] border-r border-slate-200 bg-white sticky top-[var(--page-title-sticky-top)] h-[calc(100dvh-var(--page-title-sticky-top))] flex-col">
        <div className="px-5 py-6 border-b border-slate-200">
          <div className="text-xl font-bold text-slate-900">HackThonGo Admin</div>
          <div className="mt-2 text-sm text-slate-500">管理员：{props.userName}</div>
        </div>
        <nav className="p-4 space-y-2 overflow-y-auto">
          {modules.map((module) => {
            const active = pathname.startsWith(module.href);
            return (
              <Link
                key={module.href}
                href={module.href}
                className={`min-h-11 px-3 rounded-lg flex items-center text-sm font-medium transition-colors ${
                  active ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {module.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="px-4 md:px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-20">
          <div className="text-sm text-slate-500">
            Admin
            {crumbs.map((crumb) => (
              <span key={crumb}> / <span className="text-slate-700">{crumb}</span></span>
            ))}
          </div>
          <div className="mt-1 text-xl md:text-2xl font-semibold text-slate-900">管理员工作台</div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full max-w-[1400px] mx-auto">{props.children}</div>
        </div>
      </div>
    </div>
  );
}
