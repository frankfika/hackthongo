"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative w-10 h-10 rounded-full bg-secondary/50 hover:bg-secondary transition-all duration-500 overflow-hidden"
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 transform dark:-rotate-90 dark:scale-0">
        <Sun className="h-5 w-5 text-amber-500 fill-amber-500/10" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 transform rotate-90 scale-0 dark:rotate-0 dark:scale-100">
        <Moon className="h-5 w-5 text-indigo-400 fill-indigo-400/10" />
      </div>
    </Button>
  );
}
