import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "buy" | "sell" | "destructive";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "default"     && "bg-[var(--accent)] text-white hover:brightness-110",
        variant === "ghost"       && "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]",
        variant === "outline"     && "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-2)]",
        variant === "buy"         && "bg-[var(--green)] text-white hover:brightness-110 font-semibold",
        variant === "sell"        && "bg-[var(--red)] text-white hover:brightness-110 font-semibold",
        variant === "destructive" && "bg-[var(--red)] text-white hover:brightness-110",
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
