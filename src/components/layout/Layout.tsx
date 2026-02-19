
import { ReactNode } from "react";
import Navbar from "./Navbar";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  className?: string;
  withNavbar?: boolean;
  withFooter?: boolean;
  noPadding?: boolean;
}

export default function Layout({
  children,
  className,
  withNavbar = true,
  withFooter = false,
  noPadding = false,
}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {withNavbar && <Navbar />}
      <main className={cn("flex-1", !noPadding && "pt-28", className)}>
        {children}
      </main>
      {withFooter && (
        <footer className="py-6 border-t">
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} InterviewGenius LMS. All rights reserved.
          </div>
        </footer>
      )}
    </div>
  );
}
