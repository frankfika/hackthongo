import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { PageTitleBar } from "@/components/PageTitleBar";

export default async function SuccessPage(props: { searchParams: Promise<{ receipt: string }> }) {
  const searchParams = await props.searchParams;
  const receipt = searchParams.receipt;
  const t = await getTranslations("Submit");

  return (
    <div className="page-content-safe max-w-[800px] mx-auto mt-[16px] md:mt-[24px] text-center space-y-[48px] flex flex-col items-center">
      <PageTitleBar
        title={t("successTitle")}
        description={t("successDesc")}
        align="center"
        className="w-full"
        innerClassName="max-w-[500px] mx-auto"
      />
      <div className="w-[80px] h-[80px] bg-slate-900 text-indigo-300 rounded-full flex items-center justify-center mx-auto premium-shadow">
        <Check className="w-[32px] h-[32px]" />
      </div>

      <div className="py-[32px]">
        <div className="inline-block border border-slate-300 px-[40px] py-[24px] bg-white premium-shadow-hover premium-transition">
          <span className="font-mono text-[16pt] md:text-[20pt] font-medium tracking-[0.3em] text-slate-900">
            {receipt || "UNKNOWN"}
          </span>
        </div>
      </div>
      
      <p className="text-slate-400 text-[10pt] tracking-widest uppercase">
        {t("successNote")}
      </p>
      
      <div className="pt-[48px]">
        <Link href="/">
          <Button variant="outline" size="lg" className="rounded-full px-[40px] h-[56px] text-[11pt] font-medium border-slate-300 text-slate-700 hover:bg-slate-100 premium-transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2">
            {t("returnHome")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
