import { useState, useEffect, type ReactNode } from 'react';
import { AppShell } from './AppShell';
import { CommandPalette } from './CommandPalette';
import { ToastContainer, useToasts } from '../ui/Toast';

interface PremiumShellProps {
  children: ReactNode;
}

export function PremiumShell({ children }: PremiumShellProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { toasts, dismiss } = useToasts();

  // Global keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <AppShell onCommandPaletteOpen={() => setCommandPaletteOpen(true)}>
        {children}
      </AppShell>
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
