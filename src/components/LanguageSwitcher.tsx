"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransition } from "react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const onSelectChange = (nextLocale: string | null) => {
    if (!nextLocale) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <Select defaultValue={locale} onValueChange={onSelectChange} disabled={isPending}>
      <SelectTrigger aria-label="Language selector" className="w-[110px] h-10 text-sm font-semibold bg-secondary/50 border-border/40 text-foreground/80 focus:ring-primary/20 rounded-full transition-all hover:bg-secondary">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent className="rounded-2xl border-border bg-card/90 backdrop-blur-xl shadow-glass">
        <SelectItem value="en" className="rounded-lg cursor-pointer transition-colors focus:bg-primary/10">English</SelectItem>
        <SelectItem value="zh" className="rounded-lg cursor-pointer transition-colors focus:bg-primary/10">中文</SelectItem>
      </SelectContent>
    </Select>

  );
}
