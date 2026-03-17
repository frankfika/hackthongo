import { getTranslations } from "next-intl/server";
import { AdminPageFrame } from "../AdminPageFrame";
import { PageTitleBar } from "@/components/PageTitleBar";

export default async function AdminRoundsPage() {
  const t = await getTranslations("Admin");

  return (
    <AdminPageFrame>
    <div className="max-w-[1200px] mx-auto px-2 py-2">
      <PageTitleBar title={t("manageRounds")} className="top-0" />
    </div>
    </AdminPageFrame>
  );
}
