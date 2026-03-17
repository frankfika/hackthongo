import { RoleLoginForm } from "@/components/auth/RoleLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="min-h-[70vh] px-4 py-10 md:py-16 flex items-center justify-center">
      <RoleLoginForm role="ADMIN" />
    </div>
  );
}
