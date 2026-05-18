import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "green" | "red" | "yellow" | "purple" | "outline";
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variant === "default" && "bg-[var(--surface-2)] text-[var(--foreground)]",
        variant === "green"   && "bg-[rgba(63,185,80,0.15)] text-[var(--green)]",
        variant === "red"     && "bg-[rgba(248,81,73,0.15)] text-[var(--red)]",
        variant === "yellow"  && "bg-[rgba(210,153,34,0.15)] text-[var(--yellow)]",
        variant === "purple"  && "bg-[rgba(188,140,255,0.15)] text-[var(--purple)]",
        variant === "outline" && "border border-[var(--border)] text-[var(--muted)]",
        className
      )}
      {...props}
    />
  );
}
