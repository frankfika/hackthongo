"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Mic, Sparkles, Command, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function AICommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !isOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const toggleListening = () => {
    setIsListening(!isListening);
    // In a real implementation, we would use the Web Speech API here
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        setQuery("Show me the top projects in AI category");
      }, 2000);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="relative h-10 w-full max-w-[400px] justify-start rounded-full border-border/40 bg-muted/30 px-4 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/50 hover:ring-2 hover:ring-primary/20 md:flex hidden"
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Ask AI or search...</span>
        <kbd className="pointer-events-none absolute right-3 top-2.5 hidden h-5 select-none items-center gap-1 rounded border border-border/40 bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-background/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-[640px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl glass-effect"
            >
              <div className="flex items-center border-b border-border px-4 h-16">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask anything or use voice command..."
                  className="flex-1 bg-transparent px-4 py-2 text-lg outline-none placeholder:text-muted-foreground"
                />
                <button
                  onClick={toggleListening}
                  className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500/10 text-red-500 animate-bounce' : 'hover:bg-muted text-muted-foreground'}`}
                >
                  <Mic className="h-5 w-5" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted rounded-full text-muted-foreground ml-2">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 max-h-[400px] overflow-y-auto">
                <div className="mb-4">
                  <h4 className="px-2 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Smart Suggestions</h4>
                  <div className="grid gap-1">
                    {["Trending projects this week", "Leaderboard overview", "Judging criteria details", "Submit a new project"].map((item) => (
                      <button
                        key={item}
                        onClick={() => setQuery(item)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all hover:bg-primary/5 hover:text-primary group text-left"
                      >
                        <div className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10">
                          <Command className="h-4 w-4" />
                        </div>
                        <span className="flex-1 font-medium">{item}</span>
                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border px-4 py-3 bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex gap-4">
                  <span><kbd className="font-sans">ESC</kbd> to close</span>
                  <span><kbd className="font-sans">ENTER</kbd> to ask AI</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>AI Native Engine</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
