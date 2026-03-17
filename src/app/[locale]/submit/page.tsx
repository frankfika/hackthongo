import { prisma } from "@/lib/prisma";
import { SubmitForm } from "./SubmitForm";
import { getTranslations } from "next-intl/server";
import { PageTitleBar } from "@/components/PageTitleBar";

export default async function SubmitPage() {
  const t = await getTranslations("Submit");
  const competition = await prisma.competition.findFirst();
  
  if (!competition) {
    return <div>No active competition found.</div>;
  }

  if (competition.status !== 'REGISTRATION' && competition.status !== 'IN_PROGRESS') {
    return (
      <div className="text-center py-32 max-w-[800px] mx-auto glass-effect rounded-2xl metal-shadow mt-12">
        <h2 className="text-3xl font-bold metal-gradient-text tracking-tight">{t("closedTitle")}</h2>
        <p className="mt-4 text-[var(--color-metal-text-secondary)]">{t("closedDesc")}</p>
      </div>
    );
  }

  return (
    <div className="page-content-safe max-w-[800px] mx-auto space-y-12 py-10 md:py-12 relative z-10">
      <PageTitleBar
        title={t("title")}
        description="Complete the form below to enter the competition."
        align="center"
        titleClassName="metal-gradient-text"
      />
      
      <div className="glass-effect rounded-2xl metal-shadow p-6 md:p-12 metal-border relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/40 rounded-full blur-[80px] pointer-events-none"></div>
        <SubmitForm 
          registrationForm={competition.registrationForm as any} 
          submissionForm={competition.submissionForm as any} 
        />
      </div>
    </div>
  );
}
