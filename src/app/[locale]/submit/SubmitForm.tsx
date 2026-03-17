"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

type FormField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
};

export function SubmitForm({
  registrationForm,
  submissionForm,
}: {
  registrationForm: FormField[];
  submissionForm: FormField[];
}) {
  const router = useRouter();
  const t = useTranslations("Submit");
  const [loading, setLoading] = useState(false);

  const fillMockData = () => {
    const isZh = Math.random() > 0.5;
    const form = document.querySelector('form');
    if (!form) return;

    // Helper to set value
    const setValue = (name: string, val: string) => {
      const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement;
      if (input) input.value = val;
    };

    registrationForm.forEach(f => {
      const id = `reg_${f.id}`;
      if (f.id === 'name') setValue(id, isZh ? '张三' : 'John Doe');
      if (f.id === 'email') setValue(id, `test${Math.floor(Math.random()*1000)}@example.com`);
      if (f.id === 'phone') setValue(id, isZh ? '13800138000' : '+1234567890');
    });

    submissionForm.forEach(f => {
      const id = `sub_${f.id}`;
      if (f.id === 'projectName') setValue(id, isZh ? `神奇AI项目 ${Math.floor(Math.random()*100)}` : `Awesome AI Project ${Math.floor(Math.random()*100)}`);
      if (f.id === 'description') setValue(id, isZh ? '这是一个基于最新大模型的创新项目，旨在解决行业痛点。' : 'This is an innovative project based on the latest LLMs to solve industry pain points.');
      if (f.id === 'repoUrl') setValue(id, 'https://github.com/example/repo');
      if (f.id === 'demoUrl') setValue(id, 'https://demo.example.com');
    });
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const regData: Record<string, any> = {};
    const subData: Record<string, any> = {};

    registrationForm.forEach((field) => {
      regData[field.id] = formData.get(`reg_${field.id}`);
    });
    submissionForm.forEach((field) => {
      subData[field.id] = formData.get(`sub_${field.id}`);
    });

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationData: regData,
          submissionData: subData,
        }),
      });

      if (!res.ok) throw new Error("Submission failed");

      const { receiptNumber } = await res.json();
      router.push(`/submit/success?receipt=${receiptNumber}`);
    } catch (error) {
      toast.error(t("submitError") || "Failed to submit project");
      setLoading(false);
    }
  }

  const renderField = (field: FormField, prefix: string) => {
    const id = `${prefix}_${field.id}`;
    const labelText = t.has(`fields.${field.id}`) ? t(`fields.${field.id}`) : field.label;
    
    return (
      <div key={id} className="space-y-2.5 group">
        <Label htmlFor={id} className="text-[13px] font-bold text-muted-foreground tracking-tight ml-1">
          {labelText} {field.required && <span className="text-destructive">*</span>}
        </Label>
        {field.type === "textarea" ? (
          <Textarea 
            id={id} 
            name={id} 
            required={field.required} 
            className="bg-muted/30 border-border/40 focus-visible:ring-primary/20 rounded-2xl min-h-[160px] text-base p-4 transition-all hover:bg-muted/50" 
          />
        ) : (
          <Input 
            id={id} 
            name={id} 
            type={field.type} 
            required={field.required} 
            className="h-12 bg-muted/30 border-border/40 focus-visible:ring-primary/20 rounded-xl px-4 text-base transition-all hover:bg-muted/50" 
          />
        )}
      </div>
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-16 relative z-10">
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t("teamInfo")}
          </h2>
          <div className="h-1 w-12 rounded-full bg-primary/20"></div>
        </div>
        <div className="grid gap-8">
          {registrationForm.map((f) => renderField(f, "reg"))}
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t("projectInfo")}
          </h2>
          <div className="h-1 w-12 rounded-full bg-primary/20"></div>
        </div>
        <div className="grid gap-8">
          {submissionForm.map((f) => renderField(f, "sub"))}
        </div>
      </div>

      <div className="pt-10 flex flex-col sm:flex-row justify-between items-center gap-6">
        {process.env.NODE_ENV === 'development' && (
          <Button 
            type="button" 
            variant="ghost" 
            onClick={fillMockData}
            className="text-xs font-bold text-muted-foreground hover:text-primary rounded-full"
          >
            DEBUG: FILL MOCK DATA
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full sm:w-auto min-w-[240px] h-14 text-base font-bold rounded-full bg-primary shadow-apple hover:scale-[1.02] active:scale-95 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            <>
              {t("submitBtn")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );

}
