import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner"
import { Link } from "@/i18n/routing";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NavigationLinks } from "./NavigationLinks";
import { FooterSlot } from "@/components/FooterSlot";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { ThemeToggle } from "@/components/ThemeToggle";
import { AICommandCenter } from "@/components/AICommandCenter";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "HackThonGo",
  description: "Modern Hackathon Management",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fafafa',
};

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const messages = await getMessages();
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? null;

  return (
    <html lang={params.locale} suppressHydrationWarning>
      <body className={`${inter.className} antialiased selection:bg-primary/20`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange
          >
            <div className="app-shell min-h-screen bg-background text-foreground transition-colors duration-500">
              {/* Apple-style Glassmorphic Header */}
              <header className="sticky top-0 z-50 w-full border-b border-border bg-background/60 backdrop-blur-[20px] transition-all duration-300">
                <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:px-10">
                  <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-80">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary shadow-apple transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                      <span className="text-xl font-bold text-primary-foreground tracking-tighter">H</span>
                    </div>
                    <span className="text-[20px] font-bold tracking-tight text-foreground/90">HackThonGo</span>
                  </Link>
                  
                  <nav className="flex items-center gap-10">
                    <div className="hidden items-center gap-8 lg:flex">
                      <NavigationLinks />
                    </div>
                    
                    <div className="hidden md:block">
                      <AICommandCenter />
                    </div>
                    
                    <div className="flex items-center gap-4 pl-6 border-l border-border/60">
                      <ThemeToggle />
                      <Link 
                        href="/submit" 
                        className="hidden md:flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-apple transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95"
                      >
                        Submit Project
                      </Link>
                      <LanguageSwitcher />
                    </div>
                  </nav>
                </div>
              </header>
              
              <main className="app-main relative z-10">
                <div className="flex-1">
                  {props.children}
                </div>
                <div className="app-footer mt-auto">
                  <FooterSlot role={role} />
                </div>
              </main>
              
              <Toaster position="bottom-center" richColors />
            </div>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
