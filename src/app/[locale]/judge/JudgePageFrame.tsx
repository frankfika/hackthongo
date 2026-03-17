import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/authz";

type JudgePageFrameProps = {
  children: React.ReactNode;
  userName: string;
  completed: number;
  total: number;
};

export async function JudgePageFrame(props: JudgePageFrameProps) {
  const session = await requirePageRole("JUDGE");
  if (!session) {
    redirect("/judge/login");
  }

  const progress = props.total === 0 ? 0 : Math.round((props.completed / props.total) * 100);

  return (
    <div className="min-h-[calc(100dvh-var(--app-header-height))] bg-white">
      <div className="sticky top-[var(--page-title-sticky-top)] z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-slate-500">评委：{props.userName}</div>
              <div className="text-lg font-semibold text-slate-900">评分进度 {props.completed}/{props.total}</div>
            </div>
            <div className="w-40 md:w-64 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {props.children}
      </div>
    </div>
  );
}
