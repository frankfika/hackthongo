"use client";

import { usePathname } from "@/i18n/routing";
import { Footer } from "@/components/Footer";

type FooterSlotProps = {
  role: "ADMIN" | "JUDGE" | null;
};

export function FooterSlot(props: FooterSlotProps) {
  const pathname = usePathname();

  if (pathname === "/" || pathname.startsWith("/auth/signin") || pathname.startsWith("/admin") || pathname.startsWith("/judge")) {
    return null;
  }

  return <Footer role={props.role} />;
}
