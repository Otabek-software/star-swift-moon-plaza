import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "soft" }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-3.5 text-sm font-medium transition-colors duration-150 disabled:opacity-40",
        variant === "primary" && "bg-accent text-accent-fg hover:bg-fg",
        variant === "ghost" && "border border-border bg-transparent text-fg hover:bg-panel",
        variant === "soft" && "bg-panel text-fg hover:bg-border",
        variant === "danger" && "bg-bear text-fg hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "muted",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "muted" | "bull" | "bear" | "accent" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] font-medium",
        tone === "muted" && "bg-panel text-muted",
        tone === "bull" && "bg-bull/15 text-bull",
        tone === "bear" && "bg-bear/15 text-bear",
        tone === "accent" && "bg-fg/10 text-fg",
        className,
      )}
      {...props}
    />
  );
}
