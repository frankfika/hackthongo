import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { requirePageRole } from "@/lib/authz";
import { JudgePageFrame } from "../JudgePageFrame";
import { BatchSubmitButton } from "./BatchSubmitButton";

type JudgeDashboardProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function JudgeDashboard(props: JudgeDashboardProps) {
  const session = await requirePageRole("JUDGE");
  if (!session) {
    return null;
  }
  const searchParams = await props.searchParams;
  const currentPage = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const perPage = 9;
  const assignments = await prisma.judgeAssignment.findMany({
    where: { judgeId: session.user.id },
    include: {
      projectRound: {
        include: {
          project: true,
          round: true,
        },
      },
    },
    orderBy: { updatedAt: "asc" }
  });

  const pending = assignments.filter((a) => a.status === "PENDING").length;
  const completed = assignments.filter((a) => a.status === "COMPLETED").length;
  const startIndex = (currentPage - 1) * perPage;
  const pagedAssignments = assignments.slice(startIndex, startIndex + perPage);
  const totalPages = Math.max(1, Math.ceil(assignments.length / perPage));
  const criteria = await prisma.scoringCriterion.findMany({ orderBy: { name: "asc" } });
  const inProgressIds = assignments.filter((a) => a.status === "IN_PROGRESS").map((a) => a.id);

  return (
    <JudgePageFrame userName={session.user.name ?? "Judge"} completed={completed} total={assignments.length}>
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">我的评审项目</h1>
            <p className="mt-1 text-sm md:text-base text-slate-600">待评分 {pending} 个，已完成 {completed} 个</p>
          </div>
          <BatchSubmitButton assignmentIds={inProgressIds} />
        </div>

        <details className="border border-slate-200 rounded-xl bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm md:text-base font-medium text-slate-800">评分标准速查（可折叠）</summary>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {criteria.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                <div className="mt-1 text-xs text-slate-600">{item.description ?? "无描述"}</div>
                <div className="mt-1 text-xs text-slate-500">分值范围 {item.minScore} - {item.maxScore}</div>
              </div>
            ))}
          </div>
        </details>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pagedAssignments.map((assignment) => (
            <div key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-medium text-slate-500">ID: {assignment.id.slice(0, 8)}</div>
              <h2 className="mt-2 text-lg font-semibold text-slate-900 line-clamp-1">{assignment.projectRound.project.name}</h2>
              <div className="mt-2 text-sm text-slate-600">类型：{(assignment.projectRound.project.submissionData as any)?.track ?? "未分类"}</div>
              <div className="mt-1 text-sm text-slate-600">截止：{assignment.projectRound.round.updatedAt.toLocaleString()}</div>
              <div className="mt-1 text-sm">
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                  assignment.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : assignment.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
                }`}>
                  {assignment.status}
                </span>
              </div>
              <Link href={`/judge/scoring/${assignment.id}`} className="mt-4 min-h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium inline-flex items-center justify-center w-full">
                一键进入评分
              </Link>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-slate-500">第 {currentPage}/{totalPages} 页</div>
          <div className="flex items-center gap-2">
            <Link href={`/judge/dashboard?page=${Math.max(1, currentPage - 1)}`} className="min-h-11 px-3 rounded-lg border border-slate-200 inline-flex items-center text-sm text-slate-700">上一页</Link>
            <Link href={`/judge/dashboard?page=${Math.min(totalPages, currentPage + 1)}`} className="min-h-11 px-3 rounded-lg border border-slate-200 inline-flex items-center text-sm text-slate-700">下一页</Link>
          </div>
        </div>
      </div>
    </JudgePageFrame>
  );
}
