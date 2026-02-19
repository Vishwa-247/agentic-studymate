
import { cn } from "@/lib/utils";

interface GlassMorphismProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "light" | "medium" | "heavy";
  border?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  shadow?: boolean;
}

const GlassMorphism = ({
  children,
  className,
  intensity = "medium",
  border = true,
  rounded = "lg",
  shadow = true,
}: GlassMorphismProps) => {
  const intensityClasses = {
    light: "bg-card border-border shadow-sm",
    medium: "bg-card border-border shadow-md",
    heavy: "bg-card border-border shadow-lg",
  };

  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  };

  return (
    <div
      className={cn(
        intensityClasses[intensity],
        roundedClasses[rounded],
        border && "border border-white/20 dark:border-white/10",
        shadow && "shadow-glass",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassMorphism;
