import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ArrowRight, Trophy, Calendar, Sparkles, Zap, BrainCircuit, Globe } from "lucide-react";
import * as motion from "framer-motion/client";

export default async function Home() {
  const t = await getTranslations("Home");
  const competition = await prisma.competition.findFirst();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <main className="flex min-h-[calc(100dvh-var(--app-header-height)-var(--app-footer-occupied-height))] flex-col overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/5 blur-[100px] dark:bg-purple-500/10" />
      </div>

      <section className="relative mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-6 py-16 md:px-10 md:py-28 lg:py-32">
        <div className="z-10 mx-auto flex w-full max-w-[1000px] flex-1 flex-col items-center justify-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-xs font-bold tracking-[0.15em] text-primary uppercase"
          >
            <Sparkles className="h-4 w-4" />
            <span>{competition?.status ? competition.status.replace('_', ' ') : 'AI Native Hackathon 2026'}</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="heading-xl mb-8 text-foreground text-balance"
          >
            Design the <span className="ai-text-gradient">Future</span> with Intelligence.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12 text-xl leading-relaxed text-muted-foreground md:text-2xl max-w-[800px] text-balance font-medium"
          >
            {competition?.tagline || "Experience the first AI-Native hackathon. Smart judging, dynamic team formation, and global scale prize pools."}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16 grid w-full max-w-[800px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div className="group glass-effect flex flex-col items-start gap-4 rounded-3xl p-6 transition-all hover:translate-y-[-4px] hover:shadow-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="text-left">
                <span className="block text-[11px] font-black tracking-widest text-muted-foreground uppercase opacity-60">Timeline</span>
                <span className="text-base font-bold text-foreground">
                  {competition ? `${formatDate(competition.startTime)} → ${formatDate(competition.endTime)}` : "Apr 15 - 17, 2026"}
                </span>
              </div>
            </div>
            
            <div className="group glass-effect flex flex-col items-start gap-4 rounded-3xl p-6 transition-all hover:translate-y-[-4px] hover:shadow-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 transition-colors group-hover:bg-purple-500 group-hover:text-white">
                <Trophy className="h-6 w-6" />
              </div>
              <div className="text-left">
                <span className="block text-[11px] font-black tracking-widest text-muted-foreground uppercase opacity-60">Prize Pool</span>
                <span className="text-base font-bold text-foreground">
                  {competition?.prizePool || "$100,000 AI Credits"}
                </span>
              </div>
            </div>

            <div className="group glass-effect sm:col-span-2 lg:col-span-1 flex flex-col items-start gap-4 rounded-3xl p-6 transition-all hover:translate-y-[-4px] hover:shadow-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                <Globe className="h-6 w-6" />
              </div>
              <div className="text-left">
                <span className="block text-[11px] font-black tracking-widest text-muted-foreground uppercase opacity-60">Region</span>
                <span className="text-base font-bold text-foreground">Global / Remote</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex w-full flex-col items-center justify-center gap-6 sm:flex-row"
          >
            <Link href="/submit" className="w-full sm:w-auto">
              <Button size="lg" className="h-16 w-full rounded-full bg-primary px-12 text-lg font-bold shadow-apple transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 sm:w-auto">
                Join the Mission
                <Zap className="ml-2 h-5 w-5 fill-current" />
              </Button>
            </Link>
            
            <Link href="/docs" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="h-16 w-full rounded-full border-border/60 bg-background/40 backdrop-blur-sm px-12 text-lg font-bold transition-all hover:bg-muted hover:scale-105 active:scale-95 sm:w-auto">
                Learn More
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* AI Insight Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-24 w-full glass-effect rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-primary/10"
        >
          <div className="flex items-center gap-6 text-left">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <BrainCircuit className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">AI Matching Engine Active</h3>
              <p className="text-sm text-muted-foreground">Finding the best team members based on your skills...</p>
            </div>
          </div>
          <div className="flex -space-x-3 overflow-hidden">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-background bg-secondary flex items-center justify-center text-[10px] font-bold">
                U{i}
              </div>
            ))}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-background text-[10px] font-bold">
              +42
            </div>
          </div>
          <Button variant="ghost" className="rounded-full font-bold text-primary hover:bg-primary/5">
            View Smart Recommendations
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
        
        <div className="absolute right-10 bottom-10 z-20 hidden text-[11px] font-black tracking-[0.2em] text-muted-foreground/30 uppercase transition-colors hover:text-primary sm:block">
          <Link href="/auth/signin">Terminal Access</Link>
        </div>
      </section>
    </main>
  );
}
