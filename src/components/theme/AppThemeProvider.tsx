import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

interface AppThemeProviderProps {
  children: ReactNode;
}

/**
 * Light-only theme guardrails.
 * Keeps next-themes consumers (e.g. Toaster) consistent without exposing a toggle.
 */
export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
