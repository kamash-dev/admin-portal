import * as React from "react";
import { cn } from "~/utils/cn";

const base =
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30 disabled:pointer-events-none disabled:opacity-50";

const buttonVariantClasses = {
  default: "bg-admin-primary text-white hover:bg-admin-primary-hover",
  outline: "border border-admin-border bg-white text-slate-700 hover:bg-admin-bg",
  ghost: "text-slate-700 hover:bg-admin-bg",
} as const;

const buttonSizeClasses = {
  default: "h-9 px-4 py-2",
  sm: "h-8 px-3",
  icon: "h-9 w-9",
} as const;

export type ButtonVariant = keyof typeof buttonVariantClasses;
export type ButtonSize = keyof typeof buttonSizeClasses;

export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, buttonVariantClasses[variant], buttonSizeClasses[size], className);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
);
Button.displayName = "Button";
