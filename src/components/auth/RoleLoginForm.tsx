"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type RoleLoginFormProps = {
  role: "ADMIN" | "JUDGE";
};

export function RoleLoginForm(props: RoleLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const portal = props.role === "ADMIN" ? "admin" : "judge";
    const result = await signIn("credentials", {
      email,
      password,
      portal,
      redirect: false
    });
    setLoading(false);

    if (result?.error) {
      toast.error("账号、密码或角色不匹配");
      return;
    }

    if (props.role === "ADMIN") {
      router.push("/admin/dashboard");
    } else {
      router.push("/judge/dashboard");
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">{props.role === "ADMIN" ? "管理员登录" : "评委登录"}</h1>
        <p className="mt-2 text-sm md:text-base text-slate-600">请使用对应角色账号进入系统</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-700">邮箱</Label>
        <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 md:h-12 text-sm md:text-base" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-700">密码</Label>
        <Input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 md:h-12 text-sm md:text-base" />
      </div>
      <Button type="submit" disabled={loading} className="w-full h-11 md:h-12 bg-indigo-600 hover:bg-indigo-700 text-white">
        {loading ? "登录中..." : "进入系统"}
      </Button>
    </form>
  );
}
