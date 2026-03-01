import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';
import Link from 'next/link';
import { ModeToggle } from '@/components/ThemeProvider';
import QueryProvider from '@/components/QueryProvider';

export const metadata: Metadata = {
  title: 'Network Debugger',
  description: 'VPC Egress Network Debugger',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="max-w-4xl mx-auto flex h-12 items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <Link href="/" className="font-semibold text-sm tracking-tight transition-colors hover:text-primary">
                    Network Debugger
                  </Link>
                  <span className="hidden sm:inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    VPC Egress
                  </span>
                </div>
                <ModeToggle />
              </div>
            </header>
            <main>
              <TooltipProvider>
                {children}
              </TooltipProvider>
            </main>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
