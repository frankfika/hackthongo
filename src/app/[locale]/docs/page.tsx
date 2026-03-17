import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import ReactMarkdown from 'react-markdown';
import { PageTitleBar } from "@/components/PageTitleBar";
import { isAllowedEmbedUrl } from "@/lib/security";

export default async function DocsPage() {
  const t = await getTranslations("Docs");
  const competition = await prisma.competition.findFirst();
  const safeEmbedUrl = competition?.introGitbookUrl && isAllowedEmbedUrl(competition.introGitbookUrl)
    ? competition.introGitbookUrl
    : null;

  return (
    <div className="page-content-safe max-w-[1000px] mx-auto py-[40px] md:py-[56px] fade-in slide-up">
      <PageTitleBar
        title={t("title")}
        description={t("description")}
        className="opacity-0 fade-in stagger-1"
      />

      <div className="bg-white rounded-3xl border border-[var(--color-premium-border)] p-10 md:p-[80px] premium-shadow-hover premium-transition opacity-0 fade-in stagger-2">
        {competition && (competition.introMarkdown || competition.introGitbookUrl) ? (
          <div className="prose prose-neutral max-w-none 
            prose-p:text-base prose-p:leading-relaxed prose-p:text-[var(--color-premium-text-secondary)]
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-[var(--color-premium-text-primary)]
            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
            prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:font-bold prose-strong:text-[var(--color-premium-text-primary)]
            prose-ul:text-base prose-li:my-2
          ">
            {safeEmbedUrl ? (
              <iframe 
                src={safeEmbedUrl}
                className="w-full min-h-[800px] border-0 rounded-xl"
                title="Competition Rules"
              />
            ) : (
              <ReactMarkdown>{competition.introMarkdown || ""}</ReactMarkdown>
            )}
          </div>
        ) : (
          <div className="text-center py-[100px] text-base text-[var(--color-premium-text-muted)] font-light tracking-widest uppercase">
            No documentation available
          </div>
        )}
      </div>
    </div>
  );
}
