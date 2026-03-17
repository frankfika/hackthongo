import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/authz";
import { AdminShell } from "./AdminShell";

type AdminPageFrameProps = {
  children: React.ReactNode;
};

export async function AdminPageFrame(props: AdminPageFrameProps) {
  const session = await requirePageRole("ADMIN");
  if (!session) {
    redirect("/admin/login");
  }
  return <AdminShell userName={session.user.name ?? "Admin"}>{props.children}</AdminShell>;
}
