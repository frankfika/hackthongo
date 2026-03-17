import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { AdminPageFrame } from "../AdminPageFrame";
import { PageTitleBar } from "@/components/PageTitleBar";

export default async function AdminDashboard() {
  const t = await getTranslations("Admin");
  const competition = await prisma.competition.findFirst();
  const projectCount = await prisma.project.count();
  const judgeCount = await prisma.user.count({ where: { role: "JUDGE" } });

  return (
    <AdminPageFrame>
    <div className="space-y-8">
      <PageTitleBar
        title={t("dashboard")}
        description="Manage your hackathon event seamlessly."
        className="top-0"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[32px]">
        <Card className="bg-transparent border-0 shadow-none">
          <CardHeader className="px-0 pt-0 pb-[16px] border-b border-[var(--color-premium-gray-200)]">
            <CardTitle className="text-[var(--color-premium-gray-500)] text-[9pt] font-semibold uppercase tracking-widest">
              {t("compStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pt-[24px]">
            <div className="text-[28pt] md:text-[36pt] font-light text-[var(--color-premium-gray-900)] capitalize leading-none tracking-tight">{competition?.status.replace('_', ' ').toLowerCase() || "Unknown"}</div>
            <p className="text-[10pt] text-[var(--color-premium-gray-500)] mt-[12px]">{competition?.name}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-transparent border-0 shadow-none">
          <CardHeader className="px-0 pt-0 pb-[16px] border-b border-[var(--color-premium-gray-200)]">
            <CardTitle className="text-[var(--color-premium-gray-500)] text-[9pt] font-semibold uppercase tracking-widest">
              {t("totalSubmissions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pt-[24px]">
            <div className="text-[36pt] md:text-[48pt] font-light text-[var(--color-premium-gray-900)] leading-none tracking-tighter tabular-nums">{projectCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-0 shadow-none">
          <CardHeader className="px-0 pt-0 pb-[16px] border-b border-[var(--color-premium-gray-200)]">
            <CardTitle className="text-[var(--color-premium-gray-500)] text-[9pt] font-semibold uppercase tracking-widest">
              {t("activeJudges")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pt-[24px]">
            <div className="text-[36pt] md:text-[48pt] font-light text-[var(--color-premium-gray-900)] leading-none tracking-tighter tabular-nums">{judgeCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[32px] pt-[32px]">
        <Card className="bg-[var(--color-premium-gray-50)] border border-[var(--color-premium-gray-200)] shadow-none rounded-none p-[24px] md:p-[32px] premium-shadow-hover premium-transition">
          <CardHeader className="pb-[24px] px-0 pt-0 border-b border-[var(--color-premium-gray-200)]">
            <CardTitle className="text-[14pt] font-semibold text-[var(--color-premium-gray-900)] tracking-tight">
              {t("quickActions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-[8px] pt-[24px] px-0 pb-0">
            <Link href="/admin/competition" className="group flex items-center justify-between p-[16px] rounded-none bg-white text-[var(--color-premium-gray-700)] hover:text-[var(--color-premium-gray-900)] premium-transition font-medium border border-[var(--color-premium-gray-200)] hover:border-[var(--color-premium-gray-400)]">
              <span className="text-[11pt]">{t("editConfig")}</span>
              <span className="text-[var(--color-premium-gray-400)] group-hover:translate-x-1 premium-transition">→</span>
            </Link>
            <Link href="/admin/projects" className="group flex items-center justify-between p-[16px] rounded-none bg-white text-[var(--color-premium-gray-700)] hover:text-[var(--color-premium-gray-900)] premium-transition font-medium border border-[var(--color-premium-gray-200)] hover:border-[var(--color-premium-gray-400)]">
              <span className="text-[11pt]">{t("viewProjects")}</span>
              <span className="text-[var(--color-premium-gray-400)] group-hover:translate-x-1 premium-transition">→</span>
            </Link>
            <Link href="/admin/judges" className="group flex items-center justify-between p-[16px] rounded-none bg-white text-[var(--color-premium-gray-700)] hover:text-[var(--color-premium-gray-900)] premium-transition font-medium border border-[var(--color-premium-gray-200)] hover:border-[var(--color-premium-gray-400)]">
              <span className="text-[11pt]">{t("manageJudges")}</span>
              <span className="text-[var(--color-premium-gray-400)] group-hover:translate-x-1 premium-transition">→</span>
            </Link>
            <Link href="/admin/rounds" className="group flex items-center justify-between p-[16px] rounded-none bg-white text-[var(--color-premium-gray-700)] hover:text-[var(--color-premium-gray-900)] premium-transition font-medium border border-[var(--color-premium-gray-200)] hover:border-[var(--color-premium-gray-400)]">
              <span className="text-[11pt]">{t("manageRounds")}</span>
              <span className="text-[var(--color-premium-gray-400)] group-hover:translate-x-1 premium-transition">→</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
    </AdminPageFrame>
  );
}
