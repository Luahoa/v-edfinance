'use client';

import Header from '@/components/organisms/Header';
import Sidebar from '@/components/organisms/Sidebar';
import { CommandPalette } from '@/components/organisms/CommandPalette';
import { useNavigationShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enable keyboard shortcuts (Alt+H/L/P/S)
  useNavigationShortcuts();

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black overflow-hidden">
      {/* Command Palette (CMD+K) */}
      <CommandPalette />
      
      {/* Sidebar - Desktop */}
      <Sidebar className="hidden lg:flex w-64 flex-col border-r border-zinc-200 dark:border-zinc-800" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
