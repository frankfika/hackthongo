"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export function NavigationLinks() {
  const t = useTranslations("Navigation");
  const pathname = usePathname();

  const links = [
    { href: "/", label: t("home") },
    { href: "/docs", label: t("docs") },
    { href: "/leaderboard", label: t("leaderboard") },
  ];

  return (
    <div className="flex items-center gap-6">
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
        return (
          <Link 
            key={link.href} 
            href={link.href}
            className={`text-sm font-semibold transition-all duration-300 relative py-1 px-2 ${
              isActive 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {link.label}
            {isActive && (
              <motion.div 
                layoutId="nav-underline"
                className="absolute bottom-[-4px] left-0 right-0 h-[2px] bg-primary rounded-full"
              />
            )}
          </Link>

        );
      })}
    </div>
  );
}
