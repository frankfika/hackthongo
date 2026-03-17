import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type FooterProps = {
  role: "ADMIN" | "JUDGE" | null;
};

export function Footer(props: FooterProps) {
  const t = useTranslations("Footer");
  void props;

  return (
    <footer className="w-full border-t border-border bg-background/50 backdrop-blur-md">
      <div className="mx-auto max-w-[1400px] px-10">
        <div className="flex h-24 flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-[13px] font-medium text-muted-foreground/80">
            {t("copyright")}
          </p>
          <div className="flex items-center gap-8">
            <Link 
              href="/privacy" 
              className="text-[13px] font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {t("privacy")}
            </Link>
            <Link 
              href="/docs" 
              className="text-[13px] font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {t("terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>

  );
}
