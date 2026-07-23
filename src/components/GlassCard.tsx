import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export function GlassCard({ children, className, interactive, ...rest }: GlassCardProps) {
  return (
    <div
      className={cn("glass-card p-6", interactive && "glass-card-hover cursor-pointer", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
