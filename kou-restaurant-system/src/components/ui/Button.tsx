import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-semibold select-none " +
  "transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out " +
  "motion-safe:active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-300 " +
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-50 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-ember-400 text-ink-950 shadow-[0_8px_30px_-8px_rgb(255_148_80/0.6)] hover:bg-ember-300 hover:shadow-[0_10px_36px_-8px_rgb(255_148_80/0.75)]",
  secondary: "glass text-sand-50 hover:bg-white/10 hover:border-white/20",
  ghost: "text-sand-200 hover:text-sand-50 hover:bg-white/5",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string): string {
  return cn(base, variants[variant], sizes[size], className);
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkProps = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; external?: boolean };

export function Button({ variant, size, className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...rest} />;
}

export function ButtonLink({ variant, size, className, external, ...rest }: LinkProps) {
  const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return <a className={buttonClasses(variant, size, className)} {...externalProps} {...rest} />;
}
